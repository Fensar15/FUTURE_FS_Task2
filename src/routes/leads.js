import express from 'express';
import { randomUUID } from 'crypto';
import { db } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();
const STATUSES = ['new', 'contacted', 'converted'];

router.use(requireAuth);

// GET /api/leads?search=&status=
router.get('/', async (req, res) => {
  await db.read();
  let leads = [...db.data.leads];

  const { search, status } = req.query;

  if (status && STATUSES.includes(status)) {
    leads = leads.filter((l) => l.status === status);
  }

  if (search && search.trim()) {
    const q = search.trim().toLowerCase();
    leads = leads.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        l.email.toLowerCase().includes(q) ||
        (l.source || '').toLowerCase().includes(q)
    );
  }

  leads.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  res.json({ leads });
});

// GET /api/leads/stats — must be declared before /:id so "stats" isn't read as an id
router.get('/stats', async (req, res) => {
  await db.read();
  const leads = db.data.leads;
  const total = leads.length;

  const counts = STATUSES.reduce((acc, s) => {
    acc[s] = leads.filter((l) => l.status === s).length;
    return acc;
  }, {});

  const conversionRate = total ? Math.round((counts.converted / total) * 100) : 0;

  res.json({ total, ...counts, conversionRate });
});

// GET /api/leads/:id
router.get('/:id', async (req, res) => {
  await db.read();
  const lead = db.data.leads.find((l) => l.id === req.params.id);
  if (!lead) return res.status(404).json({ error: 'Lead not found.' });
  res.json({ lead });
});

// PATCH /api/leads/:id/status   body: { status }
router.patch('/:id/status', async (req, res) => {
  const { status } = req.body || {};
  if (!STATUSES.includes(status)) {
    return res.status(400).json({ error: `Status must be one of: ${STATUSES.join(', ')}` });
  }

  await db.read();
  const lead = db.data.leads.find((l) => l.id === req.params.id);
  if (!lead) return res.status(404).json({ error: 'Lead not found.' });

  lead.status = status;
  lead.updatedAt = new Date().toISOString();
  await db.write();

  res.json({ lead });
});

// POST /api/leads/:id/notes   body: { content }
router.post('/:id/notes', async (req, res) => {
  const { content } = req.body || {};
  if (!content || !content.trim()) {
    return res.status(400).json({ error: 'Note content is required.' });
  }

  await db.read();
  const lead = db.data.leads.find((l) => l.id === req.params.id);
  if (!lead) return res.status(404).json({ error: 'Lead not found.' });

  const note = { id: randomUUID(), content: content.trim(), createdAt: new Date().toISOString() };
  lead.notes.push(note);
  lead.updatedAt = new Date().toISOString();
  await db.write();

  res.status(201).json({ note, lead });
});

// DELETE /api/leads/:id
router.delete('/:id', async (req, res) => {
  await db.read();
  const idx = db.data.leads.findIndex((l) => l.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Lead not found.' });

  db.data.leads.splice(idx, 1);
  await db.write();

  res.json({ message: 'Lead deleted.' });
});

export default router;
