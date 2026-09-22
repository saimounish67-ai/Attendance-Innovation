import express from 'express';
import Session from '../models/Session.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// GET all sessions
router.get('/', protect, async (req, res) => {
  try {
    const sessions = await Session.find({}).sort({ date: -1 });
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// POST create session
router.post('/', protect, authorize('Mentor', 'Coordinator'), async (req, res) => {
  try {
    const { sessionName, date, time, venue, mentor, description } = req.body;
    
    const session = new Session({ sessionName, date, time, venue, mentor, description });
    await session.save();
    
    res.status(201).json(session);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

export default router;
