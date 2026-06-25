import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

import { initDB } from './src/db.js';
import authRoutes from './src/routes/auth.js';
import leadRoutes from './src/routes/leads.js';
import publicRoutes from './src/routes/public.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

await initDB();

app.use('/api/auth', authRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/public', publicRoutes);

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use(express.static(path.join(__dirname, 'public')));

app.listen(PORT, () => {
  console.log('');
  console.log(`Mini CRM is running:`);
  console.log(`   Admin dashboard:     http://localhost:${PORT}/login.html`);
  console.log(`   Public contact form: http://localhost:${PORT}/contact.html`);
  console.log('');
});
