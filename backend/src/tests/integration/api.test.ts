import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { app } from '../../app.js'

describe('API Health & Endpoint Integration Tests', () => {
  it('GET /api/health should return 200 OK with healthy status', async () => {
    const res = await request(app).get('/api/health')
    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.message).toBe('API is healthy')
  })

  it('GET /api/health/ready should return database/redis readiness status', async () => {
    const res = await request(app).get('/api/health/ready')
    expect([200, 503]).toContain(res.status)
    expect(res.body.checks).toBeDefined()
    expect(res.body.checks.database).toBeDefined()
    expect(res.body.checks.redis).toBeDefined()
  })

  it('GET /api/auth/me should return 401 Unauthorized for unauthenticated requests', async () => {
    const res = await request(app).get('/api/auth/me')
    expect(res.status).toBe(401)
    expect(res.body.success).toBe(false)
  })

  it('GET /api/workspaces should return 401 Unauthorized without auth cookie', async () => {
    const res = await request(app).get('/api/workspaces')
    expect(res.status).toBe(401)
  })

  it('POST /api/auth/login should fail with invalid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nonexistent@example.com', password: 'wrongpassword' })
    expect(res.status).toBe(401)
    expect(res.body.success).toBe(false)
  })
})
