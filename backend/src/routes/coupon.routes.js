'use strict';
const router = require('express').Router();
const ctrl   = require('../controllers/coupon.controller');

router.post('/coupons/validate', ctrl.validate);

module.exports = router;
