import express from 'express';
import Attendance from '../models/Attendance.js';
import Member from '../models/Member.js';
import Session from '../models/Session.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { generateAttendancePDF } from '../utils/pdfGenerator.js';
import { sendReportEmail } from '../utils/emailService.js';

const router = express.Router();

// GET attendance for a session
router.get('/session/:sessionId', protect, async (req, res) => {
  try {
    const attendance = await Attendance.find({ sessionId: req.params.sessionId }).populate('memberId');
    res.json(attendance);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// POST mark attendance (single) - for QR
router.post('/mark', protect, async (req, res) => {
  try {
    const { memberId, sessionId, status } = req.body;
    
    const existing = await Attendance.findOne({ memberId, sessionId });
    if (existing) {
      existing.status = status;
      await existing.save();
      return res.json(existing);
    }
    
    const attendance = new Attendance({ memberId, sessionId, status });
    await attendance.save();
    res.status(201).json(attendance);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// POST bulk mark attendance
router.post('/bulk', protect, authorize('Mentor', 'Coordinator', 'HOD'), async (req, res) => {
  try {
    const { sessionId, records } = req.body;
    
    const operations = records.map(record => ({
      updateOne: {
        filter: { memberId: record.memberId, sessionId },
        update: { $set: { status: record.status } },
        upsert: true
      }
    }));
    
    await Attendance.bulkWrite(operations);
    res.json({ message: 'Attendance updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// POST send attendance report
router.post('/send-report/:sessionId', protect, authorize('Mentor', 'Coordinator', 'HOD'), async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await Session.findById(sessionId);
    if (!session) return res.status(404).json({ message: 'Session not found' });

    const attendanceRecords = await Attendance.find({ sessionId, status: 'Absent' }).populate('memberId');
    const absentees = attendanceRecords.map(a => a.memberId);

    // Generate PDF
    const pdfPath = await generateAttendancePDF(session, absentees);

    // Send to HOD & Coordinator
    const adminEmails = [process.env.HOD_EMAIL || 'hod@example.com', 'coordinator@example.com'];
    await sendReportEmail(
      adminEmails,
      `Innovation Team Attendance Report: ${session.sessionName}`,
      `Please find attached the attendance report for the session held on ${new Date(session.date).toLocaleDateString()}.`,
      pdfPath
    );

    // Send individual emails to absentees
    for (const student of absentees) {
      if (student.email) {
        await sendReportEmail(
          [student.email],
          `Absence Notification: ${session.sessionName}`,
          `Dear ${student.name},\n\nYou were marked absent for the innovation session "${session.sessionName}" on ${new Date(session.date).toLocaleDateString()}.\n\nPlease contact your mentor for more details.\n\nRegards,\nInnovation Cell`,
          null
        );
      }
    }

    res.json({ message: 'Reports sent successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

// POST test email (for verifying Gmail config)
router.post('/test-email', protect, authorize('Mentor', 'Coordinator'), async (req, res) => {
  try {
    const { to } = req.body;
    const recipient = to || process.env.EMAIL_USER || 'test@example.com';

    const sent = await sendReportEmail(
      [recipient],
      'InnoTrack Email Test',
      'This is a test email from InnoTrack. If you received it, the Gmail SMTP configuration is working correctly.',
      null
    );

    if (!sent) {
      return res.status(400).json({
        message: 'Email could not be sent. Check EMAIL_USER and EMAIL_PASS in the server .env file.'
      });
    }

    res.json({ message: `Test email sent successfully to ${recipient}` });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

// GET defaulters list (< 75% attendance)
router.get('/defaulters', protect, async (req, res) => {
  try {
    const totalSessions = await Session.countDocuments();
    if (totalSessions === 0) return res.json([]);

    const members = await Member.find({});
    const defaulters = [];

    for (const member of members) {
      const presentCount = await Attendance.countDocuments({ memberId: member._id, status: 'Present' });
      const attendancePercentage = (presentCount / totalSessions) * 100;
      
      if (attendancePercentage < 75) {
        defaulters.push({
          member,
          attendancePercentage: attendancePercentage.toFixed(2),
          presentCount,
          totalSessions
        });
      }
    }

    res.json(defaulters);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

export default router;
