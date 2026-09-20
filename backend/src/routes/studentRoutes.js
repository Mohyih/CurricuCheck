const express = require('express');
const router = express.Router();
const { getMe, getMyRecords, saveMyRecords, updateYearLevel, updatePreferredLoad, updateProfile, deleteAccount, sendAdvisingPDF, getRoadmap, getCurriculumDocuments  } = require('../controllers/studentController');
const { protect } = require('../middleware/authMiddleware');


router.get('/me', protect, getMe);
router.get('/me/records', protect, getMyRecords);
router.post('/me/records', protect, saveMyRecords);
router.patch('/me/year-level', protect, updateYearLevel);
router.patch('/me/preferred-load', protect, updatePreferredLoad);
router.patch('/me/profile', protect, updateProfile);
router.delete('/me', protect, deleteAccount);
router.post('/me/send-advising-pdf', protect, sendAdvisingPDF);
router.get('/me/roadmap', protect, getRoadmap);
router.get('/me/curriculum-documents', protect, getCurriculumDocuments);

module.exports = router;