'use strict';
const router = require('express').Router();
const ctrl   = require('../controllers/shipping.controller');

router.post('/shipping/quote', ctrl.quote);

module.exports = router;
