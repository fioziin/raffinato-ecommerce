'use strict';

const cloudinary = require('../config/cloudinary');

exports.uploadImage = (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'Nenhum arquivo enviado.' });

  const stream = cloudinary.uploader.upload_stream(
    { folder: 'raffinato/products', resource_type: 'image' },
    (error, result) => {
      if (error) {
        console.error('Cloudinary upload error:', error);
        return res.status(500).json({ message: 'Erro ao enviar imagem para o Cloudinary.', detail: error.message });
      }
      res.json({ success: true, url: result.secure_url, public_id: result.public_id });
    }
  );

  stream.end(req.file.buffer);
};
