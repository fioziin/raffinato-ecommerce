'use strict';

exports.uploadImage = (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'Nenhum arquivo enviado.' });

  const base = process.env.BASE_URL ||
    `${req.protocol}://${req.get('host')}`;

  const url = `${base}/uploads/products/${req.file.filename}`;

  res.json({ success: true, url, filename: req.file.filename });
};
