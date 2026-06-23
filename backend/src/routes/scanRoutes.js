const express = require('express');
const router = express.Router();
const { scanId, upload } = require('../controllers/scanController');

router.post('/scan-id', upload.single('id_image'), scanId);

module.exports = router;