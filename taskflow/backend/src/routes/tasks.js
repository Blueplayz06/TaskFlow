import { Router } from 'express';
import { query } from '../db/pool.js';
import { authenticate, requireProjectMember } from '../middleware/auth.js';

const router = Router();

// All task routes require auth
router.use(authenticate);

// ── GET /api/tasks?project_id=1
// Returns all tasks for a project, ordered by status + sort_order
router.get('/', requireProjectMember, async (req, res, next) => {
  try {
    const { project_id, status, priority, assignee_id } = req.query;

    if (!project_id) {
      return res.status(400).json({ message: 'project_id is required' });
    }

    // Build dynamic WHERE clauses
    const conditions = ['t.project_id = $1'];
    const params     = [project_id];
    let   paramIdx   = 2;

    if (status) {
      conditions.push(`t.status = $${paramIdx++}`);
      params.push(status);
    }
    if (priority) {
      conditions.push(`t.priority = $${paramIdx++}`);
      params.push(priority);
    }
    if (assignee_id) {
      conditions.push(`t.assignee_id = $${paramIdx++}`);
      params.push(assignee_id);
    }

    const { rows } = await query(
      `SELECT
         t.*,
         u.name  AS assignee_name,
         u.email AS assignee_email,
         u.avatar_url AS assignee_avatar
       FROM tasks t
       LEFT JOIN users u ON u.id = t.assignee_id
       WHERE ${conditions.join(' AND ')}
       ORDER BY
         CASE t.status
           WHEN 'backlog'    THEN 1
           WHEN 'todo'       THEN 2
           WHEN 'inprogress' THEN 3
           WHEN 'review'     THEN 4
           WHEN 'done'       THEN 5
         END,
         t.sort_order ASC,
         t.created_at ASC`,
      params
    );

    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// ── GET /api/tasks/:id
router.get('/:id', async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT t.*, u.name AS assignee_name, u.email AS assignee_email
       FROM tasks t
       LEFT JOIN users u ON u.id = t.assignee_id
       WHERE t.id = $1`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Task not found' });

    // Verify user has access to this task's project
    const member = await query(
      'SELECT 1 FROM project_members WHERE project_id = $1 AND user_id = $2',
      [rows[0].project_id, req.user.id]
    );
    if (!member.rows.length) return res.status(403).json({ message: 'Access denied' });

    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// ── POST /api/tasks
router.post('/', async (req, res, next) => {
  try {
    const {
      project_id, title, description = '',
      status = 'todo', priority = 'medium',
      tag = 'Other', progress = 0,
      due_date = null, assignee_id = null,
      assignee_name = null,
    } = req.body;

    if (!project_id) return res.status(400).json({ message: 'project_id is required' });
    if (!title?.trim()) return res.status(400).json({ message: 'Title is required' });

    // Verify project membership
    const member = await query(
      'SELECT 1 FROM project_members WHERE project_id = $1 AND user_id = $2',
      [project_id, req.user.id]
    );
    if (!member.rows.length) return res.status(403).json({ message: 'Not a member of this project' });

    // Resolve assignee_id from name if not provided
    let resolvedAssigneeId = assignee_id;
    if (!resolvedAssigneeId && assignee_name) {
      const u = await query(
        `SELECT u.id FROM users u
         JOIN project_members pm ON pm.user_id = u.id
         WHERE pm.project_id = $1 AND u.name ILIKE $2
         LIMIT 1`,
        [project_id, `%${assignee_name}%`]
      );
      resolvedAssigneeId = u.rows[0]?.id || null;
    }

    // Place at end of the column
    const orderRes = await query(
      'SELECT COALESCE(MAX(sort_order), -1) + 1 AS next_order FROM tasks WHERE project_id = $1 AND status = $2',
      [project_id, status]
    );
    const sort_order = orderRes.rows[0].next_order;

    const { rows } = await query(
      `INSERT INTO tasks
         (project_id, title, description, status, priority, tag, progress, sort_order, due_date, assignee_id, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       RETURNING *`,
      [project_id, title.trim(), description, status, priority, tag, progress, sort_order, due_date || null, resolvedAssigneeId, req.user.id]
    );

    // Enrich with assignee info
    let task = rows[0];
    if (task.assignee_id) {
      const u = await query('SELECT name, email FROM users WHERE id = $1', [task.assignee_id]);
      task = { ...task, assignee_name: u.rows[0]?.name, assignee_email: u.rows[0]?.email };
    } else {
      task = { ...task, assignee_name: assignee_name || null };
    }

    res.status(201).json(task);
  } catch (err) {
    next(err);
  }
});

// ── PUT /api/tasks/:id  (full update)
router.put('/:id', async (req, res, next) => {
  try {
    const { rows: existing } = await query('SELECT * FROM tasks WHERE id = $1', [req.params.id]);
    if (!existing.length) return res.status(404).json({ message: 'Task not found' });

    const t = existing[0];

    // Auth check
    const member = await query(
      'SELECT 1 FROM project_members WHERE project_id = $1 AND user_id = $2',
      [t.project_id, req.user.id]
    );
    if (!member.rows.length) return res.status(403).json({ message: 'Access denied' });

    const {
      title       = t.title,
      description = t.description,
      status      = t.status,
      priority    = t.priority,
      tag         = t.tag,
      progress    = t.progress,
      due_date    = t.due_date,
      assignee_id = t.assignee_id,
    } = req.body;

    const { rows } = await query(
      `UPDATE tasks SET
         title       = $1,
         description = $2,
         status      = $3,
         priority    = $4,
         tag         = $5,
         progress    = $6,
         due_date    = $7,
         assignee_id = $8
       WHERE id = $9
       RETURNING *`,
      [title, description, status, priority, tag, progress, due_date || null, assignee_id || null, req.params.id]
    );

    // Enrich
    let task = rows[0];
    if (task.assignee_id) {
      const u = await query('SELECT name, email FROM users WHERE id = $1', [task.assignee_id]);
      task = { ...task, assignee_name: u.rows[0]?.name };
    }

    res.json(task);
  } catch (err) {
    next(err);
  }
});

// ── PATCH /api/tasks/:id/reorder  (drag-drop)
// Body: { status, sort_order }
router.patch('/:id/reorder', async (req, res, next) => {
  try {
    const { status, sort_order } = req.body;
    const taskId = Number(req.params.id);

    const { rows: existing } = await query('SELECT * FROM tasks WHERE id = $1', [taskId]);
    if (!existing.length) return res.status(404).json({ message: 'Task not found' });

    const t = existing[0];

    // Auth check
    const member = await query(
      'SELECT 1 FROM project_members WHERE project_id = $1 AND user_id = $2',
      [t.project_id, req.user.id]
    );
    if (!member.rows.length) return res.status(403).json({ message: 'Access denied' });

    // Shift other tasks in the target column to make room
    if (status && status !== t.status) {
      await query(
        `UPDATE tasks SET sort_order = sort_order + 1
         WHERE project_id = $1 AND status = $2 AND sort_order >= $3 AND id != $4`,
        [t.project_id, status, sort_order ?? 0, taskId]
      );
    }

    const { rows } = await query(
      `UPDATE tasks SET
         status     = COALESCE($1, status),
         sort_order = COALESCE($2, sort_order)
       WHERE id = $3
       RETURNING *`,
      [status || null, sort_order ?? null, taskId]
    );

    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// ── DELETE /api/tasks/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const { rows } = await query('SELECT project_id FROM tasks WHERE id = $1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: 'Task not found' });

    const member = await query(
      'SELECT 1 FROM project_members WHERE project_id = $1 AND user_id = $2',
      [rows[0].project_id, req.user.id]
    );
    if (!member.rows.length) return res.status(403).json({ message: 'Access denied' });

    await query('DELETE FROM tasks WHERE id = $1', [req.params.id]);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
