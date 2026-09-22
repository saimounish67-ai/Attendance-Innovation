import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema({
  sessionName: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  time: {
    type: String,
    required: true
  },
  venue: {
    type: String,
    required: true
  },
  mentor: {
    type: String,
    required: true
  },
  description: {
    type: String
  }
}, { timestamps: true });

export default mongoose.model('Session', sessionSchema);
