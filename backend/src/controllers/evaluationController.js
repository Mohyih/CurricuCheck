const supabase = require('../config/supabase');

const evaluate = async (req, res) => {
  const { target_year_level, target_semester } = req.query;

  try {
    // Get student
    const { data: student } = await supabase
      .from('students')
      .select('*, programs(*), curriculums(*)')
      .eq('user_id', req.user.id)
      .single();

    if (!student) return res.status(404).json({ error: 'Student not found' });

    // Get all subjects for this curriculum
    const { data: allSubjects } = await supabase
      .from('subjects')
      .select('*, prerequisites!subject_id(required_subject_id)')
      .eq('curriculum_id', student.curriculum_id);

    // Get student academic records
    const { data: records } = await supabase
      .from('academic_records')
      .select('*')
      .eq('student_id', student.id);

    // Build a map of subject_id -> record
    const recordMap = {};
    records.forEach(r => { recordMap[r.subject_id] = r; });

    // Build passed subject IDs set
    const passedIds = new Set(
      records
        .filter(r => r.status === 'passed')
        .map(r => r.subject_id)
    );

    // Build failed subject IDs set
    const failedIds = new Set(
      records
        .filter(r => r.status === 'failed')
        .map(r => r.subject_id)
    );

    // Build INC subject IDs set
    const incIds = new Set(
      records
        .filter(r => r.status === 'inc')
        .map(r => r.subject_id)
    );

    const targetYearLevel = parseInt(target_year_level);
    const targetSemester = target_semester;

    const eligible = [];
    const blocked = [];
    const deferred = [];
    const retakes = [];
    const incWarnings = [];
    const nstp = [];

    for (const subject of allSubjects) {
      const record = recordMap[subject.id];
      const alreadyPassed = passedIds.has(subject.id);

      // Skip already passed subjects unless failed (retake)
      if (alreadyPassed) continue;

      // Handle INC subjects
      if (incIds.has(subject.id)) {
        incWarnings.push({
          ...subject,
          message: 'INC must be resolved within 1 week at start of next semester or it becomes 5.00 (Failed)'
        });
        continue;
      }

      // Handle NSTP separately
      if (subject.subject_type === 'nstp') {
        if (!alreadyPassed) {
          nstp.push(subject);
        }
        continue;
      }

      // Check prerequisites
      const prereqIds = subject.prerequisites.map(p => p.required_subject_id);
      const prereqsMet = prereqIds.every(pid => passedIds.has(pid));

      // Check if subject is for target year and semester
      const isTargetTerm = 
        subject.year_level === targetYearLevel &&
        subject.semester === targetSemester;

      // Handle failed subjects (retakes)
      if (failedIds.has(subject.id)) {
        if (prereqsMet && isTargetTerm) {
          retakes.push({ ...subject, is_retake: true });
        }
        continue;
      }

      // Only evaluate subjects for target year level and semester
      if (!isTargetTerm) continue;

      if (!prereqsMet) {
        // Find which prerequisites are missing
        const missingPrereqs = prereqIds
          .filter(pid => !passedIds.has(pid))
          .map(pid => allSubjects.find(s => s.id === pid)?.code)
          .filter(Boolean);

        blocked.push({
          ...subject,
          missing_prerequisites: missingPrereqs
        });
      } else {
        eligible.push(subject);
      }
    }

    res.json({
      student: {
        name: `${student.first_name} ${student.last_name}`,
        program: student.programs.name,
        curriculum_version: student.curriculums.version,
        year_level: student.year_level,
        academic_standing: student.academic_standing
      },
      target_year_level: targetYearLevel,
      target_semester: targetSemester,
      evaluation: {
        eligible,
        blocked,
        deferred,
        retakes,
        inc_warnings: incWarnings,
        nstp
      }
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const advisingSummary = async (req, res) => {
  const { target_year_level, target_semester } = req.query;

  try {
    const { data: student } = await supabase
      .from('students')
      .select('*, programs(*), curriculums(*)')
      .eq('user_id', req.user.id)
      .single();

    const { data: records } = await supabase
      .from('academic_records')
      .select('*, subjects(*)')
      .eq('student_id', student.id);

    const passedSubjects = records.filter(r => r.status === 'passed');
    const failedSubjects = records.filter(r => r.status === 'failed');
    const incSubjects = records.filter(r => r.status === 'inc');

    const totalUnits = passedSubjects.reduce((sum, r) => {
      return sum + (r.subjects?.units || 0);
    }, 0);

    res.json({
      student: {
        name: `${student.first_name} ${student.last_name}`,
        student_number: student.student_number,
        program: student.programs.name,
        curriculum_version: student.curriculums.version,
        year_level: student.year_level,
        academic_standing: student.academic_standing,
        preferred_load: student.preferred_load
      },
      target_year_level: parseInt(target_year_level),
      target_semester,
      summary: {
        total_units_passed: totalUnits,
        passed_count: passedSubjects.length,
        failed_count: failedSubjects.length,
        inc_count: incSubjects.length,
        passed_subjects: passedSubjects.map(r => ({
          code: r.subjects?.code,
          name: r.subjects?.name,
          units: r.subjects?.units,
          grade: r.grade
        })),
        failed_subjects: failedSubjects.map(r => ({
          code: r.subjects?.code,
          name: r.subjects?.name,
          grade: r.grade
        })),
        inc_subjects: incSubjects.map(r => ({
          code: r.subjects?.code,
          name: r.subjects?.name
        }))
      }
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { evaluate, advisingSummary };