import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import { MongoMemoryServer } from 'mongodb-memory-server';
import User from './models/User.js';
import Member from './models/Member.js';
import Session from './models/Session.js';
import Attendance from './models/Attendance.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/innotrack';

async function seed() {
  try {
    if (MONGODB_URI.includes('<') || MONGODB_URI.includes('cluster-url')) {
      console.error('❌ MONGODB_URI contains unconfigured placeholder values like <username> or <cluster-url>.');
      console.error('   Please replace them in server/.env with your real MongoDB Atlas connection details.');
      process.exit(1);
    }

    const isLiveDb = MONGODB_URI.startsWith('mongodb+srv://') || (!MONGODB_URI.includes('127.0.0.1') && !MONGODB_URI.includes('localhost'));
    const maskedUri = MONGODB_URI.replace(/:([^:@]+)@/, ':****@');
    console.log(`Connecting to ${isLiveDb ? 'Live Cloud MongoDB Atlas' : 'MongoDB'} at ${maskedUri}...`);

    try {
      await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
      console.log(`✅ Connected to ${isLiveDb ? 'Live MongoDB Atlas' : 'MongoDB'} for seeding.`);
    } catch (err) {
      console.error(`❌ Connection failed to ${isLiveDb ? 'Live MongoDB Atlas' : 'MongoDB'}:`, err.message);
      if (!isLiveDb) {
        console.warn('   To run with a live cloud database, update MONGODB_URI in server/.env with your MongoDB Atlas connection string.');
      }
      process.exit(1);
    }

    // Clear existing data
    await User.deleteMany({});
    await Member.deleteMany({});
    await Session.deleteMany({});
    await Attendance.deleteMany({});
    console.log('Cleared old records.');

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
    await User.insertMany(users);
    console.log(`Created ${users.length} Users (Password: password123)`);

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
    console.log(`Created ${createdMembers.length} team members`);

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
    console.log(`Created ${createdSessions.length} innovation sessions`);

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

    // Session 3 (Today): Recent
    createdMembers.forEach((m, idx) => {
      attendanceRecords.push({
        memberId: m._id,
        sessionId: createdSessions[2]._id,
        status: idx === 6 || idx === 7 ? 'Absent' : 'Present'
      });
    });

    await Attendance.insertMany(attendanceRecords);
    console.log(`Created ${attendanceRecords.length} attendance records`);

    console.log('\n--- SEEDING COMPLETE ---');
    console.log('Test Credentials:');
    console.log('  Mentor:      username="mentor",     password="password123"');
    console.log('  HOD:         username="hod",        password="password123"');
    console.log('  Coordinator: username="coordinator", password="password123"');
    console.log('  Students:    username="INNO-001" to "INNO-008", password="password123"');
    console.log('-------------------------\n');

    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding error:', err.message);
    process.exit(1);
  }
}

seed();