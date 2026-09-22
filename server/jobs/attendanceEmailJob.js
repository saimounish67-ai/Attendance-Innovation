import cron from 'node-cron';
import Attendance from '../models/Attendance.js';
import Session from '../models/Session.js';
import { sendReportEmail } from '../utils/emailService.js';

const scheduleExpression = process.env.EMAIL_JOB_CRON || '0 18 * * *';

const buildStudentAbsenceMessage = (student, sessionNames) => {
  const sessionText = sessionNames.length > 0 ? sessionNames.join(', ') : 'the scheduled session';

  return `Dear ${student.name},\n\nYou were marked absent for the following session(s): ${sessionText}.\n\nPlease contact your mentor or coordinator for more details.\n\nRegards,\nInnoTrack Attendance System`;
};

const sendDailyAbsenceNotifications = async () => {
  try {
    const today = new Date();
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    const todaysSessions = await Session.find({
      date: { $gte: startOfDay, $lte: endOfDay }
    });

    if (!todaysSessions.length) {
      console.log('No sessions scheduled today. Daily attendance email job skipped.');
      return;
    }

    const sessionIds = todaysSessions.map((session) => session._id);
    const absentRecords = await Attendance.find({
      sessionId: { $in: sessionIds },
      status: 'Absent'
    }).populate('memberId').populate('sessionId');

    if (!absentRecords.length) {
      console.log('No absentees found for today. Daily attendance email job skipped.');
      return;
    }

    const studentMap = new Map();

    for (const record of absentRecords) {
      const member = record.memberId;
      if (!member || !member.email) continue;

      if (!studentMap.has(member._id.toString())) {
        studentMap.set(member._id.toString(), {
          ...member.toObject(),
          sessionNames: []
        });
      }

      const studentEntry = studentMap.get(member._id.toString());
      const sessionName = record.sessionId?.sessionName || 'Session';
      if (!studentEntry.sessionNames.includes(sessionName)) {
        studentEntry.sessionNames.push(sessionName);
      }
    }

    const absenteeStudents = [...studentMap.values()];

    for (const student of absenteeStudents) {
      const emailSent = await sendReportEmail(
        [student.email],
        `Absence Notification - ${student.sessionNames.join(', ')}`,
        buildStudentAbsenceMessage(student, student.sessionNames),
        null
      );

      if (emailSent) {
        console.log(`Sent absentee email to ${student.name} (${student.email})`);
      }
    }

    const hodEmail = process.env.HOD_EMAIL || 'hod@example.com';
    const adminEmails = [hodEmail];
    const dailyAbsenteeList = absenteeStudents
      .map((student, index) => `${index + 1}. ${student.name} (${student.teamId}) - ${student.email}`)
      .join('\n');

    const hodMessage = `Daily absentee report for ${today.toDateString()}\n\nTotal absentees: ${absenteeStudents.length}\n\n${dailyAbsenteeList || 'No absentees found.'}`;

    const reportSent = await sendReportEmail(
      adminEmails,
      `Daily Attendance Report - ${today.toDateString()}`,
      hodMessage,
      null
    );

    if (reportSent) {
      console.log(`Sent daily attendance report to ${adminEmails.join(', ')}`);
    }
  } catch (error) {
    console.error('Attendance email job failed:', error.message);
  }
};

cron.schedule(scheduleExpression, async () => {
  console.log('Running daily attendance email job...');
  await sendDailyAbsenceNotifications();
});

console.log(`Attendance email job scheduled with expression: ${scheduleExpression}`);
