const { supabase, supabaseAdmin } = require('../config/supabase');

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


// DELETE account
const deleteAccount = async (req, res) => {
  try {
    const { data: student } = await supabase
      .from('students')
      .select('id')
      .eq('user_id', req.user.id)
      .single();

    if (!student) return res.status(404).json({ error: 'Student not found' });

    await supabase
      .from('academic_records')
      .delete()
      .eq('student_id', student.id);

    await supabase
      .from('students')
      .delete()
      .eq('id', student.id);

    // Delete auth user using admin client
    await supabaseAdmin.auth.admin.deleteUser(req.user.id);

    res.json({ message: 'Account deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// PATCH update profile
const updateProfile = async (req, res) => {
  const { first_name, last_name, middle_name, year_level, preferred_load } = req.body;

  try {
    const { data, error } = await supabase
      .from('students')
      .update({ 
        first_name, 
        last_name, 
        middle_name: middle_name || null,
        year_level,
        preferred_load
      })
      .eq('user_id', req.user.id)
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    res.json({ message: 'Profile updated successfully', student: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


const { sendAdvisingSummaryPDF } = require('../config/emailService');

// POST send advising summary PDF to email
const sendAdvisingPDF = async (req, res) => {
  const { pdf_base64, target_semester } = req.body;

  try {
    const { data: student } = await supabase
      .from('students')
      .select('first_name, last_name, email')
      .eq('user_id', req.user.id)
      .single();

    if (!student?.email) {
      return res.status(400).json({ error: 'No email address found for this account.' });
    }

    await sendAdvisingSummaryPDF(
      student.email,
      pdf_base64,
      `${student.last_name}, ${student.first_name}`,
      target_semester
    );

    res.json({ message: `Advising summary sent to ${student.email}` });
  } catch (err) {
    console.error('PDF email error:', err);
    res.status(500).json({ error: 'Failed to send PDF to email. Please try again.' });
  }
};

module.exports = { getMe, getMyRecords, saveMyRecords, updateYearLevel, updatePreferredLoad, updateProfile, deleteAccount, sendAdvisingPDF };