const Anthropic = require('@anthropic-ai/sdk');
const { supabase } = require('../config/supabase');

const client = new Anthropic();

const scanGrades = async (req, res) => {
  try {
    const { image_base64, media_type, curriculum_id } = req.body;

    if (!image_base64 || !curriculum_id) {
      return res.status(400).json({ error: 'Image and curriculum ID are required.' });
    }

    // Fetch all subjects for this curriculum from database
    const { data: subjects } = await supabase
      .from('subjects')
      .select('id, code, name, year_level, semester')
      .eq('curriculum_id', curriculum_id);

    // Build subject list string for Claude to reference
    const subjectList = subjects.map(s =>
      `${s.code} | ${s.name} | Year ${s.year_level} | ${s.semester}`
    ).join('\n');

    // Send to Claude Vision
    const response = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: media_type || 'image/jpeg',
                data: image_base64,
              },
            },
            {
              type: 'text',
              text: `You are reading a WUP (Wesleyan University Philippines) grade table screenshot from their Automate system.

Extract ALL subject grades from this image.

Here are the subjects in this student's curriculum for reference (to help you match subject codes):
${subjectList}

Instructions:
1. Read the grade table in the image carefully
2. Extract Subject Code and Grade for each row
3. Match each extracted subject code to the closest subject in the curriculum list above
   - Ignore spacing differences (e.g. "CPE 11 - LAB" matches "CPE 11-LAB")
   - Ignore case differences
4. Also detect the semester and school year from the header if visible
5. Respond ONLY with a valid JSON object, no other text:

{
  "semester_detected": "1st Semester" or "2nd Semester" or "Summer" or null,
  "school_year_detected": "2025-2026" or null,
  "grades": [
    {
      "extracted_code": "exact code as shown in image",
      "matched_code": "matched code from curriculum list or null if no match",
      "grade": "grade value as number string e.g. 1.75 or INC or null if blank",
      "subject_name": "subject name from image"
    }
  ]
}`
            }
          ],
        }
      ],
    });

    // Parse Claude response
    const rawText = response.content[0].text.trim();
    let aiResult;

    try {
      const cleaned = rawText.replace(/```json|```/g, '').trim();
      aiResult = JSON.parse(cleaned);
    } catch (parseErr) {
      console.error('Failed to parse AI response:', rawText);
      return res.status(500).json({ error: 'Failed to read grade table. Please try again with a clearer image.' });
    }

    // Match extracted grades to subject IDs
    const matchedGrades = [];
    const unmatchedGrades = [];

    for (const item of aiResult.grades) {
      if (!item.grade) continue; // skip blank grades

      // Find subject in database by matched_code
      const subject = subjects.find(s => {
        const dbCode = s.code.replace(/\s+/g, '').replace(/-/g, '').toLowerCase();
        const matchCode = (item.matched_code || item.extracted_code)
          .replace(/\s+/g, '').replace(/-/g, '').toLowerCase();
        return dbCode === matchCode;
      });

      if (subject) {
        matchedGrades.push({
          subject_id: subject.id,
          subject_code: subject.code,
          subject_name: subject.name,
          year_level: subject.year_level,
          semester: subject.semester,
          grade: item.grade,
          extracted_code: item.extracted_code,
        });
      } else {
        unmatchedGrades.push({
          extracted_code: item.extracted_code,
          subject_name: item.subject_name,
          grade: item.grade,
        });
      }
    }

    res.json({
      semester_detected: aiResult.semester_detected,
      school_year_detected: aiResult.school_year_detected,
      matched_grades: matchedGrades,
      unmatched_grades: unmatchedGrades,
    });

  } catch (err) {
    console.error('Scan grades error:', err);
    res.status(500).json({ error: 'Failed to scan grades. Please try again.' });
  }
};

module.exports = { scanGrades };