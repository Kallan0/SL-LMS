import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { PrismaClient, ProgressStatus } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

dotenv.config();

// 1. Configure PostgreSQL Connection Pool with SSL for Railway
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // Allows Railway public proxy SSL connections
  },
});

// 2. Initialize Prisma Client with the pg adapter
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET_KEY || 'secret';

// Middleware
app.use(cors({ origin: process.env.ALLOWED_ORIGINS?.split(',') || '*' }));
app.use(express.json());

// Extended Request Interface to include JWT user payload
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

// --- Middleware: Verify JWT ---
const authenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access token required' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token' });
    req.user = user as { id: string; email: string; role: string };
    next();
  });
};

// --- AUTH: REGISTER ---
app.post('/auth/register', async (req: Request, res: Response) => {
  const { email, username, password, role } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
        role: role === 'mentor' ? 'MENTOR' : 'STUDENT',
      },
    });
    res.json({ id: user.id, email: user.email, username: user.username });
  } catch (err) {
    res.status(400).json({ error: 'Registration failed or user already exists' });
  }
});

// --- AUTH: LOGIN ---
app.post('/auth/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '24h' });

    res.json({
      token: { access_token: token, token_type: 'bearer' },
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        bio: user.bio,
        avatar: user.avatar,
        role: user.role,
        xp: user.xp,
        streak: user.streak,
      },
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error during authentication' });
  }
});

// --- PROFILE: GET CURRENT USER ---
app.get('/users/me', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        bio: true,
        avatar: true,
        role: true,
        xp: true,
        streak: true,
      },
    });

    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

// --- PROFILE: UPDATE PROFILE DETAILS ---
app.put('/users/me', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { firstName, lastName, bio, avatar } = req.body;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { firstName, lastName, bio, avatar },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        bio: true,
        avatar: true,
        role: true,
        xp: true,
        streak: true,
      },
    });

    res.json(updatedUser);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update user profile' });
  }
});

// --- LESSONS: FETCH ALL LESSONS ---
app.get('/lessons', async (_req: Request, res: Response) => {
  try {
    const lessons = await prisma.lesson.findMany({
      orderBy: { order: 'asc' },
    });
    res.json(lessons);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch lessons' });
  }
});

// --- PROGRESS: SAVE ASSESSMENT RESULTS ---
app.post('/progress/complete', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const { lessonId, accuracy } = req.body;
  const userId = req.user?.id;

  if (!userId) return res.status(401).json({ error: 'User missing from token' });

  try {
    const record = await prisma.progress.upsert({
      where: { userId_lessonId: { userId, lessonId } },
      update: { accuracy, status: ProgressStatus.COMPLETED },
      create: { userId, lessonId, accuracy, status: ProgressStatus.COMPLETED },
    });

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { xp: { increment: 100 }, streak: { increment: 1 } },
    });

    res.json({ record, xp: updatedUser.xp, streak: updatedUser.streak });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update progress' });
  }
});

// --- LEADERBOARD ---
app.get('/leaderboard', async (_req: Request, res: Response) => {
  try {
    const topUsers = await prisma.user.findMany({
      take: 10,
      orderBy: { xp: 'desc' },
      select: { id: true, username: true, xp: true, streak: true, avatar: true },
    });
    res.json(topUsers);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

app.listen(PORT, () => console.log(`Core Backend running on port ${PORT}`));