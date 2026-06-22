const express = require('express');
const router = express.Router();
const { getMe, getMyRecords, saveMyRecords, updateYearLevel, updatePreferredLoad } = require('../controllers/studentController');
const { protect } = require('../middleware/authMiddleware');

router.get('/me', protect, getMe);
router.get('/me/records', protect, getMyRecords);
router.post('/me/records', protect, saveMyRecords);
router.patch('/me/year-level', protect, updateYearLevel);
router.patch('/me/preferred-load', protect, updatePreferredLoad);

module.exports = router;