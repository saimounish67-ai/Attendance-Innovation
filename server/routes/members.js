import express from 'express';
import bcrypt from 'bcrypt';
import Member from '../models/Member.js';
import User from '../models/User.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// GET all members
router.get('/', protect, async (req, res) => {
  try {
    const members = await Member.find({}).sort({ teamId: 1 });
    res.json(members);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

// POST add new member
router.post('/', protect, authorize('Mentor', 'Coordinator', 'HOD'), async (req, res) => {
  try {
    const { teamId, name, department, year, email, phone } = req.body;
    
    if (!teamId || !name || !department || !year || !email) {
      return res.status(400).json({ message: 'All required fields (Team ID, Name, Department, Year, Email) must be filled.' });
    }

    const trimmedTeamId = teamId.trim().toUpperCase();
    const trimmedEmail = email.trim().toLowerCase();

    const memberExists = await Member.findOne({ teamId: trimmedTeamId });
    if (memberExists) {
      return res.status(400).json({ message: `Member with Team ID ${trimmedTeamId} already exists` });
    }

    const emailExists = await Member.findOne({ email: trimmedEmail });
    if (emailExists) {
      return res.status(400).json({ message: `Member with email ${trimmedEmail} already exists` });
    }

    const member = new Member({
      teamId: trimmedTeamId,
      name: name.trim(),
      department: department.trim(),
      year: year.trim(),
      email: trimmedEmail,
      phone: (phone || '').trim()
    });
    await member.save();

    // Automatically create a student user login account with default password 'password123'
    const existingUser = await User.findOne({ username: trimmedTeamId });
    if (!existingUser) {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash('password123', salt);
      await User.create({
        username: trimmedTeamId,
        password: passwordHash,
        role: 'Student'
      });
    }
    
    res.status(201).json(member);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Team ID or email already exists' });
    }
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

// PUT update member
router.put('/:id', protect, authorize('Mentor', 'Coordinator', 'HOD'), async (req, res) => {
  try {
    const member = await Member.findById(req.params.id);
    if (!member) {
      return res.status(404).json({ message: 'Member not found' });
    }

    const oldTeamId = member.teamId;
    Object.assign(member, req.body);
    if (req.body.teamId) {
      member.teamId = req.body.teamId.trim().toUpperCase();
    }
    if (req.body.email) {
      member.email = req.body.email.trim().toLowerCase();
    }
    await member.save();

    // Update username if teamId changed
    if (req.body.teamId && oldTeamId !== member.teamId) {
      await User.updateOne({ username: oldTeamId }, { username: member.teamId });
    }
    
    res.json(member);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

// DELETE member
router.delete('/:id', protect, authorize('Mentor', 'Coordinator', 'HOD'), async (req, res) => {
  try {
    const member = await Member.findById(req.params.id);
    if (!member) {
      return res.status(404).json({ message: 'Member not found' });
    }

    // Remove member and associated login user
    await User.deleteOne({ username: member.teamId });
    await Member.findByIdAndDelete(req.params.id);

    res.json({ message: 'Member and user account removed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

export default router;
