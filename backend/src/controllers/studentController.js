const { supabase, supabaseAdmin } = require('../config/supabase');



// GET /api/student/curriculum-documents
const getCurriculumDocuments = async (req, res) => {
  try {
    const { supabaseAdmin } = require('../config/supabase');

    const { data, error } = await supabaseAdmin
      .storage
      .from('curriculum-documents')
      .list('', { limit: 100, sortBy: { column: 'name', order: 'asc' } });

    if (error) return res.status(500).json({ error: error.message });

    // Get public URL for each file
    const files = (data || [])
      .filter(f => f.name !== '.emptyFolderPlaceholder')
      .map(f => {
        const { data: urlData } = supabaseAdmin
          .storage
          .from('curriculum-documents')
          .getPublicUrl(f.name);
        return {
          name: f.name,
          url: urlData.publicUrl,
        };
      });

    res.json({ files });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};




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

// GET /api/student/me/roadmap
const getRoadmap = async (req, res) => {
  try {
    const { data: student } = await supabase
      .from('students')
      .select('*, programs(*), curriculums(*)')
      .eq('user_id', req.user.id)
      .single();

    if (!student) return res.status(404).json({ error: 'Student not found' });

    // Get all subjects with prerequisites
    const { data: allSubjects } = await supabase
      .from('subjects')
      .select('*, prerequisites!subject_id(required_subject_id)')
      .eq('curriculum_id', student.curriculum_id)
      .order('year_level', { ascending: true });

    // Get all academic records
    const { data: records } = await supabase
      .from('academic_records')
      .select('*')
      .eq('student_id', student.id);

    // Build record map for quick lookup
    const recordMap = {};
    records.forEach(r => { recordMap[r.subject_id] = r; });

    // Build passed IDs for prerequisite checking
    const passedIds = new Set(
      records.filter(r => r.status === 'passed').map(r => r.subject_id)
    );
    const failedIds = new Set(
      records.filter(r => r.status === 'failed').map(r => r.subject_id)
    );
    const incIds = new Set(
      records.filter(r => r.status === 'inc').map(r => r.subject_id)
    );

    // Compute status for each subject
    const subjectsWithStatus = allSubjects.map(subject => {
      const record = recordMap[subject.id];
      let status = 'locked'; // default

      if (passedIds.has(subject.id)) {
        status = 'passed';
      } else if (incIds.has(subject.id)) {
        status = 'inc';
      } else if (failedIds.has(subject.id)) {
        status = 'retake';
            } else {
        const prereqIds = subject.prerequisites.map(p => p.required_subject_id);
        const prereqsMet = prereqIds.every(pid => passedIds.has(pid));
        
        // Check standing requirement
        const standingMet = !subject.standing_requirement ||
          student.year_level >= subject.standing_requirement;

        if (prereqsMet && standingMet) {
          status = 'eligible';
        } else {
          status = 'locked';
        }
      }

      return {
        id: subject.id,
        code: subject.code,
        name: subject.name,
        units: subject.units,
        year_level: subject.year_level,
        semester: subject.semester,
        subject_type: subject.subject_type,
        is_elective: subject.is_elective,
        standing_requirement: subject.standing_requirement,
        prerequisites: subject.prerequisites,
        status,
        grade: record?.grade || null,
      };
    });

    // Compute stats
    const passedSubjects = subjectsWithStatus.filter(s => s.status === 'passed');
    const totalUnitsTaken = passedSubjects.reduce((sum, s) => sum + s.units, 0);
    const totalUnitsRequired = allSubjects.reduce((sum, s) => sum + s.units, 0);

    // GWA computation (CHED weighted average)
    const gradedSubjects = passedSubjects.filter(s => {
      const grade = parseFloat(s.grade);
      return !isNaN(grade);
    });

    const gwa = gradedSubjects.length > 0
      ? (
          gradedSubjects.reduce((sum, s) => sum + (parseFloat(s.grade) * s.units), 0) /
          gradedSubjects.reduce((sum, s) => sum + s.units, 0)
        ).toFixed(2)
      : null;

    res.json({
      stats: {
        student_number: student.student_number,
        full_name: `${student.first_name} ${student.middle_name ? student.middle_name + ' ' : ''}${student.last_name}`,
        program: student.programs.name,
        program_code: student.programs.code,
        curriculum_version: student.curriculums.version,
        total_units_required: totalUnitsRequired,
        total_units_taken: totalUnitsTaken,
        year_level: student.year_level,
        academic_standing: student.academic_standing,
        gwa,
      },
      subjects: subjectsWithStatus,
    });

  } catch (err) {
    console.error('Roadmap error:', err);
    res.status(500).json({ error: err.message });
  }
};


// GET total student count for admin
const getAdminStats = async (req, res) => {
  try {
    const { count: studentCount } = await supabase
      .from('students')
      .select('*', { count: 'exact', head: true })
      .eq('is_admin', false);

    const { data: programs } = await supabase
      .from('programs')
      .select('id');

    const { data: curriculums } = await supabase
      .from('curriculums')
      .select('id');

    res.json({
      total_students: studentCount || 0,
      total_programs: programs?.length || 0,
      total_curriculums: curriculums?.length || 0,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getMe, getMyRecords, saveMyRecords, updateYearLevel, updatePreferredLoad, updateProfile, deleteAccount, sendAdvisingPDF, getRoadmap, getCurriculumDocuments, getAdminStats };