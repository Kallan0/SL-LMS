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

// Online users tracking (userId -> last seen timestamp)
const onlineUsers = new Map<string, number>();
const ONLINE_THRESHOLD = 30000; // 30 seconds

const markOnline = (userId: string) => { onlineUsers.set(userId, Date.now()); };
const isOnline = (userId: string) => {
  const lastSeen = onlineUsers.get(userId);
  return lastSeen ? (Date.now() - lastSeen) < ONLINE_THRESHOLD : false;
};

// Middleware
const allowedOrigins = [
  'https://sl-lms-ten.vercel.app',
  process.env.FRONTEND_URL 
];
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (curl, server-to-server, same-origin)
    if (!origin) return callback(null, true);
    // Allow any localhost origin in development
    if (/^https?:\/\/localhost(:\d+)?$/.test(origin)) return callback(null, true);
    // Honour explicit ALLOWED_ORIGINS list
    if (allowedOrigins && allowedOrigins.length > 0 && allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
}));
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

// ============================================================
// AUTH
// ============================================================

// --- AUTH: REGISTER ---
app.post('/auth/register', async (req: Request, res: Response) => {
  const { email, username, password, role, firstName, lastName } = req.body;

  if (!email || !password || !username) {
    return res.status(400).json({ error: 'Email, password, and username are required' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
        role: role === 'mentor' ? 'MENTOR' : 'STUDENT',
        firstName,
        lastName,
      },
    });
    res.json({ id: user.id, email: user.email, username: user.username });
  } catch (err: any) {
    // Prisma unique constraint violation (P2002)
    if (err?.code === 'P2002') {
      return res.status(409).json({ error: 'An account with this email already exists. Please log in or use a different email.' });
    }
    console.error('[register]', err);
    res.status(400).json({ error: 'Registration failed. Please try again.' });
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
    const userId = req.user!.id;
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

// --- PROFILE: UPDATE PROFILE (PUT) ---
app.put('/users/me', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
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

// --- PROFILE: UPDATE PROFILE (PATCH) ---
app.patch('/users/me', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
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

// ============================================================
// LESSONS
// ============================================================

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

// --- LESSONS: FETCH SINGLE LESSON ---
app.get('/lessons/:id', async (req: Request, res: Response) => {
  try {
    const lesson = await prisma.lesson.findUnique({
      where: { id: req.params.id as string },
    });

    if (!lesson) return res.status(404).json({ error: 'Lesson not found' });
    res.json(lesson);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch lesson' });
  }
});

// ============================================================
// PROGRESS
// ============================================================

// --- PROGRESS: GET ALL USER PROGRESS ---
app.get('/progress', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const progress = await prisma.progress.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    });
    res.json(progress);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch progress' });
  }
});

// --- PROGRESS: GET PROGRESS FOR SPECIFIC LESSON ---
app.get('/progress/:lessonId', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const lessonId = req.params.lessonId as string;

    const progress = await prisma.progress.findUnique({
      where: { userId_lessonId: { userId, lessonId } },
    });

    if (!progress) {
      return res.status(404).json({ error: 'No progress found for this lesson' });
    }

    res.json(progress);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch lesson progress' });
  }
});

// --- PROGRESS: UPDATE PROGRESS ---
app.patch('/progress/:lessonId', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const lessonId = req.params.lessonId as string;
    const { status, accuracy } = req.body;

    const progress = await prisma.progress.upsert({
      where: { userId_lessonId: { userId, lessonId } },
      update: {
        ...(status && { status }),
        ...(accuracy !== undefined && { accuracy }),
      },
      create: {
        userId,
        lessonId,
        status: status || ProgressStatus.NOT_STARTED,
        accuracy: accuracy || 0,
      },
    });

    res.json(progress);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update progress' });
  }
});

// --- PROGRESS: SAVE ASSESSMENT RESULTS ---
app.post('/progress/complete', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const lessonId = req.body.lessonId as string;
  const accuracy = req.body.accuracy;
  const userId = req.user!.id;

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

// ============================================================
// ACHIEVEMENTS (stub — returns empty array until implemented)
// ============================================================

app.get('/achievements', authenticateToken, async (_req: AuthenticatedRequest, res: Response) => {
  res.json([]);
});

// ============================================================
// QUIZ (stub endpoints)
// ============================================================

app.get('/lessons/:id/quiz', async (req: Request, res: Response) => {
  res.json([]);
});

app.post('/lessons/:id/quiz/submit', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  res.json({ score: 0, total: 0, passed: false });
});

// ============================================================
// LEADERBOARD
// ============================================================

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

// ============================================================
// MENTOR ROUTES (require MENTOR role)
// ============================================================

const requireMentor = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (req.user?.role !== 'MENTOR') return res.status(403).json({ error: 'Mentor access required' });
  next();
};

// --- MENTOR: GET ALL STUDENTS ---
app.get('/mentor/students', authenticateToken, requireMentor, async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const students = await prisma.user.findMany({
      where: { role: 'STUDENT' },
      select: {
        id: true, email: true, username: true, firstName: true, lastName: true,
        xp: true, streak: true, createdAt: true,
      },
      orderBy: { xp: 'desc' },
    });
    // Add progress count for each student
    const studentsWithProgress = await Promise.all(students.map(async (s: any) => {
      const progressCount = await prisma.progress.count({ where: { userId: s.id } });
      const completedCount = await prisma.progress.count({ where: { userId: s.id, status: 'COMPLETED' } });
      return { ...s, totalLessons: progressCount, completedLessons: completedCount };
    }));
    res.json(studentsWithProgress);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch students' });
  }
});

