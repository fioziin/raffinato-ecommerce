'use strict';
const router = require('express').Router();
const ctrl   = require('../controllers/payment.controller');

router.post('/payments/mercadopago/create-preference', ctrl.createPreference);

module.exports = router;
