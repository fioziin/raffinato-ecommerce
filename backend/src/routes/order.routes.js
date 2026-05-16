const router = require('express').Router();
const ctrl   = require('../controllers/order.controller');
const authMw = require('../middleware/auth.middleware');

/* PÚBLICAS */
router.post('/orders',       ctrl.create);
router.get('/orders/track',  ctrl.track);

/* ADMIN */
router.get('/admin/orders',              authMw, ctrl.adminList);
router.get('/admin/orders/:id',          authMw, ctrl.adminDetail);
router.patch('/admin/orders/:id/status', authMw, ctrl.updateStatus);
router.get('/admin/dashboard',           authMw, ctrl.dashboard);

module.exports = router;
