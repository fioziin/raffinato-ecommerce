'use strict';

const crypto       = require('crypto');
const User         = require('../models/User');
const emailService = require('../services/email.service');

const FRONTEND_URL = (process.env.FRONTEND_URL || 'https://vista-raffinato.vercel.app').replace(/\/$/, '');

const GENERIC_MSG = {
  success: true,
  message: 'Se este e-mail estiver cadastrado, enviaremos instruções para redefinir a senha.'
};

/* ── CADASTRO ── */
exports.register = async (req, res, next) => {
  try {
    const { nome, email, senha } = req.body;

    if (!nome || !email || !senha)
      return res.status(400).json({ message: 'Preencha todos os campos.' });
    if (senha.length < 6)
      return res.status(400).json({ message: 'Senha deve ter pelo menos 6 caracteres.' });

    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) return res.status(409).json({ message: 'E-mail já cadastrado.' });

    const passwordHash = await User.hashPassword(senha);
    const user = await User.create({ nome, email: email.toLowerCase(), passwordHash });

    res.status(201).json({ user: { id: user._id, nome: user.nome, email: user.email } });

    setImmediate(async () => {
      try {
        console.log('[Email] Enviando boas-vindas para:', user.email);
        await emailService.sendWelcomeEmail(user);
        console.log('[Email] Boas-vindas enviadas com sucesso');
      } catch (err) {
        console.error('[Email] Falha boas-vindas:', err.message);
      }
    });
  } catch (err) { next(err); }
};

/* ── LOGIN ── */
exports.login = async (req, res, next) => {
  try {
    const { email, senha } = req.body;
    if (!email || !senha)
      return res.status(400).json({ message: 'Preencha todos os campos.' });

    const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');
    if (!user) return res.status(401).json({ message: 'E-mail ou senha incorretos.' });

    const ok = await user.comparePassword(senha);
    if (!ok) return res.status(401).json({ message: 'E-mail ou senha incorretos.' });

    res.json({ user: { id: user._id, nome: user.nome, email: user.email } });
  } catch (err) { next(err); }
};

/* ── ESQUECEU SENHA ── */
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return res.json(GENERIC_MSG);

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.json(GENERIC_MSG);

    const token     = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    user.passwordResetTokenHash = tokenHash;
    user.passwordResetExpires   = Date.now() + 30 * 60 * 1000;
    await user.save();

    const resetUrl = `${FRONTEND_URL}/conta.html?resetToken=${token}`;

    setImmediate(async () => {
      try {
        console.log('[Email] Enviando reset de senha para:', user.email);
        await emailService.sendPasswordResetEmail(user, resetUrl);
        console.log('[Email] Reset enviado com sucesso');
      } catch (err) {
        console.error('[Email] Falha reset:', err.message);
      }
    });

    res.json(GENERIC_MSG);
  } catch (err) { next(err); }
};

/* ── REDEFINIR SENHA ── */
exports.resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;
    if (!token || !password)
      return res.status(400).json({ message: 'Token e senha são obrigatórios.' });
    if (password.length < 6)
      return res.status(400).json({ message: 'Senha deve ter pelo menos 6 caracteres.' });

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      passwordResetTokenHash: tokenHash,
      passwordResetExpires:   { $gt: Date.now() }
    }).select('+passwordHash +passwordResetTokenHash +passwordResetExpires');

    if (!user)
      return res.status(400).json({ message: 'Link inválido ou expirado. Solicite um novo.' });

    user.passwordHash           = await User.hashPassword(password);
    user.passwordResetTokenHash = undefined;
    user.passwordResetExpires   = undefined;
    await user.save();

    res.json({ success: true, message: 'Senha alterada com sucesso.' });
  } catch (err) { next(err); }
};
