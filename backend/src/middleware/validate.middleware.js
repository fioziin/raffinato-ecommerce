function required(fields) {
  return (req, res, next) => {
    const missing = fields.filter(f => !req.body[f] && req.body[f] !== 0);
    if (missing.length) {
      return res.status(400).json({ message: `Campos obrigatórios: ${missing.join(', ')}` });
    }
    next();
  };
}

module.exports = { required };
