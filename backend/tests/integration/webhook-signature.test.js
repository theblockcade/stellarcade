const request = require('supertest');
const crypto = require('crypto');
const app = require('../../src/server');

describe('Webhook Signature Middleware', () => {
  const SECRET = process.env.WEBHOOK_SECRET || 'test-secret';
  const ENDPOINT = '/api/v1/webhook';
  let originalSecret;

  beforeAll(() => {
    originalSecret = process.env.WEBHOOK_SECRET;
    process.env.WEBHOOK_SECRET = SECRET;
  });

  afterAll(() => {
    process.env.WEBHOOK_SECRET = originalSecret;
  });

  const generateSignature = (payloadString, secret = SECRET) => {
    return crypto
      .createHmac('sha256', secret)
      .update(payloadString)
      .digest('hex');
  };

  it('should return 401 if x-webhook-signature header is missing', async () => {
    const res = await request(app)
      .post(ENDPOINT)
      .send({ some: 'data' });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Missing webhook signature');
  });

  it('should return 401 if header is malformed', async () => {
    const res = await request(app)
      .post(ENDPOINT)
      .set('x-webhook-signature', 't=1234')
      .send({ some: 'data' });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Malformed webhook signature');
  });

  it('should return 401 if signature is expired (replay attack)', async () => {
    const oldTimestamp = Date.now() - 10 * 60 * 1000; // 10 minutes ago
    const payload = JSON.stringify({ event: 'test' });
    const payloadString = `${oldTimestamp}.${payload}`;
    const sig = generateSignature(payloadString);

    const res = await request(app)
      .post(ENDPOINT)
      .set('x-webhook-signature', `t=${oldTimestamp},v1=${sig}`)
      .set('Content-Type', 'application/json')
      .send(payload);

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Webhook signature expired');
  });

  it('should return 401 if signature is from the future', async () => {
    const futureTimestamp = Date.now() + 10 * 60 * 1000; // 10 minutes ahead
    const payload = JSON.stringify({ event: 'test' });
    const payloadString = `${futureTimestamp}.${payload}`;
    const sig = generateSignature(payloadString);

    const res = await request(app)
      .post(ENDPOINT)
      .set('x-webhook-signature', `t=${futureTimestamp},v1=${sig}`)
      .set('Content-Type', 'application/json')
      .send(payload);

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Webhook signature timestamp invalid');
  });

  it('should return 401 if valid timestamp but invalid signature (tampering)', async () => {
    const timestamp = Date.now();
    const payload = JSON.stringify({ event: 'test' });

    const res = await request(app)
      .post(ENDPOINT)
      .set('x-webhook-signature', `t=${timestamp},v1=invalid_sig_abcdef123`)
      .set('Content-Type', 'application/json')
      .send(payload);

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid webhook signature');
  });

  it('should return 200 for a valid timestamp and signature', async () => {
    const timestamp = Date.now();
    const payload = JSON.stringify({ event: 'test', magicNumber: 42 });
    const payloadString = `${timestamp}.${payload}`;
    const sig = generateSignature(payloadString);

    const res = await request(app)
      .post(ENDPOINT)
      .set('x-webhook-signature', `t=${timestamp},v1=${sig}`)
      .set('Content-Type', 'application/json')
      .send(payload);

    expect(res.status).toBe(200);
    expect(res.body.received).toBe(true);
  });
});
