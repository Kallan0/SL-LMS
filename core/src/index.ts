import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { PrismaClient, ProgressStatus } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

dotenv.config();

// 2. Initialize Prisma using the adapter
const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // Allows Railway public proxy SSL
  },
});

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET_KEY || 'secret';

app.use(cors({ origin: process.env.ALLOWED_ORIGINS?.split(',') || '*' }));
app.use(express.json());

// --- Middleware: Verify JWT ---
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access token required' });

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token' });
    req.user = user;
    next();
  });
};

// --- AUTH: REGISTER ---
app.post('/auth/register', async (req, res) => {
  const { email, username, password, role } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, username, password: hashedPassword, role: role === 'mentor' ? 'MENTOR' : 'STUDENT' }
    });
    res.json({ id: user.id, email: user.email, username: user.username });
  } catch (err) {
    res.status(400).json({ error: 'Registration failed or user exists' });
  }
});

// --- AUTH: LOGIN ---
app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
  res.json({
    token: { access_token: token, token_type: 'bearer' },
    user: { id: user.id, email: user.email, username: user.username, xp: user.xp, streak: user.streak }
  });
});

// --- PROGRESS: SAVE ASSESSMENT RESULTS ---
app.post('/progress/complete', authenticateToken, async (req: any, res) => {
  const { lessonId, accuracy } = req.body;
  const userId = req.user.id;

  try {
    const record = await prisma.progress.upsert({
      where: { userId_lessonId: { userId, lessonId } },
      update: { accuracy, status: ProgressStatus.COMPLETED },
      create: { userId, lessonId, accuracy, status: ProgressStatus.COMPLETED }
    });

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { xp: { increment: 100 }, streak: { increment: 1 } }
    });

    res.json({ record, xp: updatedUser.xp, streak: updatedUser.streak });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update progress' });
  }
});

// --- LEADERBOARD ---
app.get('/leaderboard', async (req, res) => {
  const topUsers = await prisma.user.findMany({
    take: 10,
    orderBy: { xp: 'desc' },
    select: { id: true, username: true, xp: true, streak: true, avatarUrl: true }
  });
  res.json(topUsers);
});

app.listen(PORT, () => console.log(`Core Backend running on port ${PORT}`));