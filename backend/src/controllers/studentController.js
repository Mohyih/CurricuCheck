const supabase = require('../config/supabase');

// GET student profile
const getMe = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('students')
      .select('*, programs(*), curriculums(*)')
      .eq('user_id', req.user.id)
      .single();

    if (error) return res.status(404).json({ error: 'Student not found' });
    res.json({ student: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET student academic records
const getMyRecords = async (req, res) => {
  try {
    const { data: student } = await supabase
      .from('students')
      .select('id')
      .eq('user_id', req.user.id)
      .single();

    const { data, error } = await supabase
      .from('academic_records')
      .select('*, subjects(*)')
      .eq('student_id', student.id)
      .order('academic_year')
      .order('term');

    if (error) return res.status(500).json({ error: error.message });
    res.json({ records: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST save academic records
const saveMyRecords = async (req, res) => {
  const { records, academic_year, term } = req.body;

  try {
    const { data: student } = await supabase
      .from('students')
      .select('id, curriculum_id')
      .eq('user_id', req.user.id)
      .single();

    // Upsert records
    const recordsToInsert = records.map(r => ({
      student_id: student.id,
      subject_id: r.subject_id,
      grade: r.grade || null,
      status: r.status,
      academic_year,
      term
    }));

    const { data, error } = await supabase
      .from('academic_records')
      .upsert(recordsToInsert, {
        onConflict: 'student_id,subject_id',
        ignoreDuplicates: false
      })
      .select();

    if (error) return res.status(500).json({ error: error.message });

    // Recalculate academic standing
    const { data: allRecords } = await supabase
      .from('academic_records')
      .select('status')
      .eq('student_id', student.id);

    const isIrregular = allRecords.some(r =>
      r.status === 'failed' || r.status === 'inc'
    );

    await supabase
      .from('students')
      .update({ academic_standing: isIrregular ? 'irregular' : 'regular' })
      .eq('id', student.id);

    res.json({ message: 'Records saved successfully', records: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// PATCH update year level
const updateYearLevel = async (req, res) => {
  const { year_level } = req.body;

  try {
    const { data, error } = await supabase
      .from('students')
      .update({ year_level })
      .eq('user_id', req.user.id)
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    res.json({ message: 'Year level updated', student: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// PATCH update preferred load
const updatePreferredLoad = async (req, res) => {
  const { preferred_load } = req.body;

  try {
    const { data, error } = await supabase
      .from('students')
      .update({ preferred_load })
      .eq('user_id', req.user.id)
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    res.json({ message: 'Preferred load updated', student: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getMe, getMyRecords, saveMyRecords, updateYearLevel, updatePreferredLoad };