const express = require('express');
const router = express.Router();
const { recommend } = require('../controllers/recommendationController');
const { protect } = require('../middleware/authMiddleware');

router.get('/recommend', protect, recommend);

module.exports = router;