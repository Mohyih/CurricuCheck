const express = require('express');
const router = express.Router();
const { evaluate, advisingSummary } = require('../controllers/evaluationController');
const { protect } = require('../middleware/authMiddleware');

router.get('/evaluate', protect, evaluate);
router.get('/advising-summary', protect, advisingSummary);

module.exports = router;