const express = require('express');
const router = express.Router();
const { sendOTPHandler, verifyOTPHandler } = require('../controllers/otpController');

router.post('/send', sendOTPHandler);
router.post('/verify', verifyOTPHandler);

module.exports = router;