const multer = require('multer');
const Anthropic = require('@anthropic-ai/sdk');

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only images and PDFs are allowed'));
    }
  }
});

const client = new Anthropic();

const VALID_PROGRAMS = [
  'bachelor of science in computer engineering',
  'bs computer engineering',
  'bscpe',
  'bachelor of science in information technology',
  'bs information technology',
  'bsit',
  'bachelor of science in electronics engineering',
  'bs electronics engineering',
  'bsece',
  'bachelor of science in electronics and communications engineering',
];

const scanId = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { student_number, first_name, last_name } = req.body;

    if (!student_number || !first_name || !last_name) {
      return res.status(400).json({ error: 'Student number and name are required for verification' });
    }

    // Convert image to base64
    const base64Image = req.file.buffer.toString('base64');
    const mediaType = req.file.mimetype;

    // Send to Claude Vision
    const response = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType,
                data: base64Image,
              },
            },
            {
              type: 'text',
              text: `You are verifying a student ID card for Wesleyan University Philippines (WUP), College of Engineering and Computer Technology (CECT).

Analyze this ID image and respond ONLY with a JSON object in this exact format, no other text:
{
  "is_wesleyan_id": true or false,
  "program_found": true or false,
  "program_detected": "exact program text you see or null",
  "id_number_found": true or false,
  "id_number_detected": "exact ID number you see or null",
  "id_number_matches": true or false
}

Rules:
- is_wesleyan_id: true only if you can see "Wesleyan" or "WUP" on the ID
- program_found: true if you see any of these programs: BS Computer Engineering, BS Information Technology, BS Electronics Engineering, BSCpE, BSIT, BSECE (case insensitive)
- id_number_detected: extract the student ID number you see on the card
- id_number_matches: true if the detected ID number matches exactly: ${student_number}

Be strict — if the image is not a clear student ID card, set is_wesleyan_id to false.`
            }
          ],
        }
      ],
    });

    // Parse Claude's response
    const rawText = response.content[0].text.trim();
    let aiResult;

    try {
      // Strip markdown code blocks if present
      const cleaned = rawText.replace(/```json|```/g, '').trim();
      aiResult = JSON.parse(cleaned);
    } catch (parseErr) {
      console.error('Failed to parse AI response:', rawText);
      return res.status(500).json({ error: 'Failed to analyze ID image. Please try again.' });
    }

    // Build verification result
    const reasons = [];

    if (!aiResult.is_wesleyan_id) {
      reasons.push('The uploaded image does not appear to be a Wesleyan University Philippines ID.');
    }

    if (!aiResult.program_found) {
      reasons.push('No valid CECT program (BSCpE, BSIT, BSECE) was detected on the ID.');
    }

    if (!aiResult.id_number_matches) {
      reasons.push(`ID number on the card (${aiResult.id_number_detected || 'not detected'}) does not match the student number you entered (${student_number}).`);
    }

    if (reasons.length > 0) {
      return res.status(400).json({
        verified: false,
        error: reasons.join(' '),
        details: aiResult,
      });
    }

    res.json({
      verified: true,
      message: 'ID verified successfully.',
      details: aiResult,
    });

  } catch (err) {
    console.error('Scan error:', err);
    res.status(500).json({ error: 'ID verification failed. Please try again.' });
  }
};

module.exports = { scanId, upload };