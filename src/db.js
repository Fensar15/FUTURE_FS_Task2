import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbFile = path.join(__dirname, '..', 'db.json');
const adapter = new JSONFile(dbFile);
const defaultData = { admins: [], leads: [] };

export const db = new Low(adapter, defaultData);

// Sets up the database file on first run: creates the admin account from
// .env (or admin/admin123 if none is set) and drops in a few sample leads
// so the dashboard isn't empty the first time you open it.
export async function initDB() {
  await db.read();
  db.data ||= structuredClone(defaultData);
  db.data.admins ||= [];
  db.data.leads ||= [];

  if (db.data.admins.length === 0) {
    const username = process.env.ADMIN_USERNAME || 'admin';
    const password = process.env.ADMIN_PASSWORD || 'admin123';

    db.data.admins.push({
      id: randomUUID(),
      username,
      passwordHash: bcrypt.hashSync(password, 10),
      createdAt: new Date().toISOString(),
    });

    console.log(`No admin account found — created one.`);
    console.log(`   Username: ${username}`);
    console.log(`   Password: ${password}`);
    console.log(`   (change this in production by editing your .env file before first run)`);
  }

  if (db.data.leads.length === 0) {
    const daysAgo = (n) => new Date(Date.now() - n * 86400000).toISOString();

    const sampleLeads = [
      {
        name: 'Amare Bekele',
        email: 'amare.bekele@example.com',
        phone: '+251 91 100 0000',
        source: 'Website Contact Form',
        message: 'Hi, I would like a quote for a branding and logo package for my new cafe.',
        status: 'new',
        createdAt: daysAgo(1),
        updatedAt: daysAgo(1),
        notes: [],
      },
      {
        name: 'Sara Tesfaye',
        email: 'sara.tesfaye@example.com',
        phone: '+251 92 200 0000',
        source: 'Instagram Ad',
        message: 'Can you send me pricing for a monthly SEO retainer?',
        status: 'contacted',
        createdAt: daysAgo(3),
        updatedAt: daysAgo(2),
        notes: [
          {
            id: randomUUID(),
            content: 'Called and left a voicemail, also sent the SEO pricing sheet by email.',
            createdAt: daysAgo(2),
          },
        ],
      },
      {
        name: 'John Mensah',
        email: 'john.mensah@example.com',
        phone: '+233 24 400 0000',
        source: 'Referral — Kwame Asante',
        message: 'Referred by Kwame, looking to rebuild our company website on a modern stack.',
        status: 'converted',
        createdAt: daysAgo(10),
        updatedAt: daysAgo(4),
        notes: [
          { id: randomUUID(), content: 'Discovery call booked for Thursday.', createdAt: daysAgo(9) },
          { id: randomUUID(), content: 'Sent proposal — $4,200, 6 week timeline.', createdAt: daysAgo(7) },
          { id: randomUUID(), content: 'Signed! Kickoff call scheduled for Monday.', createdAt: daysAgo(4) },
        ],
      },
    ];

    db.data.leads = sampleLeads.map((lead) => ({ id: randomUUID(), ...lead }));
  }

  await db.write();
}