// --- MENTOR: GET STUDENT PROGRESS DETAIL ---
app.get('/mentor/students/:id/progress', authenticateToken, requireMentor, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const studentId = req.params.id as string;
    const student = await prisma.user.findUnique({
      where: { id: studentId },
      select: { id: true, email: true, username: true, firstName: true, lastName: true, xp: true, streak: true },
    });
    if (!student) return res.status(404).json({ error: 'Student not found' });

    const progress = await prisma.progress.findMany({
      where: { userId: studentId },
      include: { lesson: true },
      orderBy: { updatedAt: 'desc' },
    });
    res.json({ student, progress });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch student progress' });
  }
});

// --- LESSONS: CREATE LESSON (Mentor) ---
app.post('/lessons', authenticateToken, requireMentor, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { title, description, signLabel, videoUrl, difficulty, category, order, duration } = req.body;
    if (!title) return res.status(400).json({ error: 'Title is required' });

    // Auto-calculate order if not provided
    const maxOrder = await prisma.lesson.aggregate({ _max: { order: true } });
    const lesson = await prisma.lesson.create({
      data: {
        title,
        description,
        signLabel: signLabel || '',
        videoUrl,
        difficulty,
        category,
        order: order ?? ((maxOrder._max.order ?? 0) + 1),
        duration: duration || 5,
        createdAt: new Date(),
      },
    });
    res.json(lesson);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create lesson' });
  }
});

// --- LESSONS: UPDATE LESSON (Mentor) ---
app.put('/lessons/:id', authenticateToken, requireMentor, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { title, description, signLabel, videoUrl, difficulty, category, order, duration } = req.body;
    const lesson = await prisma.lesson.update({
      where: { id: req.params.id as string },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(signLabel !== undefined && { signLabel }),
        ...(videoUrl !== undefined && { videoUrl }),
        ...(difficulty !== undefined && { difficulty }),
        ...(category !== undefined && { category }),
        ...(order !== undefined && { order }),
        ...(duration !== undefined && { duration }),
      },
    });
    res.json(lesson);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update lesson' });
  }
});

// --- LESSONS: DELETE LESSON (Mentor) ---
app.delete('/lessons/:id', authenticateToken, requireMentor, async (req: AuthenticatedRequest, res: Response) => {
  try {
    await prisma.progress.deleteMany({ where: { lessonId: req.params.id as string } });
    await prisma.lesson.delete({ where: { id: req.params.id as string } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete lesson' });
  }
});

// ============================================================
// CHAT
// ============================================================

// --- CHAT: HEARTBEAT (mark user as online) ---
app.post('/chat/heartbeat', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  markOnline(req.user!.id);
  res.json({ ok: true });
});

// --- CHAT: GET ONLINE STATUS ---
app.get('/chat/online', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const ids: string[] = req.query.ids ? (req.query.ids as string).split(',') : [];
  const status: Record<string, boolean> = {};
  for (const id of ids) { status[id] = isOnline(id); }
  res.json(status);
});

// --- CHAT: GET CONVERSATIONS (list of people you've messaged) ---
app.get('/chat/conversations', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    markOnline(userId);
    // Find all unique people the user has messaged with
    const sent = await prisma.message.findMany({ where: { senderId: userId }, select: { receiverId: true }, distinct: ['receiverId'] });
    const received = await prisma.message.findMany({ where: { receiverId: userId }, select: { senderId: true }, distinct: ['senderId'] });
    const userIds = [...new Set([...sent.map((s: any) => s.receiverId), ...received.map((r: any) => r.senderId)])];
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, username: true, firstName: true, lastName: true, role: true },
    });
    // Get last message + online status for each conversation
    const conversations = await Promise.all(users.map(async (u: any) => {
      const lastMsg = await prisma.message.findFirst({
        where: { OR: [{ senderId: userId, receiverId: u.id }, { senderId: u.id, receiverId: userId }] },
        orderBy: { createdAt: 'desc' },
        select: { content: true, createdAt: true, senderId: true },
      });
      const unread = await prisma.message.count({
        where: { senderId: u.id, receiverId: userId, read: false },
      });
      return { ...u, lastMessage: lastMsg?.content, lastMessageAt: lastMsg?.createdAt, unreadCount: unread, online: isOnline(u.id) };
    }));
    res.json(conversations);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

// --- CHAT: GET MESSAGES WITH A USER ---
app.get('/chat/messages/:userId', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const myId = req.user!.id;
    const otherId = req.params.userId as string;
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: myId, receiverId: otherId },
          { senderId: otherId, receiverId: myId },
        ],
      },
      orderBy: { createdAt: 'asc' },
    });
    // Mark messages from the other user as read
    await prisma.message.updateMany({
      where: { senderId: otherId, receiverId: myId, read: false },
      data: { read: true },
    });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// --- CHAT: SEND MESSAGE ---
app.post('/chat/messages', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const senderId = req.user!.id;
    const { receiverId, content } = req.body;
    if (!receiverId || !content) return res.status(400).json({ error: 'receiverId and content are required' });
    const message = await prisma.message.create({
      data: { senderId, receiverId, content },
    });
    res.json(message);
  } catch (err) {
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// --- CHAT: UNREAD COUNT ---
app.get('/chat/unread', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const count = await prisma.message.count({ where: { receiverId: req.user!.id, read: false } });
    res.json({ count });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch unread count' });
  }
});

// ============================================================
// HEALTH CHECK
// ============================================================

app.get('/health', async (_req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'core-backend' });
});

app.listen(PORT, () => console.log(`Core Backend running on port ${PORT}`));