'use strict';

exports.uploadImage = (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'Nenhum arquivo enviado.' });

  /* Prioridade: BASE_URL env var > X-Forwarded-Host + proto > req.protocol + host */
  let base = process.env.BASE_URL;
  if (!base) {
    const proto = req.get('X-Forwarded-Proto') || req.protocol;
    const host  = req.get('X-Forwarded-Host')  || req.get('host');
    base = `${proto}://${host}`;
  }
  base = base.replace(/\/+$/, ''); /* remove trailing slash */

  const url = `${base}/uploads/products/${req.file.filename}`;

  res.json({ success: true, url, filename: req.file.filename });
};
