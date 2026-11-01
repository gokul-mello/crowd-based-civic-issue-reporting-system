const test = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const app = require('../app');
const { connectDB, disconnectDB } = require('../config/db');
const User = require('../models/User');
const Department = require('../models/Department');
const Complaint = require('../models/Complaint');
const Vote = require('../models/Vote');

let citizenToken = '';
let authorityToken = '';
let citizenId = '';
let complaintMongoId = '';

test.before(async () => {
  await connectDB();
  // Clear any existing test data
  await User.deleteMany({});
  await Department.deleteMany({});
  await Complaint.deleteMany({});
  await Vote.deleteMany({});
});

test.after(async () => {
  await disconnectDB();
});

test('1. Citizen Registration and Validation', async () => {
  const res = await request(app)
    .post('/api/auth/register')
    .send({
      name: 'Test Citizen User',
      email: 'citizen.test@civicconnect.local',
      password: 'Password123!',
      confirmPassword: 'Password123!'
    });

  assert.strictEqual(res.status, 201);
  assert.strictEqual(res.body.success, true);
  assert.ok(res.body.token);
  assert.strictEqual(res.body.user.role, 'citizen');
  citizenToken = res.body.token;
  citizenId = res.body.user.id;
});

test('2. Citizen Login with valid credentials', async () => {
  const res = await request(app)
    .post('/api/auth/login')
    .send({
      email: 'citizen.test@civicconnect.local',
      password: 'Password123!'
    });

  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.success, true);
  assert.ok(res.body.token);
});

test('3. Citizen Login with invalid credentials returns 401', async () => {
  const res = await request(app)
    .post('/api/auth/login')
    .send({
      email: 'citizen.test@civicconnect.local',
      password: 'WrongPassword'
    });

  assert.strictEqual(res.status, 401);
  assert.strictEqual(res.body.success, false);
});

test('4. Seed Authority Account and test Authority Login', async () => {
  const bcrypt = require('bcryptjs');
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('Admin@Civic2026!', salt);

  const dept = await Department.create({
    name: 'Road Infrastructure Dept',
    code: 'RID',
    description: 'Roads and highway repairs'
  });

  await User.create({
    name: 'Super Commissioner',
    email: 'commissioner@civicconnect.gov.in',
    passwordHash,
    role: 'authority',
    department: dept._id
  });

  const res = await request(app)
    .post('/api/auth/authority/login')
    .send({
      email: 'commissioner@civicconnect.gov.in',
      password: 'Admin@Civic2026!'
    });

  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.success, true);
  assert.strictEqual(res.body.user.role, 'authority');
  authorityToken = res.body.token;
});

test('5. Citizen is FORBIDDEN from accessing Authority Endpoints', async () => {
  const res = await request(app)
    .get('/api/authority/dashboard')
    .set('Authorization', `Bearer ${citizenToken}`);

  assert.strictEqual(res.status, 403);
  assert.strictEqual(res.body.success, false);
});

test('6. Authority CAN access Authority Dashboard', async () => {
  const res = await request(app)
    .get('/api/authority/dashboard')
    .set('Authorization', `Bearer ${authorityToken}`);

  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.success, true);
  assert.ok(res.body.stats);
});

test('7. AI Complaint Generation endpoint transforms everyday text', async () => {
  const res = await request(app)
    .post('/api/complaints/generate-ai')
    .set('Authorization', `Bearer ${citizenToken}`)
    .send({
      originalDescription: 'Very deep water leak on road causing accident hazard',
      category: 'Water Supply & Leakage',
      area: 'Market Circle'
    });

  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.success, true);
  assert.ok(res.body.data.professionalTitle);
  assert.ok(res.body.data.professionalDescription);
});

test('8. Citizen Complaint Submission and Database persistence', async () => {
  const res = await request(app)
    .post('/api/complaints')
    .set('Authorization', `Bearer ${citizenToken}`)
    .send({
      originalDescription: 'There is a big pothole near the station',
      professionalTitle: 'Urgent Road Redressal for Station Pothole',
      professionalDescription: 'To the Municipal Authority, I request urgent repair of potholes near Station Road.',
      category: 'Roads & Potholes',
      area: 'Station Road',
      location: 'Near Metro Gate 2',
      suggestedUrgency: 'High'
    });

  assert.strictEqual(res.status, 201);
  assert.strictEqual(res.body.success, true);
  assert.ok(res.body.data.complaintId);
  complaintMongoId = res.body.data._id;
});

test('9. Citizen CANNOT vote for their own complaint', async () => {
  const res = await request(app)
    .post(`/api/complaints/${complaintMongoId}/vote`)
    .set('Authorization', `Bearer ${citizenToken}`);

  assert.strictEqual(res.status, 400);
  assert.match(res.body.message, /cannot vote for your own/i);
});

test('10. Another authenticated citizen CAN vote and increments vote count', async () => {
  // Register second citizen
  const regRes = await request(app)
    .post('/api/auth/register')
    .send({
      name: 'Second Citizen',
      email: 'citizen2@civicconnect.local',
      password: 'Password123!',
      confirmPassword: 'Password123!'
    });

  const citizen2Token = regRes.body.token;

  const voteRes = await request(app)
    .post(`/api/complaints/${complaintMongoId}/vote`)
    .set('Authorization', `Bearer ${citizen2Token}`);

  assert.strictEqual(voteRes.status, 200);
  assert.strictEqual(voteRes.body.voteCount, 1);

  // Duplicate voting prevention: try voting a second time
  const dupVoteRes = await request(app)
    .post(`/api/complaints/${complaintMongoId}/vote`)
    .set('Authorization', `Bearer ${citizen2Token}`);

  assert.strictEqual(dupVoteRes.status, 400);
  assert.match(dupVoteRes.body.message, /already voted/i);
});

test('11. Authority status update with mandatory resolution notes', async () => {
  // Try resolving without notes -> Should fail
  const failRes = await request(app)
    .patch(`/api/authority/complaints/${complaintMongoId}/status`)
    .set('Authorization', `Bearer ${authorityToken}`)
    .send({
      status: 'Resolved'
    });

  assert.strictEqual(failRes.status, 400);

  // Provide proper resolution notes -> Should succeed
  const okRes = await request(app)
    .patch(`/api/authority/complaints/${complaintMongoId}/status`)
    .set('Authorization', `Bearer ${authorityToken}`)
    .send({
      status: 'Resolved',
      resolutionNotes: 'Inspection carried out by PWD. Pothole filled and sealed with bitumen.'
    });

  assert.strictEqual(okRes.status, 200);
  assert.strictEqual(okRes.body.data.status, 'Resolved');
});
