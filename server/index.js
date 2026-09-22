import express from 'express';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import cors from 'cors';
import dotenv from 'dotenv';
import { MongoMemoryServer } from 'mongodb-memory-server';
import User from './models/User.js';
import Member from './models/Member.js';
import Session from './models/Session.js';
import Attendance from './models/Attendance.js';
import authRoutes from './routes/auth.js';
import memberRoutes from './routes/members.js';
import sessionRoutes from './routes/sessions.js';
import attendanceRoutes from './routes/attendance.js';
import './jobs/attendanceEmailJob.js';

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/attendance', attendanceRoutes);

app.get('/', (req, res) => {
  res.send('InnoTrack API is running');
});

// Database Connection & Server Launch
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/innotrack';

async function connectDatabase() {
  const isLiveDb = MONGODB_URI.startsWith('mongodb+srv://') || (!MONGODB_URI.includes('127.0.0.1') && !MONGODB_URI.includes('localhost'));
  const maskedUri = MONGODB_URI.replace(/:([^:@]+)@/, ':****@');

  const hasPlaceholder = MONGODB_URI.includes('<') || MONGODB_URI.includes('cluster-url');
  if (hasPlaceholder) {
    console.warn('⚠️ Placeholders detected in MONGODB_URI (e.g. <username> or <cluster-url>).');
    console.warn('   Falling back to in-memory MongoDB so the server keeps running.');
    const mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri('innotrack');
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    console.log('✅ Connected to in-memory MongoDB fallback.');
    return true;
  }

  try {
    console.log(`Connecting to ${isLiveDb ? 'Live Cloud MongoDB Atlas' : 'MongoDB'} at ${maskedUri}...`);
    await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 8000 });
    console.log(`✅ Connected to ${isLiveDb ? 'Live Cloud MongoDB Atlas' : 'MongoDB'} successfully.`);
    return false; // not using in-memory
  } catch (err) {
    console.warn(`⚠️ Could not connect to ${isLiveDb ? 'Live MongoDB Atlas' : 'MongoDB'}:`, err.message);
    console.warn('   Starting in-memory MongoDB fallback...');
    const mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri('innotrack');
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    console.log('✅ Connected to in-memory MongoDB fallback.');
    return true; // using in-memory, needs seeding
  }
}

