const router  = require('express').Router();
const ctrl    = require('../controllers/product.controller');
const authMw  = require('../middleware/auth.middleware');

/* PÚBLICAS */
router.get('/products',              ctrl.list);
router.get('/products/slug/:slug',   ctrl.getBySlug);
router.get('/products/:id',          ctrl.getById);

/* ADMIN */
router.get('/admin/products',                    authMw, ctrl.adminList);
router.post('/admin/products',                   authMw, ctrl.create);
router.put('/admin/products/:id',                authMw, ctrl.update);
router.delete('/admin/products/:id',             authMw, ctrl.remove);
router.patch('/admin/products/:id/toggle-active', authMw, ctrl.toggleActive);

module.exports = router;
