const router     = require('express').Router();
const rateLimit  = require('express-rate-limit');
const authCtrl   = require('../controllers/auth.controller');
const authMw     = require('../middleware/auth.middleware');

const loginLimit = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, message: { message: 'Muitas tentativas. Tente novamente em 15 minutos.' } });

router.post('/login', loginLimit, authCtrl.login);
router.get('/me', authMw, authCtrl.me);

module.exports = router;