async function seedDatabase() {
  // Only seed if database is empty (in-memory starts empty, or fresh install)
  const memberCount = await Member.countDocuments();
  if (memberCount > 0) {
    console.log('📦 Database already has data, skipping seed.');
    return;
  }

  console.log('🌱 Seeding database...');

  // 1. Create Users
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('password123', salt);

  const users = [
    { username: 'mentor', password: passwordHash, role: 'Mentor' },
    { username: 'hod', password: passwordHash, role: 'HOD' },
    { username: 'coordinator', password: passwordHash, role: 'Coordinator' },
    { username: 'INNO-001', password: passwordHash, role: 'Student' },
    { username: 'INNO-002', password: passwordHash, role: 'Student' },
    { username: 'INNO-003', password: passwordHash, role: 'Student' },
    { username: 'INNO-004', password: passwordHash, role: 'Student' },
    { username: 'INNO-005', password: passwordHash, role: 'Student' },
    { username: 'INNO-006', password: passwordHash, role: 'Student' },
    { username: 'INNO-007', password: passwordHash, role: 'Student' },
    { username: 'INNO-008', password: passwordHash, role: 'Student' },
  ];

  for (const user of users) {
    await User.updateOne(
      { username: user.username },
      { $setOnInsert: user },
      { upsert: true }
    );
  }
  console.log(`  Created ${users.length} users (Password: password123)`);

  // 2. Create Members
  const membersData = [
    { teamId: 'INNO-001', name: 'Sai Mounish Ashok', department: 'BCA', year: '2nd Year', email: 'saimounish59@gmail.com', phone: '9876543210' },
    { teamId: 'INNO-002', name: 'Rahul Kumar', department: 'BCA', year: '2nd Year', email: 'rahul.kumar@example.com', phone: '9876543211' },
    { teamId: 'INNO-003', name: 'Priya Sharma', department: 'BCA', year: '2nd Year', email: 'priya.sharma@example.com', phone: '9876543212' },
    { teamId: 'INNO-004', name: 'Arjun Reddy', department: 'BCA', year: '2nd Year', email: 'arjun.reddy@example.com', phone: '9876543213' },
    { teamId: 'INNO-005', name: 'Ananya Singh', department: 'BCA', year: '2nd Year', email: 'ananya.singh@example.com', phone: '9876543214' },
    { teamId: 'INNO-006', name: 'Rohit Verma', department: 'BCA', year: '2nd Year', email: 'rohit.verma@example.com', phone: '9876543215' },
    { teamId: 'INNO-007', name: 'Sneha Patil', department: 'BCA', year: '2nd Year', email: 'sneha.patil@example.com', phone: '9876543216' },
    { teamId: 'INNO-008', name: 'Karthik N', department: 'BCA', year: '2nd Year', email: 'karthik.n@example.com', phone: '9876543217' },
  ];
  const createdMembers = await Member.insertMany(membersData);
  console.log(`  Created ${createdMembers.length} team members`);

  // 3. Create Sessions
  const sessionsData = [
    {
      sessionName: 'AI & GenAI Product Workshop',
      date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      time: '10:00 AM - 01:00 PM',
      venue: 'Innovation Lab 301',
      mentor: 'Dr. Rajesh Kumar',
      description: 'Hands-on session building intelligent conversational agents and exploring LLM pipelines.'
    },
    {
      sessionName: 'National Hackathon Sprint 2026',
      date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      time: '09:00 AM - 05:00 PM',
      venue: 'Main Auditorium',
      mentor: 'Prof. Anjali Mehta',
      description: 'Rapid prototyping and pitch development for national level smart city innovation contest.'
    },
    {
      sessionName: 'Design Thinking & Startup Ideation',
      date: new Date(),
      time: '02:00 PM - 04:30 PM',
      venue: 'Incubation Center Stage',
      mentor: 'Dr. Rajesh Kumar',
      description: 'Empathy mapping, user journey mapping, and value proposition design for new venture concepts.'
    }
  ];
  const createdSessions = await Session.insertMany(sessionsData);
  console.log(`  Created ${createdSessions.length} sessions`);

  // 4. Create Attendance Records
  const attendanceRecords = [];

  // Session 1: Most present
  createdMembers.forEach((m, idx) => {
    attendanceRecords.push({
      memberId: m._id,
      sessionId: createdSessions[0]._id,
      status: idx === 6 || idx === 7 ? 'Absent' : 'Present'
    });
  });

  // Session 2: Mixed
  createdMembers.forEach((m, idx) => {
    attendanceRecords.push({
      memberId: m._id,
      sessionId: createdSessions[1]._id,
      status: idx === 2 || idx === 6 || idx === 7 ? 'Absent' : 'Present'
    });
  });

  // Session 3 (Today)
  createdMembers.forEach((m, idx) => {
    attendanceRecords.push({
      memberId: m._id,
      sessionId: createdSessions[2]._id,
      status: idx === 6 || idx === 7 ? 'Absent' : 'Present'
    });
  });

  await Attendance.insertMany(attendanceRecords);
  console.log(`  Created ${attendanceRecords.length} attendance records`);

  console.log('✅ Seeding complete!');
  console.log('   Credentials: mentor/hod/coordinator/INNO-001..008 — password: password123');
}

const isInMemory = await connectDatabase();

// Auto-seed when using in-memory DB (always empty on start) or when DB is fresh
await seedDatabase();

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 InnoTrack Server running live on port ${PORT}`);
  console.log(`   Local URL:   http://localhost:${PORT}`);
  if (isInMemory) {
    console.log('⚠️  Notice: Using in-memory MongoDB — data will reset when server stops.');
    console.log('   Provide a live MongoDB Atlas URI in server/.env for permanent cloud storage.');
  } else {
    console.log('🌐 Connected to live persistent database.');
  }
});
