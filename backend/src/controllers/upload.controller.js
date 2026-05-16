'use strict';
const cloudinary = require('../config/cloudinary');

exports.uploadImage = async (req, res, next) => {
  try {
    const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;
    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
      return res.status(503).json({ message: 'Cloudinary não configurado. Verifique as variáveis de ambiente.' });
    }

    if (!req.file) return res.status(400).json({ message: 'Nenhum arquivo enviado.' });

    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: 'raffinato/products', resource_type: 'image' },
        (err, data) => { if (err) reject(err); else resolve(data); }
      );
      stream.end(req.file.buffer);
    });

    res.json({
      url:      result.secure_url,
      publicId: result.public_id,
      width:    result.width,
      height:   result.height
    });
  } catch (err) { next(err); }
};
