'use strict';
const router     = require('express').Router();
const multer     = require('multer');
const authMw     = require('../middleware/auth.middleware');
const uploadCtrl = require('../controllers/upload.controller');

const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/webp'];

const upload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 5 * 1024 * 1024 },
  fileFilter(req, file, cb) {
    if (!ALLOWED_MIMES.includes(file.mimetype)) {
      return cb(Object.assign(new Error('Apenas JPEG, PNG e WebP são permitidos.'), { status: 400 }));
    }
    cb(null, true);
  }
});

router.post('/admin/upload/image', authMw, upload.single('image'), uploadCtrl.uploadImage);

module.exports = router;
