const Order        = require('../models/Order');
const Product      = require('../models/Product');
const emailService = require('../services/email.service');

const STATUS_LABELS = {
  pending:           'Pedido recebido',
  awaiting_payment:  'Aguardando pagamento',
  paid:              'Pagamento confirmado',
  preparing:         'Em separação',
  shipped:           'Enviado',
  delivered:         'Entregue',
  canceled:          'Cancelado',
  payment_failed:    'Pagamento recusado',
  stock_unavailable: 'Estoque indisponível'
};

/* ── PÚBLICO: criar pedido ── */
exports.create = async (req, res, next) => {
  try {
    const { customer, address, items, subtotal, discount, shipping, total, paymentMethod } = req.body;

    if (!customer?.name || !customer?.email) return res.status(400).json({ message: 'Dados do cliente incompletos.' });
    if (!items || !items.length)             return res.status(400).json({ message: 'Carrinho vazio.' });

    const order = await Order.create({
      customer, address, items,
      subtotal:       subtotal || 0,
      discount:       discount || 0,
      shipping:       shipping || 0,
      total:          total    || 0,
      paymentMethod:  paymentMethod || 'mercadopago',
      shippingOption: req.body.shippingOption || undefined,
      status:         'awaiting_payment'
    });

    res.status(201).json({ orderNumber: order.orderNumber, id: order._id, status: order.status });

    /* E-mail não bloqueia a resposta */
    setImmediate(async () => {
      try {
        console.log('[Email] Iniciando envio de confirmação do pedido...');
        console.log('[Email] Pedido:', String(order._id));
        console.log('[Email] Cliente:', order.customer?.email);
        await emailService.sendOrderConfirmation(order);
        console.log('[Email] Confirmação enviada com sucesso.');
      } catch (err) {
        console.error('[Email] Falha ao enviar confirmação:', err.message);
      }
    });
  } catch (err) { next(err); }
};

/* ── PÚBLICO: rastrear pedido ── */
exports.track = async (req, res, next) => {
  try {
    const { email, orderNumber } = req.query;
    if (!email || !orderNumber) return res.status(400).json({ message: 'Email e número do pedido são obrigatórios.' });

    const order = await Order.findOne({ orderNumber: orderNumber.toUpperCase(), 'customer.email': email.toLowerCase() });
    if (!order) return res.status(404).json({ message: 'Pedido não encontrado.' });

    res.json({
      orderNumber: order.orderNumber,
      status:      order.status,
      statusLabel: STATUS_LABELS[order.status] || order.status,
      createdAt:   order.createdAt,
      items:       order.items,
      total:       order.total,
      address:     order.address,
      customer:    { name: order.customer.name, email: order.customer.email }
    });
  } catch (err) { next(err); }
};

/* ── ADMIN: listar pedidos ── */
exports.adminList = async (req, res, next) => {
  try {
    const { status, q, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status && status !== 'all') filter.status = status;
    if (q) {
      const safe = String(q).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [
        { orderNumber:      { $regex: safe, $options: 'i' } },
        { 'customer.name':  { $regex: safe, $options: 'i' } },
        { 'customer.email': { $regex: safe, $options: 'i' } }
      ];
    }

    const [orders, total] = await Promise.all([
      Order.find(filter).sort({ createdAt: -1 }).skip((page-1)*limit).limit(+limit),
      Order.countDocuments(filter)
    ]);

    res.json({ orders, total, pages: Math.ceil(total/limit), page: +page });
  } catch (err) { next(err); }
};

/* ── ADMIN: detalhe pedido ── */
exports.adminDetail = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Pedido não encontrado.' });
    res.json({ ...order.toObject(), statusLabel: STATUS_LABELS[order.status] });
  } catch (err) { next(err); }
};

/* ── ADMIN: atualizar status ── */
exports.updateStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const validStatuses = ['pending','awaiting_payment','paid','preparing','shipped','delivered','canceled','payment_failed','stock_unavailable'];
    if (!validStatuses.includes(status)) return res.status(400).json({ message: 'Status inválido.' });

    const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!order) return res.status(404).json({ message: 'Pedido não encontrado.' });
    res.json({ status: order.status, statusLabel: STATUS_LABELS[order.status] });
  } catch (err) { next(err); }
};

/* ── ADMIN: dashboard ── */
exports.dashboard = async (req, res, next) => {
  try {
    const [
      totalOrders,
      pendingOrders,
      activeProducts,
      revenueResult,
      latestOrders,
      topProducts
    ] = await Promise.all([
      Order.countDocuments(),
      Order.countDocuments({ status: { $in: ['pending', 'awaiting_payment'] } }),
      Product.countDocuments({ ativo: true }),
      Order.aggregate([
        { $match: { status: { $nin: ['canceled'] } } },
        { $group: { _id: null, total: { $sum: '$total' } } }
      ]),
      Order.find().sort({ createdAt: -1 }).limit(8),
      Order.aggregate([
        { $unwind: '$items' },
        { $group: { _id: '$items.nome', total: { $sum: '$items.quantidade' }, receita: { $sum: { $multiply: ['$items.preco', '$items.quantidade'] } } } },
        { $sort: { total: -1 } },
        { $limit: 5 }
      ])
    ]);

    res.json({
      totalOrders,
      pendingOrders,
      activeProducts,
      totalRevenue: revenueResult[0]?.total || 0,
      latestOrders,
      topProducts
    });
  } catch (err) { next(err); }
};
