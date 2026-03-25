const express = require('express');
const { getGames, getRecentGames, playSimpleGame } = require('../controllers/games.controller');
const auth = require('../middleware/auth.middleware');
const idempotency = require('../middleware/idempotency.middleware');
const { rateLimit } = require('../middleware/rate-limit.middleware');

const router = express.Router();

router.get('/', rateLimit('games'), getGames);
router.get('/recent', rateLimit('games'), getRecentGames);
router.post('/play', auth, rateLimit('games'), idempotency, playSimpleGame);

module.exports = router;
