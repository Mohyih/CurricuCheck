const multer = require('multer');

const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only images and PDFs are allowed'));
    }
  }
});

const scanId = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { student_number, first_name, last_name } = req.body;

    if (!student_number || !first_name || !last_name) {
      return res.status(400).json({ error: 'Student number and name are required for verification' });
    }

    // TODO: Replace this mock with real AI call (Gemini or Claude)
    // For now we simulate a successful scan
    const mockExtractedText = student_number; // pretend AI read this from the ID

    const numberMatch = mockExtractedText.trim() === student_number.trim();

    if (!numberMatch) {
      return res.status(400).json({
        verified: false,
        error: 'ID number on the uploaded ID does not match the student number you entered.'
      });
    }

    res.json({
      verified: true,
      message: 'ID verified successfully.',
      extracted_number: mockExtractedText,
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { scanId, upload };