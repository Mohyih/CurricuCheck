const { supabase } = require('../config/supabase');
const { sendOTP } = require('../config/emailService');

// Validate WUP email format: lastname.firstname@wesleyan.edu.ph
const validateWUPEmail = (email) => {
  const wupEmailRegex = /^[a-zA-Z]+\.[a-zA-Z]+@wesleyan\.edu\.ph$/;
  return wupEmailRegex.test(email);
};

// Generate 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// POST /api/otp/send
const sendOTPHandler = async (req, res) => {
  const { email, first_name } = req.body;

  try {
        // WUP email validation temporarily disabled
    // Accept any valid email format

    // Check if email already registered
    const { data: existingStudent } = await supabase
      .from('students')
      .select('id')
      .eq('email', email)
      .single();

    if (existingStudent) {
      return res.status(400).json({
        error: 'This email is already registered to an account.'
      });
    }

    // Delete any existing unused OTPs for this email
    await supabase
      .from('otp_tokens')
      .delete()
      .eq('email', email)
      .eq('used', false);

    // Generate OTP and expiry (10 minutes)
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    // Store OTP in database
    const { error: insertError } = await supabase
      .from('otp_tokens')
      .insert([{ email, otp_code: otp, expires_at: expiresAt }]);

    if (insertError) return res.status(500).json({ error: insertError.message });

    // Send OTP email via Resend
    await sendOTP(email, otp, first_name || 'Student');

    res.json({ message: 'OTP sent successfully. Please check your email.' });

  } catch (err) {
    console.error('OTP send error:', err);
    res.status(500).json({ error: 'Failed to send OTP. Please try again.' });
  }
};

// POST /api/otp/verify
const verifyOTPHandler = async (req, res) => {
  const { email, otp_code } = req.body;

  try {
    // Find OTP record
    const { data: otpRecord, error } = await supabase
      .from('otp_tokens')
      .select('*')
      .eq('email', email)
      .eq('otp_code', otp_code)
      .eq('used', false)
      .single();

    if (error || !otpRecord) {
      return res.status(400).json({ error: 'Invalid OTP code. Please try again.' });
    }

    // Check expiry
    if (new Date() > new Date(otpRecord.expires_at)) {
      return res.status(400).json({ error: 'OTP has expired. Please request a new one.' });
    }

    // Mark OTP as used
    await supabase
      .from('otp_tokens')
      .update({ used: true })
      .eq('id', otpRecord.id);

    res.json({ message: 'Email verified successfully.', verified: true });

  } catch (err) {
    console.error('OTP verify error:', err);
    res.status(500).json({ error: 'Failed to verify OTP. Please try again.' });
  }
};

module.exports = { sendOTPHandler, verifyOTPHandler };