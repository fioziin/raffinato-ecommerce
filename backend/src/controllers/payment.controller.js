'use strict';
const Order     = require('../models/Order');
const mpService = require('../services/mercadoPago.service');

exports.createPreference = async (req, res, next) => {
  try {
    const { orderId } = req.body;
    if (!orderId) return res.status(400).json({ message: 'orderId é obrigatório.' });

    const order = await Order.findById(orderId);
    if (!order)                              return res.status(404).json({ message: 'Pedido não encontrado.' });
    if (!order.items || !order.items.length) return res.status(400).json({ message: 'Pedido sem itens.' });
    if (order.status === 'paid')             return res.status(409).json({ message: 'Pedido já pago.' });
    if (['canceled', 'payment_failed', 'stock_unavailable'].includes(order.status)) {
      return res.status(409).json({ message: 'Pedido não pode ser processado neste status.' });
    }

    const result = await mpService.createPreference({ order });

    order.payment = {
      provider:     'mercadopago',
      preferenceId: result.id,
      status:       'pending'
    };
    if (order.status === 'pending') {
      order.status = 'awaiting_payment';
      order.timeline.push({ status: 'awaiting_payment', label: 'Aguardando pagamento', date: new Date() });
    }
    await order.save();

    res.json({
      preferenceId:       result.id,
      init_point:         result.init_point,
      sandbox_init_point: result.sandbox_init_point
    });
  } catch (err) { next(err); }
};
