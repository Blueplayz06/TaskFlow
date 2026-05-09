import { Router } from 'express';
import { query } from '../db/pool.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

// ── GET /api/projects  — list projects user belongs to
router.get('/', async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT p.*, pm.role,
         (SELECT COUNT(*) FROM tasks WHERE project_id = p.id) AS task_count,
         (SELECT COUNT(*) FROM project_members WHERE project_id = p.id) AS member_count
       FROM projects p
       JOIN project_members pm ON pm.project_id = p.id
       WHERE pm.user_id = $1
       ORDER BY p.created_at DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// ── GET /api/projects/:id
router.get('/:id', async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT p.*, pm.role FROM projects p
       JOIN project_members pm ON pm.project_id = p.id
       WHERE p.id = $1 AND pm.user_id = $2`,
      [req.params.id, req.user.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Project not found' });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// ── POST /api/projects
router.post('/', async (req, res, next) => {
  try {
    const { name, description = '', color = '#7c6ff7', due_date } = req.body;
    if (!name?.trim()) return res.status(400).json({ message: 'Name is required' });

    const { rows } = await query(
      `INSERT INTO projects (name, description, color, owner_id, due_date)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [name.trim(), description, color, req.user.id, due_date || null]
    );
    await query(
      'INSERT INTO project_members (project_id, user_id, role) VALUES ($1,$2,$3)',
      [rows[0].id, req.user.id, 'owner']
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// ── PUT /api/projects/:id
router.put('/:id', async (req, res, next) => {
  try {
    const { name, description, color, due_date } = req.body;

    // Only owner can edit
    const { rows: perm } = await query(
      'SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (!perm.length || perm[0].role !== 'owner') {
      return res.status(403).json({ message: 'Only the project owner can edit it' });
    }

    const { rows } = await query(
      `UPDATE projects SET
         name        = COALESCE($1, name),
         description = COALESCE($2, description),
         color       = COALESCE($3, color),
         due_date    = COALESCE($4, due_date)
       WHERE id = $5 RETURNING *`,
      [name, description, color, due_date, req.params.id]
    );
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// ── DELETE /api/projects/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const { rows: perm } = await query(
      'SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (!perm.length || perm[0].role !== 'owner') {
      return res.status(403).json({ message: 'Only the owner can delete this project' });
    }
    await query('DELETE FROM projects WHERE id = $1', [req.params.id]);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

// ── GET /api/projects/:id/members
router.get('/:id/members', async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT u.id, u.name, u.email, u.avatar_url, pm.role, pm.joined_at
       FROM project_members pm
       JOIN users u ON u.id = pm.user_id
       WHERE pm.project_id = $1`,
      [req.params.id]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// ── POST /api/projects/:id/members  (invite by email)
router.post('/:id/members', async (req, res, next) => {
  try {
    const { email, role = 'member' } = req.body;

    // Must be owner to invite
    const { rows: perm } = await query(
      'SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (!perm.length || perm[0].role !== 'owner') {
      return res.status(403).json({ message: 'Only owners can invite members' });
    }

    const { rows: users } = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (!users.length) return res.status(404).json({ message: 'User not found with that email' });

    await query(
      `INSERT INTO project_members (project_id, user_id, role)
       VALUES ($1,$2,$3) ON CONFLICT DO NOTHING`,
      [req.params.id, users[0].id, role]
    );
    res.status(201).json({ message: 'Member added' });
  } catch (err) {
    next(err);
  }
});

export default router;
