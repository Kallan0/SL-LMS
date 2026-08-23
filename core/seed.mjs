/**
 * seed.mjs - Seeds ISL lessons using raw pg (no Prisma client dependency)
 * Run: node seed.mjs
 */

import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const lessons = [
  { title: "Introduction to ISL", description: "Learn about Indian Sign Language, its history, and the alphabet system. This lesson covers the basics of hand positioning and finger movements.", signLabel: "INTRO", order: 1, duration: 10, videoUrl: "https://www.youtube.com/embed/6gVmAB6p88M" },
  { title: "ISL Alphabet A-E", description: "Master the first five letters of the Indian Sign Language alphabet: A, B, C, D, and E. Practice hand shapes and finger positions for each letter.", signLabel: "A-E", order: 2, duration: 15, videoUrl: "https://www.youtube.com/embed/ykzHlCfPX2o" },
  { title: "ISL Alphabet F-J", description: "Continue building your alphabet skills with letters F, G, H, I, and J. Each sign is demonstrated with clear hand positioning guidance.", signLabel: "F-J", order: 3, duration: 15, videoUrl: "https://www.youtube.com/embed/ykzHlCfPX2o" },
  { title: "ISL Alphabet K-O", description: "Learn letters K, L, M, N, and O in Indian Sign Language. These signs involve subtle finger and thumb movements.", signLabel: "K-O", order: 4, duration: 15, videoUrl: "https://www.youtube.com/embed/ykzHlCfPX2o" },
  { title: "ISL Alphabet P-T", description: "Master letters P, Q, R, S, and T. Practice makes perfect with these commonly used signs.", signLabel: "P-T", order: 5, duration: 15, videoUrl: "https://www.youtube.com/embed/ykzHlCfPX2o" },
  { title: "ISL Alphabet U-Z", description: "Complete your alphabet knowledge with letters U, V, W, X, Y, and Z. These final letters round out your ISL vocabulary foundation.", signLabel: "U-Z", order: 6, duration: 15, videoUrl: "https://www.youtube.com/embed/ykzHlCfPX2o" },
  { title: "Numbers 1-10 in ISL", description: "Learn to sign numbers 1 through 10 in Indian Sign Language. Essential for everyday counting and number communication.", signLabel: "1-10", order: 7, duration: 12, videoUrl: "https://www.youtube.com/embed/UJCV2aYgEIw" },
  { title: "Basic Greetings in ISL", description: "Learn essential greetings: Hello, Good Morning, Good Afternoon, Good Evening, and Goodbye in Indian Sign Language.", signLabel: "HELLO", order: 8, duration: 10, videoUrl: "https://www.youtube.com/embed/8pG0YBz5bXA" },
  { title: "Common Phrases in ISL", description: "Build your conversational skills with phrases like 'How are you?', 'Thank you', 'Please', and 'Sorry' in Indian Sign Language.", signLabel: "PHRASES", order: 9, duration: 20, videoUrl: "https://www.youtube.com/embed/8pG0YBz5bXA" },
  { title: "ISL Conversation Practice", description: "Put it all together! Practice real conversations using ISL greetings, alphabet, and common phrases. Learn to chain signs fluently.", signLabel: "CONVO", order: 10, duration: 25, videoUrl: "https://www.youtube.com/embed/8pG0YBz5bXA" },
];

async function seed() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Clear existing progress then lessons
    await client.query("DELETE FROM \"Progress\"");
    await client.query("DELETE FROM \"Lesson\"");
    console.log("Cleared existing data.");

    for (const l of lessons) {
      const res = await client.query(
        `INSERT INTO "Lesson" ("id", "title", "description", "signLabel", "videoUrl", "order", "duration", "createdAt")
         VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, NOW())
         RETURNING "id", "title", "order"`,
        [l.title, l.description, l.signLabel, l.videoUrl, l.order, l.duration]
      );
      console.log(`  [${l.order}] ${res.rows[0].title} (${res.rows[0].id})`);
    }

    // Add the assessment lesson
    const assessRes = await client.query(
      `INSERT INTO "Lesson" ("id", "title", "description", "signLabel", "order", "duration", "createdAt")
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, NOW())
       RETURNING "id", "title", "order"`,
      ["ISL Alphabet Assessment", "AI-powered assessment of your ISL alphabet recognition skills using webcam and machine learning.", "ASSESSMENT", 11, 10]
    );
    console.log(`  [11] ${assessRes.rows[0].title} (${assessRes.rows[0].id})`);

    await client.query("COMMIT");
    console.log(`\nSeeded ${lessons.length + 1} lessons successfully.`);

    // Verify
    const all = await client.query('SELECT "order", "title", "id" FROM "Lesson" ORDER BY "order"');
    console.log("\nAll lessons:");
    for (const r of all.rows) {
      console.log(`  ${r.order}. ${r.title}`);
    }
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Seed failed:", err);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
