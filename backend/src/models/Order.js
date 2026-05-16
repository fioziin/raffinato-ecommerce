const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  productId:  { type: String },
  nome:       { type: String, required: true },
  imagem:     { type: String },
  tamanho:    { type: String },
  cor:        { type: String },
  corHex:     { type: String },
  quantidade: { type: Number, required: true, min: 1 },
  preco:      { type: Number, required: true, min: 0 }
}, { _id: false });

const timelineSchema = new mongoose.Schema({
  status: { type: String },
  label:  { type: String },
  date:   { type: Date, default: Date.now }
}, { _id: false });

const orderSchema = new mongoose.Schema({
  orderNumber: { type: String, unique: true },

  customer: {
    name:  { type: String, required: true },
    email: { type: String, required: true, lowercase: true },
    phone: { type: String },
    cpf:   { type: String }
  },

  address: {
    cep:         String,
    rua:         String,
    numero:      String,
    complemento: String,
    bairro:      String,
    cidade:      String,
    estado:      String
  },

  items:    { type: [itemSchema], required: true },
  subtotal: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  shipping: { type: Number, default: 0 },
  total:    { type: Number, required: true },

  paymentMethod: {
    type:    String,
    enum:    ['pix', 'cartao', 'boleto', 'mercadopago'],
    default: 'mercadopago'
  },

  status: {
    type:    String,
    enum:    ['pending', 'awaiting_payment', 'paid', 'preparing', 'shipped', 'delivered', 'canceled', 'payment_failed', 'stock_unavailable'],
    default: 'pending'
  },

  /* pagamento */
  payment: {
    provider:     { type: String },
    preferenceId: { type: String },
    paymentId:    { type: String },
    status:       { type: String },
    paidAt:       { type: Date }
  },

  /* opção de frete escolhida */
  shippingOption: {
    provider:    { type: String },
    serviceId:   { type: String },
    companyId:   { type: String },
    serviceName: { type: String },
    companyName: { type: String },
    deadline:    { type: Number }
  },

  timeline: { type: [timelineSchema], default: [] }

}, { timestamps: true });

orderSchema.pre('save', function(next) {
  if (!this.orderNumber) {
    this.orderNumber = 'RAF' + Date.now().toString().slice(-8);
  }
  if (this.isNew) {
    this.timeline.push({ status: this.status, label: 'Pedido recebido', date: new Date() });
  }
  next();
});

orderSchema.index({ 'customer.email': 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Order', orderSchema);
