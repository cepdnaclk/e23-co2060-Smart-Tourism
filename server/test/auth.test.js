const test = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const express = require('express');
const { authenticate, requireRole, requireSelf } = require('../src/middleware/auth');
const adminRoutes = require('../src/routes/adminRoutes');
const userRoutes = require('../src/routes/userRoutes');
const itineraryRoutes = require('../src/routes/itinerariesRoutes');

const TEST_SECRET = 'authorization-test-secret';

function createResponse() {
    return {
        statusCode: 200,
        body: null,
        status(code) {
            this.statusCode = code;
            return this;
        },
        json(body) {
            this.body = body;
            return this;
        }
    };
}

function createToken(userId, role) {
    return jwt.sign(
        { userId, email: `${role}@example.com`, role },
        TEST_SECRET,
        { expiresIn: '5m' }
    );
}

async function withServer(app, callback) {
    const server = await new Promise((resolve) => {
        const listener = app.listen(0, '127.0.0.1', () => resolve(listener));
    });
    try {
        const address = server.address();
        await callback(`http://127.0.0.1:${address.port}`);
    } finally {
        await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    }
}

test.beforeEach(() => {
    process.env.JWT_SECRET = TEST_SECRET;
});

test('authenticate rejects requests without a bearer token', () => {
    const req = { headers: {} };
    const res = createResponse();
    let nextCalled = false;

    authenticate(req, res, () => { nextCalled = true; });

    assert.equal(res.statusCode, 401);
    assert.equal(nextCalled, false);
});

test('authenticate verifies a token and exposes a normalized user', () => {
    const token = jwt.sign(
        { userId: 42, email: 'tourist@example.com', role: 'tourist' },
        TEST_SECRET,
        { expiresIn: '5m' }
    );
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = createResponse();
    let nextCalled = false;

    authenticate(req, res, () => { nextCalled = true; });

    assert.equal(nextCalled, true);
    assert.deepEqual(req.user, {
        id: 42,
        email: 'tourist@example.com',
        role: 'tourist'
    });
});

test('authenticate rejects a token signed with another secret', () => {
    const token = jwt.sign({ userId: 42, role: 'tourist' }, 'wrong-secret');
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = createResponse();

    authenticate(req, res, () => assert.fail('next must not be called'));

    assert.equal(res.statusCode, 401);
    assert.equal(res.body.error, 'Invalid authentication token');
});

test('requireRole permits listed roles and denies other roles', () => {
    const allowedReq = { user: { id: 1, role: 'admin' } };
    const allowedRes = createResponse();
    let nextCalled = false;
    requireRole('admin')(allowedReq, allowedRes, () => { nextCalled = true; });
    assert.equal(nextCalled, true);

    const deniedReq = { user: { id: 2, role: 'tourist' } };
    const deniedRes = createResponse();
    requireRole('admin')(deniedReq, deniedRes, () => assert.fail('next must not be called'));
    assert.equal(deniedRes.statusCode, 403);
});

test('requireSelf prevents access to another user while allowing the owner', () => {
    const ownerReq = { user: { id: 7, role: 'tourist' }, params: { id: '7' } };
    const ownerRes = createResponse();
    let nextCalled = false;
    requireSelf('id')(ownerReq, ownerRes, () => { nextCalled = true; });
    assert.equal(nextCalled, true);

    const otherReq = { user: { id: 7, role: 'tourist' }, params: { id: '8' } };
    const otherRes = createResponse();
    requireSelf('id')(otherReq, otherRes, () => assert.fail('next must not be called'));
    assert.equal(otherRes.statusCode, 403);
});

test('requireSelf permits an administrator only when configured', () => {
    const adminReq = { user: { id: 1, role: 'admin' }, params: { id: '8' } };
    const allowedRes = createResponse();
    let nextCalled = false;
    requireSelf('id')(adminReq, allowedRes, () => { nextCalled = true; });
    assert.equal(nextCalled, true);

    const deniedRes = createResponse();
    requireSelf('id', { allowAdmin: false })(adminReq, deniedRes, () => assert.fail('next must not be called'));
    assert.equal(deniedRes.statusCode, 403);
});

test('protected route groups enforce authentication, roles, and account ownership', async () => {
    const app = express();
    app.use(express.json());
    app.use('/api/admin', adminRoutes);
    app.use('/api/users', userRoutes);
    app.use('/api/itineraries', itineraryRoutes);

    await withServer(app, async (baseUrl) => {
        const anonymousAdminResponse = await fetch(`${baseUrl}/api/admin/tourists`);
        assert.equal(anonymousAdminResponse.status, 401);

        const touristToken = createToken(7, 'tourist');
        const touristAdminResponse = await fetch(`${baseUrl}/api/admin/tourists`, {
            headers: { Authorization: `Bearer ${touristToken}` }
        });
        assert.equal(touristAdminResponse.status, 403);

        const otherProfileResponse = await fetch(`${baseUrl}/api/users/8/profile`, {
            headers: { Authorization: `Bearer ${touristToken}` }
        });
        assert.equal(otherProfileResponse.status, 403);

        const guideToken = createToken(9, 'guide');
        const guideItineraryResponse = await fetch(`${baseUrl}/api/itineraries`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${guideToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ title: 'Not allowed' })
        });
        assert.equal(guideItineraryResponse.status, 403);
    });
});
