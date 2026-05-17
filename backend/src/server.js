require('dotenv').config();

const path      = require('path');
const express   = require('express');
const cors      = require('cors');
const helmet    = require('helmet');
const morgan    = require('morgan');
const rateLimit = require('express-rate-limit');
const mongoose  = require('mongoose');

const connectDB       = require('./config/database');
const errorMiddleware = require('./middleware/error.middleware');
const Admin           = require('./models/Admin');

const authRoutes     = require('./routes/auth.routes');
const userRoutes     = require('./routes/user.routes');
const productRoutes  = require('./routes/product.routes');
const orderRoutes    = require('./routes/order.routes');
const uploadRoutes   = require('./routes/upload.routes');
const shippingRoutes = require('./routes/shipping.routes');
const paymentRoutes  = require('./routes/payment.routes');
const webhookRoutes  = require('./routes/webhook.routes');
const couponRoutes   = require('./routes/coupon.routes');

const app  = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 5000;

/* ── CORS ── */
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5500,http://127.0.0.1:5500')
  .split(',').map(o => o.trim()).filter(Boolean);

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({
  origin(origin, callback) {
    if (!origin || origin === 'null' || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Origem não permitida pelo CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

/* ── UPLOADS ESTÁTICOS ── */
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

/* ── BODY PARSER ── */
app.use(express.json({ limit: '10mb' }));
app.use(morgan('dev'));

/* ── RATE LIMIT GLOBAL ── */
app.use('/api/', rateLimit({ windowMs: 15 * 60 * 1000, max: 200, standardHeaders: true }));

/* ── HEALTH CHECK ── */
app.get('/api/health', (req, res) => res.json({
  status:    'ok',
  app:       'RAFFINATO API',
  timestamp: new Date().toISOString(),
  mongo:     mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
}));

/* ── ROTAS ── */
app.use('/api/auth',  authRoutes);
app.use('/api/users', userRoutes);
app.use('/api',      productRoutes);
app.use('/api',      orderRoutes);
app.use('/api',      uploadRoutes);
app.use('/api',      shippingRoutes);
app.use('/api',      paymentRoutes);
app.use('/api',      webhookRoutes);
app.use('/api',      couponRoutes);

/* ── ERRO GLOBAL ── */
app.use(errorMiddleware);

/* ── SEED ADMIN ── */
async function ensureAdmin() {
  const email = (process.env.ADMIN_EMAIL || 'admin@raffinato.com').toLowerCase();
  const exists = await Admin.findOne({ email });
  if (exists) return;
  const passwordHash = await Admin.hashPassword(process.env.ADMIN_PASSWORD || 'Admin@123456');
  await Admin.create({ name: process.env.ADMIN_NAME || 'Admin RAFFINATO', email, passwordHash });
  console.log(`✅ Admin padrão criado: ${email}`);
}

/* ── INICIAR ── */
connectDB()
  .then(async () => {
    await ensureAdmin();
    app.listen(PORT, () => console.log(`🚀 RAFFINATO API rodando em http://localhost:${PORT}`));
  })
  .catch(err => { console.error('❌ Falha ao conectar MongoDB:', err.message); process.exit(1); });
