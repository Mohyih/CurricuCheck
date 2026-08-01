const express = require('express');
const router = express.Router();
const { scanGrades } = require('../controllers/scanGradesController');
const { protect } = require('../middleware/authMiddleware');

router.post('/scan-grades', protect, scanGrades);

module.exports = router;