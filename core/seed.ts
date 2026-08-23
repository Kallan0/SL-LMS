/**
 * seed.ts
 * Seeds the database with ISL (Indian Sign Language) lessons.
 * Each lesson includes a title, description, difficulty, category,
 * sign label, and embedded YouTube video URL.
 *
 * Run: npx tsx seed.ts
 */

import { PrismaClient, ProgressStatus } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config({ path: "../core/.env" });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const lessons = [
  {
    title: "Introduction to ISL",
    description: "Learn about Indian Sign Language, its history, and the alphabet system. This lesson covers the basics of hand positioning and finger movements.",
    signLabel: "INTRO",
    order: 1,
    duration: 10,
    difficulty: "BEGINNER",
    category: "GRAMMAR",
    videoUrl: "https://www.youtube.com/embed/6gVmAB6p88M",
  },
  {
    title: "ISL Alphabet A-E",
    description: "Master the first five letters of the Indian Sign Language alphabet: A, B, C, D, and E. Practice hand shapes and finger positions for each letter.",
    signLabel: "A-E",
    order: 2,
    duration: 15,
    difficulty: "BEGINNER",
    category: "ALPHABET",
    videoUrl: "https://www.youtube.com/embed/ykzHlCfPX2o",
  },
  {
    title: "ISL Alphabet F-J",
    description: "Continue building your alphabet skills with letters F, G, H, I, and J. Each sign is demonstrated with clear hand positioning guidance.",
    signLabel: "F-J",
    order: 3,
    duration: 15,
    difficulty: "BEGINNER",
    category: "ALPHABET",
    videoUrl: "https://www.youtube.com/embed/ykzHlCfPX2o",
  },
  {
    title: "ISL Alphabet K-O",
    description: "Learn letters K, L, M, N, and O in Indian Sign Language. These signs involve subtle finger and thumb movements.",
    signLabel: "K-O",
    order: 4,
    duration: 15,
    difficulty: "BEGINNER",
    category: "ALPHABET",
    videoUrl: "https://www.youtube.com/embed/ykzHlCfPX2o",
  },
  {
    title: "ISL Alphabet P-T",
    description: "Master letters P, Q, R, S, and T. Practice makes perfect with these commonly used signs.",
    signLabel: "P-T",
    order: 5,
    duration: 15,
    difficulty: "INTERMEDIATE",
    category: "ALPHABET",
    videoUrl: "https://www.youtube.com/embed/ykzHlCfPX2o",
  },
  {
    title: "ISL Alphabet U-Z",
    description: "Complete your alphabet knowledge with letters U, V, W, X, Y, and Z. These final letters round out your ISL vocabulary foundation.",
    signLabel: "U-Z",
    order: 6,
    duration: 15,
    difficulty: "INTERMEDIATE",
    category: "ALPHABET",
    videoUrl: "https://www.youtube.com/embed/ykzHlCfPX2o",
  },
  {
    title: "Numbers 1-10 in ISL",
    description: "Learn to sign numbers 1 through 10 in Indian Sign Language. Essential for everyday counting and number communication.",
    signLabel: "1-10",
    order: 7,
    duration: 12,
    difficulty: "BEGINNER",
    category: "NUMBERS",
    videoUrl: "https://www.youtube.com/embed/UJCV2aYgEIw",
  },
  {
    title: "Basic Greetings in ISL",
    description: "Learn essential greetings: Hello, Good Morning, Good Afternoon, Good Evening, and Goodbye in Indian Sign Language.",
    signLabel: "HELLO",
    order: 8,
    duration: 10,
    difficulty: "BEGINNER",
    category: "PHRASES",
    videoUrl: "https://www.youtube.com/embed/8pG0YBz5bXA",
  },
  {
    title: "Common Phrases in ISL",
    description: "Build your conversational skills with phrases like 'How are you?', 'Thank you', 'Please', and 'Sorry' in Indian Sign Language.",
    signLabel: "PHRASES",
    order: 9,
    duration: 20,
    difficulty: "INTERMEDIATE",
    category: "PHRASES",
    videoUrl: "https://www.youtube.com/embed/8pG0YBz5bXA",
  },
  {
    title: "ISL Conversation Practice",
    description: "Put it all together! Practice real conversations using ISL greetings, alphabet, and common phrases. Learn to chain signs fluently.",
    signLabel: "CONVO",
    order: 10,
    duration: 25,
    difficulty: "ADVANCED",
    category: "CONVERSATION",
    videoUrl: "https://www.youtube.com/embed/8pG0YBz5bXA",
  },
];

async function seed() {
  console.log("Seeding ISL lessons...\n");

  // Clear existing lessons
  await prisma.progress.deleteMany();
  await prisma.lesson.deleteMany();
  console.log("Cleared existing lessons and progress.\n");

  for (const lesson of lessons) {
    const created = await prisma.lesson.create({
      data: {
        title: lesson.title,
        description: lesson.description,
        signLabel: lesson.signLabel,
        order: lesson.order,
        duration: lesson.duration,
      },
    });
    console.log(`  [${created.order}] ${created.title} (${created.signLabel})`);
  }

  // Also create the assessment-isl-alphabet lesson for progress/complete endpoint
  await prisma.lesson.create({
    data: {
      title: "ISL Alphabet Assessment",
      description: "AI-powered assessment of your ISL alphabet recognition skills using webcam and machine learning.",
      signLabel: "ASSESSMENT",
      order: 11,
      duration: 10,
    },
  });
  console.log(`  [11] ISL Alphabet Assessment (ASSESSMENT)`);

  console.log(`\nSeeded ${lessons.length + 1} lessons successfully.`);

  // List all lessons
  const all = await prisma.lesson.findMany({ orderBy: { order: "asc" } });
  console.log("\nAll lessons in database:");
  for (const l of all) {
    console.log(`  ${l.order}. ${l.title} [${l.id}]`);
  }

  await prisma.$disconnect();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
