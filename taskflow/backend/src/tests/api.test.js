/**
 * Integration tests — run with: npm test
 * Requires a running test database (or use docker-compose test profile)
 */
import request from 'supertest';
import app     from '../src/server.js';

let token;
let projectId;
let taskId;
const testEmail = `test_${Date.now()}@taskflow.io`;

describe('Auth', () => {
  test('POST /api/auth/register — creates user + project', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Test User', email: testEmail, password: 'password123' });

    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe(testEmail);
    token = res.body.token;
  });

  test('POST /api/auth/login — returns token', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: testEmail, password: 'password123' });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  test('POST /api/auth/login — wrong password → 401', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: testEmail, password: 'wrongpassword' });
    expect(res.status).toBe(401);
  });

  test('GET /api/auth/me — returns user', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.email).toBe(testEmail);
  });

  test('GET /api/auth/me — no token → 401', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });
});

describe('Projects', () => {
  test('GET /api/projects — returns user projects', async () => {
    const res = await request(app)
      .get('/api/projects')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    projectId = res.body[0]?.id;
  });

  test('POST /api/projects — creates project', async () => {
    const res = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Test Project', color: '#22c988' });
    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Test Project');
  });
});

describe('Tasks', () => {
  test('POST /api/tasks — creates task', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({
        project_id: projectId,
        title: 'Test task',
        priority: 'high',
        tag: 'Backend',
        status: 'todo',
      });
    expect(res.status).toBe(201);
    expect(res.body.title).toBe('Test task');
    taskId = res.body.id;
  });

  test('GET /api/tasks — returns tasks for project', async () => {
    const res = await request(app)
      .get(`/api/tasks?project_id=${projectId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.some((t) => t.id === taskId)).toBe(true);
  });

  test('PUT /api/tasks/:id — updates task', async () => {
    const res = await request(app)
      .put(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Updated title', status: 'inprogress', priority: 'high', tag: 'Backend', progress: 50 });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('inprogress');
    expect(res.body.progress).toBe(50);
  });

  test('PATCH /api/tasks/:id/reorder — moves to done column', async () => {
    const res = await request(app)
      .patch(`/api/tasks/${taskId}/reorder`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'done', sort_order: 0 });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('done');
  });

  test('DELETE /api/tasks/:id — deletes task', async () => {
    const res = await request(app)
      .delete(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(204);
  });
});

describe('Health', () => {
  test('GET /health — returns ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});
