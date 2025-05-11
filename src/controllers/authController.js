const supabaseResearcher = require('../config/supabase-researcher');
const supabaseNutritionist = require('../config/supabase-nutritionist');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

exports.register = async (req, res) => {
  const { email, password, name, role } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);

  const { data: researcherUser, error: researcherError } = await supabaseResearcher.from('users').insert({
    email, password: hashedPassword, name, role
  }).select().single();

  if (researcherError) return res.status(500).json({ error: 'Failed to register in researcher system' });

  const { data: nutritionistUser, error: nutritionistError } = await supabaseNutritionist.from('users').insert({
    email, password: hashedPassword, name, role
  }).select().single();

  if (nutritionistError) return res.status(500).json({ error: 'Failed to register in nutritionist system' });

  const token = jwt.sign({ id: researcherUser.id, role }, process.env.JWT_SECRET, { expiresIn: '1h' });
  res.status(201).json({ message: 'Registration successful', data: { id: researcherUser.id, email, name, role, token } });
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  const { data: user, error } = await supabaseResearcher.from('users').select('*').eq('email', email).single();

  if (error || !user) return res.status(401).json({ error: 'Invalid credentials' });

  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(401).json({ error: 'Invalid credentials' });

  const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
  res.status(200).json({ message: 'Login successful', data: { id: user.id, email, name: user.name, role: user.role, token } });
};

exports.logout = async (req, res) => {
  res.status(200).json({ message: 'Logout successful' });
};