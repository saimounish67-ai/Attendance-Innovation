import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema({
  memberId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Member',
    required: true
  },
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Session',
    required: true
  },
  status: {
    type: String,
    enum: ['Present', 'Absent'],
    required: true
  }
}, { timestamps: true });

// Prevent duplicate attendance for the same session and member
attendanceSchema.index({ memberId: 1, sessionId: 1 }, { unique: true });

export default mongoose.model('Attendance', attendanceSchema);
