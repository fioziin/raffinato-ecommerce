'use strict';

const router    = require('express').Router();
const rateLimit = require('express-rate-limit');
const userCtrl  = require('../controllers/user.controller');

const authLimit  = rateLimit({ windowMs: 15 * 60 * 1000, max: 10,  standardHeaders: true, message: { message: 'Muitas tentativas. Tente novamente em 15 minutos.' } });
const resetLimit = rateLimit({ windowMs: 60 * 60 * 1000, max: 5,   standardHeaders: true, message: { message: 'Muitas tentativas. Tente novamente em 1 hora.' } });

router.post('/register',        authLimit,  userCtrl.register);
router.post('/login',           authLimit,  userCtrl.login);
router.post('/forgot-password', resetLimit, userCtrl.forgotPassword);
router.post('/reset-password',  resetLimit, userCtrl.resetPassword);

module.exports = router;
