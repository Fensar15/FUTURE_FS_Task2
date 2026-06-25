import express from 'express';
import { randomUUID } from 'crypto';
import { db } from '../db.js';

const router = express.Router();

// POST /api/public/leads
// This is the endpoint a real website's contact form would POST to.
// No authentication — anyone visiting the site can submit it.
router.post('/leads', async (req, res) => {
  const { name, email, phone, message, source } = req.body || {};

  if (!name || !name.trim() || !email || !email.trim()) {
    return res.status(400).json({ error: 'Name and email are required.' });
  }

  await db.read();
  const now = new Date().toISOString();

  const lead = {
    id: randomUUID(),
    name: name.trim(),
    email: email.trim(),
    phone: (phone || '').trim(),
    source: (source || 'Website Contact Form').trim(),
    message: (message || '').trim(),
    status: 'new',
    createdAt: now,
    updatedAt: now,
    notes: [],
  };

  db.data.leads.unshift(lead);
  await db.write();

  res.status(201).json({ message: 'Thanks! We received your message and will be in touch soon.' });
});

export default router;
