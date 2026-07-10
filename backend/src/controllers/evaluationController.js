const { supabase } = require('../config/supabase');

const evaluate = async (req, res) => {
  const { target_year_level, target_semester } = req.query;

  try {
    const { data: student } = await supabase
      .from('students')
      .select('*, programs(*), curriculums(*)')
      .eq('user_id', req.user.id)
      .single();

    if (!student) return res.status(404).json({ error: 'Student not found' });

    // Get all subjects with prerequisites AND corequisites
    const { data: allSubjects } = await supabase
      .from('subjects')
      .select(`
        *,
        prerequisites!subject_id(required_subject_id),
        corequisites!subject_id(required_subject_id)
      `)
      .eq('curriculum_id', student.curriculum_id);

    // Get student academic records
    const { data: records } = await supabase
      .from('academic_records')
      .select('*')
      .eq('student_id', student.id);

    // Build maps
    const recordMap = {};
    records.forEach(r => { recordMap[r.subject_id] = r; });

    const passedIds = new Set(
      records.filter(r => r.status === 'passed').map(r => r.subject_id)
    );
    const failedIds = new Set(
      records.filter(r => r.status === 'failed').map(r => r.subject_id)
    );
    const incIds = new Set(
      records.filter(r => r.status === 'inc').map(r => r.subject_id)
    );

    const targetYearLevel = parseInt(target_year_level);
    const targetSemester = target_semester;

    // First pass — find all eligible subject IDs for this term
    // (needed for corequisite checking)
    const potentiallyEligibleIds = new Set();
    for (const subject of allSubjects) {
      if (passedIds.has(subject.id)) continue;
      if (subject.subject_type === 'nstp') continue;

      const isTargetTerm = subject.year_level === targetYearLevel && subject.semester === targetSemester;
      if (!isTargetTerm) continue;

      const prereqIds = subject.prerequisites.map(p => p.required_subject_id);
      const prereqsMet = prereqIds.every(pid => passedIds.has(pid));
      if (prereqsMet) potentiallyEligibleIds.add(subject.id);
    }

    const eligible = [];
    const blocked = [];
    const deferred = [];
    const retakes = [];
    const incWarnings = [];
   
    for (const subject of allSubjects) {
      const alreadyPassed = passedIds.has(subject.id);
      if (alreadyPassed) continue;

      // Handle INC
      if (incIds.has(subject.id)) {
        incWarnings.push({
          ...subject,
          message: 'INC must be resolved within 1 week at start of next semester or it becomes 5.00 (Failed)'
        });
        continue;
      }

      // Handle NSTP
// Handle NSTP with prerequisite checking
// Handle NSTP with prerequisite checking and term filtering
if (subject.subject_type === 'nstp') {
  if (passedIds.has(subject.id)) continue;

  const prereqIds = subject.prerequisites.map(p => p.required_subject_id);
  const prereqsMet = prereqIds.every(pid => passedIds.has(pid));
  const isRetake = failedIds.has(subject.id);

  // Only show NSTP subjects that belong to the target semester
  // OR if it's a retake (failed before, can retake in any sem)
  const isTargetTerm = subject.semester === targetSemester;
  if (!isTargetTerm && !isRetake) continue;

  if (prereqsMet) {
    if (isRetake) {
      retakes.push({ ...subject, is_retake: true });
    } else {
      eligible.push({ ...subject });
    }
  } else {
    const missingPrereqs = prereqIds
      .filter(pid => !passedIds.has(pid))
      .map(pid => allSubjects.find(s => s.id === pid)?.code)
      .filter(Boolean);
    blocked.push({
      ...subject,
      missing_prerequisites: missingPrereqs,
      missing_reasons: [`Must complete first: ${missingPrereqs.join(', ')}`]
    });
  }
  continue;
}

      // Check prerequisites
      const prereqIds = subject.prerequisites.map(p => p.required_subject_id);
      const prereqsMet = prereqIds.every(pid => passedIds.has(pid));

      // Check standing requirement
      const standingMet = !subject.standing_requirement ||
        targetYearLevel >= subject.standing_requirement;

      // Check corequisites
      const coreqIds = subject.corequisites.map(c => c.required_subject_id);
      const coreqsMet = coreqIds.every(cid =>
        passedIds.has(cid) || potentiallyEligibleIds.has(cid)
      );

      const isTargetTerm = subject.year_level === targetYearLevel &&
        subject.semester === targetSemester;

      // Handle failed subjects (retakes)
      if (failedIds.has(subject.id)) {
        if (prereqsMet && standingMet && coreqsMet && isTargetTerm) {
          retakes.push({ ...subject, is_retake: true });
        }
        continue;
      }

      if (!isTargetTerm) continue;

      // Build missing reasons
      const missingReasons = [];

      if (!prereqsMet) {
        const missingPrereqs = prereqIds
          .filter(pid => !passedIds.has(pid))
          .map(pid => allSubjects.find(s => s.id === pid)?.code)
          .filter(Boolean);
        missingReasons.push(`Missing prerequisites: ${missingPrereqs.join(', ')}`);
      }

      if (!standingMet) {
        missingReasons.push(`Requires Year ${subject.standing_requirement} standing`);
      }

      if (!coreqsMet) {
        const missingCoreqs = coreqIds
          .filter(cid => !passedIds.has(cid) && !potentiallyEligibleIds.has(cid))
          .map(cid => allSubjects.find(s => s.id === cid)?.code)
          .filter(Boolean);
        missingReasons.push(`Must be taken with: ${missingCoreqs.join(', ')}`);
      }

      if (missingReasons.length > 0) {
        blocked.push({
          ...subject,
          missing_prerequisites: prereqIds
            .filter(pid => !passedIds.has(pid))
            .map(pid => allSubjects.find(s => s.id === pid)?.code)
            .filter(Boolean),
          missing_reasons: missingReasons
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
        nstp: [] // kept for frontend compatibility
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