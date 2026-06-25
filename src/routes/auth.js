import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../db.js';

const router = express.Router();

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { username, password } = req.body || {};

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  await db.read();
  const admin = db.data.admins.find((a) => a.username === username);

  if (!admin || !bcrypt.compareSync(password, admin.passwordHash)) {
    return res.status(401).json({ error: 'Invalid username or password.' });
  }

  const secret = process.env.JWT_SECRET || 'dev_secret_change_me';
  const token = jwt.sign({ id: admin.id, username: admin.username }, secret, { expiresIn: '8h' });

  res.json({ token, username: admin.username });
});

export default router;
