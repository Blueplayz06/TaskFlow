import jwt from 'jsonwebtoken';
import { query } from '../db/pool.js';

// ── Verify JWT and attach req.user
export async function authenticate(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = header.slice(7);
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch fresh user from DB (catches deleted/banned users)
    const { rows } = await query(
      'SELECT id, name, email, avatar_url FROM users WHERE id = $1',
      [payload.userId]
    );

    if (!rows.length) {
      return res.status(401).json({ message: 'User not found' });
    }

    req.user = rows[0];
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    next(err);
  }
}

// ── Require membership in a project
export async function requireProjectMember(req, res, next) {
  try {
    const projectId = req.params.projectId || req.body.project_id || req.query.project_id;
    if (!projectId) return next();

    const { rows } = await query(
      'SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2',
      [projectId, req.user.id]
    );

    if (!rows.length) {
      return res.status(403).json({ message: 'Not a member of this project' });
    }

    req.projectRole = rows[0].role;
    next();
  } catch (err) {
    next(err);
  }
}
