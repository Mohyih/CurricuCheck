const { supabase } = require('../config/supabase');

const LOAD_LIMITS = {
  light: 12,
  normal: 18,
  heavy: 21
};

const recommend = async (req, res) => {
  const { target_year_level, target_semester, load } = req.query;

  try {
    const { data: student } = await supabase
      .from('students')
      .select('*')
      .eq('user_id', req.user.id)
      .single();

    const selectedLoad = load || student.preferred_load || 'normal';
    const maxUnits = LOAD_LIMITS[selectedLoad] || LOAD_LIMITS.normal;

    // Get all subjects for curriculum
    const { data: allSubjects } = await supabase
      .from('subjects')
      .select('*, prerequisites!subject_id(required_subject_id)')
      .eq('curriculum_id', student.curriculum_id);

    // Get records
    const { data: records } = await supabase
      .from('academic_records')
      .select('*')
      .eq('student_id', student.id);

    const passedIds = new Set(records.filter(r => r.status === 'passed').map(r => r.subject_id));
    const failedIds = new Set(records.filter(r => r.status === 'failed').map(r => r.subject_id));

    const targetYearLevel = parseInt(target_year_level);

    // Get eligible subjects (same logic as evaluate)
    const eligibleSubjects = [];

    for (const subject of allSubjects) {
      if (passedIds.has(subject.id)) continue;
      if (subject.subject_type === 'nstp') {
        eligibleSubjects.push(subject);
        continue;
      }

      const isTargetTerm = subject.year_level === targetYearLevel && subject.semester === target_semester;
      const isRetake = failedIds.has(subject.id);

      if (!isTargetTerm && !isRetake) continue;
      if (isRetake && !isTargetTerm) continue;

      const prereqIds = subject.prerequisites.map(p => p.required_subject_id);
      const prereqsMet = prereqIds.every(pid => passedIds.has(pid));

      if (prereqsMet) {
        eligibleSubjects.push({ ...subject, is_retake: isRetake });
      }
    }

    // Priority sort: retakes first, then by units descending (prioritize heavier subjects), NSTP always included
    const nstpSubjects = eligibleSubjects.filter(s => s.subject_type === 'nstp');
    const retakeSubjects = eligibleSubjects.filter(s => s.is_retake);
    const regularSubjects = eligibleSubjects.filter(s => !s.is_retake && s.subject_type !== 'nstp');

    // Sort regular subjects: prioritize lecture/lab pairs together, then by units
    const sortedRegular = regularSubjects.sort((a, b) => b.units - a.units);

    const recommended = [];
    const optional = [];
    let currentUnits = 0;

    // NSTP doesn't count toward load
    nstpSubjects.forEach(s => recommended.push({ ...s, category: 'recommended', reason: 'NSTP subject - does not count against academic load' }));

    // Retakes are always recommended (priority)
    retakeSubjects.forEach(s => {
      recommended.push({ ...s, category: 'recommended', reason: 'Retake - previously failed subject' });
      currentUnits += s.units;
    });

    // Fill remaining load with regular subjects
    for (const subject of sortedRegular) {
      if (currentUnits + subject.units <= maxUnits) {
        recommended.push({ ...subject, category: 'recommended', reason: 'Within preferred academic load' });
        currentUnits += subject.units;
      } else {
        optional.push({ ...subject, category: 'optional', reason: 'Exceeds preferred academic load limit' });
      }
    }

    res.json({
      target_year_level: targetYearLevel,
      target_semester,
      preferred_load: selectedLoad,
      max_units: maxUnits,
      current_units_recommended: currentUnits,
      recommended,
      optional
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { recommend };