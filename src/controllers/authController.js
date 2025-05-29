const supabaseResearcher = require("../config/supabase-researcher");
const supabaseNutritionist = require("../config/supabase-nutritionist");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

exports.register = async (req, res) => {
  const { email, password, name, role } = req.body;

  if (!validateEmail(email)) {
    return res.status(400).json({ error: "Invalid email format" });
  }

  if (!["researcher", "nutritionist"].includes(role)) {
    return res.status(400).json({ error: 'Invalid role. Must be "researcher" or "nutritionist"' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  let userData, userError, supabaseClient;

  if (role === "researcher") {
    supabaseClient = supabaseResearcher;
  } else if (role === "nutritionist") {
    supabaseClient = supabaseNutritionist;
  }

  const { data, error } = await supabaseClient
    .from("users")
    .insert({ email, password: hashedPassword, name, role })
    .select()
    .single();

  userData = data;
  userError = error;

  if (userError) {
    console.error(`${role} insert error:`, userError);
    if (userError.code === "23505") {
      return res.status(400).json({ error: `Email already exists in ${role} system` });
    }
    return res.status(500).json({
        error: `Failed to register in ${role} system`,
        details: userError.message,
      });
  }

  const token = jwt.sign({ id: userData.id, role }, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });
  res.status(201).json({
    message: "Registration successful",
    data: { id: userData.id, email, name, role, token },
  });
};

exports.login = async (req, res) => {
  const { email, password, role } = req.body;

  if (!validateEmail(email)) {
    return res.status(400).json({ error: "Invalid email format" });
  }

  if (!["researcher", "nutritionist"].includes(role)) {
    return res.status(400).json({ error: 'Invalid role. Must be "researcher" or "nutritionist"' });
  }

  let user, supabaseClient;

  if (role === "researcher") {
    supabaseClient = supabaseResearcher;
  } else if (role === "nutritionist") {
    supabaseClient = supabaseNutritionist;
  }

  const { data, error } = await supabaseClient
    .from("users")
    .select("*")
    .eq("email", email)
    .single();

  if (error || !data) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  user = data;

  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(401).json({ error: "Invalid credentials" });

  if (user.role !== role) {
    return res.status(401).json({
        error: "Role mismatch. Please use the correct role for this account",
      });
  }

  const token = jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );
  res.status(200).json({
      message: "Login successful",
      data: { id: user.id, email, name: user.name, role: user.role, token },
    });
};

exports.logout = async (req, res) => {
  res.status(200).json({ message: "Logout successful" });
};