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
    const email = `${student_number}@wesleyan.edu.ph`;

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
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

module.exports = { register, login, logout, refresh };