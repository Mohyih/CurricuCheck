const { supabase } = require('../config/supabase');

// GET all programs
const getPrograms = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('programs')
      .select('*')
      .order('name');

    if (error) return res.status(500).json({ error: error.message });
    res.json({ programs: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET single program
const getProgramById = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('programs')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error) return res.status(404).json({ error: 'Program not found' });
    res.json({ program: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET curriculums by program
const getCurriculumsByProgram = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('curriculums')
      .select('*')
      .eq('program_id', req.params.id)
      .order('version');

    if (error) return res.status(500).json({ error: error.message });
    res.json({ curriculums: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET subjects by curriculum
const getSubjectsByCurriculum = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('subjects')
      .select('*, prerequisites!subject_id(required_subject_id)')
      .eq('curriculum_id', req.params.curriculumId)
      .order('year_level')
      .order('semester')
      .order('code');

    if (error) return res.status(500).json({ error: error.message });
    res.json({ subjects: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getPrograms,
  getProgramById,
  getCurriculumsByProgram,
  getSubjectsByCurriculum
};