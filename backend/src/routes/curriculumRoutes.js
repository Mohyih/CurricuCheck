const express = require('express');
const router = express.Router();
const {
  getPrograms,
  getProgramById,
  getCurriculumsByProgram,
  getSubjectsByCurriculum
} = require('../controllers/curriculumController');

router.get('/programs', getPrograms);
router.get('/programs/:id', getProgramById);
router.get('/programs/:id/curriculums', getCurriculumsByProgram);
router.get('/subjects/:curriculumId', getSubjectsByCurriculum);

module.exports = router;