require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const mongoose = require('mongoose');
const Admin    = require('../models/Admin');

async function seed() {
  const uri  = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/raffinato';
  const name  = process.env.ADMIN_NAME     || 'Admin RAFFINATO';
  const email = process.env.ADMIN_EMAIL    || 'admin@raffinato.com';
  const pass  = process.env.ADMIN_PASSWORD || 'admin123456';

  await mongoose.connect(uri);
  console.log('✅ MongoDB conectado');

  const existing = await Admin.findOne({ email: email.toLowerCase() });
  if (existing) {
    console.log(`⚠️  Admin já existe: ${email}`);
    await mongoose.disconnect();
    return;
  }

  const passwordHash = await Admin.hashPassword(pass);
  await Admin.create({ name, email: email.toLowerCase(), passwordHash });
  console.log(`✅ Admin criado com sucesso!`);
  console.log(`   Email: ${email}`);
  console.log(`   Senha: ${pass}`);
  console.log(`   ⚠️  Altere a senha após o primeiro login!`);

  await mongoose.disconnect();
}

seed().catch(err => { console.error('❌ Erro:', err.message); process.exit(1); });
