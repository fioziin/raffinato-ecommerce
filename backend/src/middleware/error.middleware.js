module.exports = function errorMiddleware(err, req, res, next) {
  console.error('❌', err.message);

  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({ message: 'Dados inválidos.', errors: messages });
  }
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || 'campo';
    return res.status(409).json({ message: `${field} já está em uso.` });
  }

  res.status(err.status || 500).json({ message: err.message || 'Erro interno do servidor.' });
};
