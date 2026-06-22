const express = require('express');
const cors = require('cors');
require('dotenv').config();
const supabase = require('./src/config/supabase');
const authRoutes = require('./src/routes/authRoutes');
const curriculumRoutes = require('./src/routes/curriculumRoutes');
// 1. ADDED: Import the student routes right here with the others
const studentRoutes = require('./src/routes/studentRoutes'); 
const evaluationRoutes = require('./src/routes/evaluationRoutes');
const recommendationRoutes = require('./src/routes/recommendationRoutes');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'CurricuCheck API is running!' });
});

app.get('/api/test-db', async (req, res) => {
  const { data, error } = await supabase
    .from('programs')
    .select('*');
  if (error) return res.status(500).json({ error });
  res.json({ programs: data });
});

app.use('/api/auth', authRoutes);
app.use('/api/curriculum', curriculumRoutes);
// 2. ADDED: Register the student middleware below the other app.use lines
app.use('/api/student', studentRoutes); 
app.use('/api/evaluation', evaluationRoutes);
app.use('/api/recommendation', recommendationRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});