const { supabase } = require('../config/supabase');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// REGISTER
const register = async (req, res) => {
  const {
    student_number,
    password,
    first_name,
    last_name,
    middle_name,
    program_id,
    curriculum_id,
    year_level,
    preferred_load,
    email_address
  } = req.body;

  try {
    // Password length validation
    if (password.length < 8) {
      return res.status(400).json({
        error: 'Password must be at least 8 characters long.'
      });
    }

    const studentNumberRegex = /^\d{2}-\d{4}-\d{3}$/;
if (!studentNumberRegex.test(student_number)) {
  return res.status(400).json({
    error: 'Invalid student number format. Expected format: YY-XXXX-XXX (e.g. 23-1998-610)'
  });
}

    // Check if student number already exists
    const { data: existing } = await supabase
      .from('students')
      .select('id')
      .eq('student_number', student_number)
      .single();

    if (existing) {
      return res.status(400).json({
        error: 'An account with this student number already exists.'
      });
    }

    // Convert student number to email format
    const email = `${student_number}@wesleyan.edu.ph`;

    // Register user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password
    });

    if (authError) return res.status(400).json({ error: authError.message });

    const user_id = authData.user.id;

    // Insert into students table
    const { data: studentData, error: studentError } = await supabase
      .from('students')
      .insert([{
        user_id,
        student_number,
        first_name,
        last_name,
        middle_name: middle_name || null,
        email: email_address || null,
        program_id,
        curriculum_id,
        year_level,
        preferred_load: preferred_load || 'normal',
        academic_standing: 'regular'
      }])
      .select()
      .single();

    if (studentError) return res.status(400).json({ error: studentError.message });

    res.status(201).json({
      message: 'Registration successful',
      student: studentData
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// LOGIN
const login = async (req, res) => {
  const { student_number, password } = req.body;

  try {
    let emailToUse;

    if (student_number.includes('@')) {
      // User entered their WUP email — find their student number first
      const { data: studentByEmail } = await supabase
        .from('students')
        .select('student_number')
        .eq('email', student_number)
        .single();

      if (!studentByEmail) {
        return res.status(400).json({ error: 'No account found with this email address.' });
      }

      emailToUse = `${studentByEmail.student_number}@wesleyan.edu.ph`;
    } else {
      // User entered student number as usual
      emailToUse = `${student_number}@wesleyan.edu.ph`;
    }

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: emailToUse,
      password
    });

    if (authError) return res.status(401).json({ error: 'Invalid student number or password' });

    const token = authData.session.access_token;
    const refreshToken = authData.session.refresh_token;
    const user_id = authData.user.id;

    // Get student record
    const { data: studentData, error: studentError } = await supabase
      .from('students')
      .select('*, programs(*), curriculums(*)')
      .eq('user_id', user_id)
      .single();

    if (studentError) return res.status(400).json({ error: studentError.message });

    res.json({
      message: 'Login successful',
      token,
      refresh_token: refreshToken,
      student: studentData
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// LOGOUT
const logout = async (req, res) => {
  try {
    await supabase.auth.signOut();
    res.json({ message: 'Logout successful' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// REFRESH TOKEN
const refresh = async (req, res) => {
  const { refresh_token } = req.body;

  try {
    const { data, error } = await supabase.auth.refreshSession({ refresh_token });

    if (error || !data.session) {
      return res.status(401).json({ error: 'Invalid or expired refresh token' });
    }

    res.json({
      token: data.session.access_token,
      refresh_token: data.session.refresh_token,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


const crypto = require('crypto');
const { sendPasswordReset } = require('../config/emailService');

// POST /api/auth/forgot-password
const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    // Find student by their real WUP email
    const { data: student } = await supabase
      .from('students')
      .select('student_number, first_name')
      .eq('email', email)
      .single();

    // Always return same message for security
    if (!student) {
      return res.json({
        message: 'If an account exists with this email a reset link has been sent.'
      });
    }

    // Delete any existing unused reset tokens for this email
    await supabase
      .from('reset_tokens')
      .delete()
      .eq('email', email)
      .eq('used', false);

    // Generate secure random token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();

    // Store token in database
    await supabase
      .from('reset_tokens')
      .insert([{ email, token, expires_at: expiresAt }]);

    // Build reset link pointing to frontend
    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

    // Send to student's REAL WUP email via Brevo
    await sendPasswordReset(email, resetLink, student.first_name);

    res.json({
      message: 'If an account exists with this email a reset link has been sent.'
    });

  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ error: 'Failed to process request. Please try again.' });
  }
};

// POST /api/auth/reset-password
const resetPassword = async (req, res) => {
  const { token, new_password } = req.body;

  try {
    if (new_password.length < 8) {
      return res.status(400).json({
        error: 'Password must be at least 8 characters.'
      });
    }

    // Find token in database
    const { data: resetToken } = await supabase
      .from('reset_tokens')
      .select('*')
      .eq('token', token)
      .eq('used', false)
      .single();

    if (!resetToken) {
      return res.status(400).json({ 
        error: 'Invalid or expired reset link. Please request a new one.' 
      });
    }

    // Check expiry
    if (new Date() > new Date(resetToken.expires_at)) {
      return res.status(400).json({ 
        error: 'Reset link has expired. Please request a new one.' 
      });
    }

    // Find student by their real WUP email to get student number
    const { data: student } = await supabase
      .from('students')
      .select('student_number')
      .eq('email', resetToken.email)
      .single();

    if (!student) {
      return res.status(400).json({ error: 'Account not found.' });
    }

    // Build the fake auth email used in Supabase Auth
    const authEmail = `${student.student_number}@wesleyan.edu.ph`;

    // Use admin client to find and update the auth user directly
    const { supabaseAdmin } = require('../config/supabase');

    const { data: userData, error: listError } = 
      await supabaseAdmin.auth.admin.listUsers();

    if (listError) {
      return res.status(500).json({ error: 'Failed to find account.' });
    }

    const authUser = userData?.users?.find(u => u.email === authEmail);

    if (!authUser) {
      return res.status(400).json({ error: 'Account not found in auth system.' });
    }

    // Update the password
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      authUser.id,
      { password: new_password }
    );

    if (updateError) {
      return res.status(500).json({ error: 'Failed to update password.' });
    }

    // Mark token as used
    await supabase
      .from('reset_tokens')
      .update({ used: true })
      .eq('id', resetToken.id);

    res.json({ message: 'Password reset successfully.' });

  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ error: err.message });
  }
};

module.exports = { register, login, logout, refresh, forgotPassword, resetPassword, sendPasswordReset };