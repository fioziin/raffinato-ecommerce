const jwt   = require('jsonwebtoken');
const Admin = require('../models/Admin');

function signToken(admin) {
  return jwt.sign(
    { id: admin._id, email: admin.email, role: admin.role },
    process.env.JWT_SECRET || 'secret',
    { expiresIn: '7d' }
  );
}

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email e senha são obrigatórios.' });

    const admin = await Admin.findOne({ email: email.toLowerCase() }).select('+passwordHash');
    if (!admin) return res.status(401).json({ message: 'Credenciais inválidas.' });

    const ok = await admin.comparePassword(password);
    if (!ok) return res.status(401).json({ message: 'Credenciais inválidas.' });

    res.json({ token: signToken(admin), admin: { id: admin._id, name: admin.name, email: admin.email, role: admin.role } });
  } catch (err) { next(err); }
};

exports.me = async (req, res, next) => {
  try {
    const admin = await Admin.findById(req.admin.id);
    if (!admin) return res.status(404).json({ message: 'Admin não encontrado.' });
    res.json({ id: admin._id, name: admin.name, email: admin.email, role: admin.role });
  } catch (err) { next(err); }
};
