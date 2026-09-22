import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const generateAttendancePDF = async (session, absentees) => {
  return new Promise((resolve, reject) => {
    try {
      const reportsDir = path.join(__dirname, '../reports');
      if (!fs.existsSync(reportsDir)) {
        fs.mkdirSync(reportsDir);
      }

      const pdfPath = path.join(reportsDir, `attendance_${session._id}.pdf`);
      const doc = new PDFDocument({ margin: 50 });
      
      const stream = fs.createWriteStream(pdfPath);
      doc.pipe(stream);

      // Header
      doc.fontSize(20).text('Innovation Cell', { align: 'center' });
      doc.moveDown();
      doc.fontSize(16).text('InnoTrack - Smart Attendance Report', { align: 'center' });
      doc.moveDown(2);

      // Session Details
      doc.fontSize(12).text(`Session Name: ${session.sessionName}`);
      doc.text(`Date: ${new Date(session.date).toLocaleDateString()}`);
      doc.text(`Venue: ${session.venue}`);
      doc.text(`Mentor: ${session.mentor}`);
      doc.moveDown(2);

      // Absentee List
      doc.fontSize(14).text('Absent Students List:', { underline: true });
      doc.moveDown();

      if (absentees.length === 0) {
        doc.fontSize(12).text('All students were present.');
      } else {
        absentees.forEach((student, i) => {
          doc.fontSize(12).text(`${i + 1}. ${student.name} (${student.teamId}) - ${student.department}`);
        });
      }

      doc.end();

      stream.on('finish', () => resolve(pdfPath));
      stream.on('error', reject);
    } catch (error) {
      reject(error);
    }
  });
};
