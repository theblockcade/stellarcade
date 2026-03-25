const express = require('express');
const { getProfile, createProfile } = require('../controllers/users.controller');
const auth = require('../middleware/auth.middleware');
const { rateLimit } = require('../middleware/rate-limit.middleware');

const router = express.Router();

router.get('/profile', auth, rateLimit('auth'), getProfile);
router.post('/create', rateLimit('auth'), createProfile);

module.exports = router;
