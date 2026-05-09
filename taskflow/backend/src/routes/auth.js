import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../db/pool.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// ── Helpers
function signToken(userId) {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

function safeUser(row) {
  const { password_hash, ...rest } = row;
  return rest;
}

// ── POST /api/auth/register
router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Validation
    if (!name?.trim())                      return res.status(400).json({ message: 'Name is required' });
    if (!email?.trim())                     return res.status(400).json({ message: 'Email is required' });
    if (!password || password.length < 8)   return res.status(400).json({ message: 'Password must be at least 8 characters' });

    const emailLower = email.toLowerCase().trim();

    // Check duplicate
    const existing = await query('SELECT id FROM users WHERE email = $1', [emailLower]);
    if (existing.rows.length) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    // Hash + insert
    const password_hash = await bcrypt.hash(password, 12);
    const { rows } = await query(
      `INSERT INTO users (name, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [name.trim(), emailLower, password_hash]
    );

    const user  = safeUser(rows[0]);
    const token = signToken(user.id);

    // Auto-create a starter project for new users
    const proj = await query(
      `INSERT INTO projects (name, description, color, owner_id)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      ['My First Project', 'Get started with TaskFlow', '#7c6ff7', user.id]
    );
    await query(
      'INSERT INTO project_members (project_id, user_id, role) VALUES ($1, $2, $3)',
      [proj.rows[0].id, user.id, 'owner']
    );

    res.status(201).json({ token, user });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const { rows } = await query(
      'SELECT * FROM users WHERE email = $1',
      [email.toLowerCase().trim()]
    );

    const user = rows[0];
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = signToken(user.id);
    res.json({ token, user: safeUser(user) });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/auth/me  (protected)
router.get('/me', authenticate, (req, res) => {
  res.json(req.user);
});

// ── PATCH /api/auth/me  (update profile)
router.patch('/me', authenticate, async (req, res, next) => {
  try {
    const { name, avatar_url } = req.body;
    const { rows } = await query(
      `UPDATE users SET
         name       = COALESCE($1, name),
         avatar_url = COALESCE($2, avatar_url)
       WHERE id = $3
       RETURNING id, name, email, avatar_url, created_at`,
      [name, avatar_url, req.user.id]
    );
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// ── POST /api/auth/change-password
router.post('/change-password', authenticate, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ message: 'New password must be at least 8 characters' });
    }

    const { rows } = await query('SELECT password_hash FROM users WHERE id = $1', [req.user.id]);
    const valid = await bcrypt.compare(currentPassword, rows[0].password_hash);
    if (!valid) return res.status(401).json({ message: 'Current password is incorrect' });

    const hash = await bcrypt.hash(newPassword, 12);
    await query('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, req.user.id]);
    res.json({ message: 'Password updated' });
  } catch (err) {
    next(err);
  }
});

export default router;
