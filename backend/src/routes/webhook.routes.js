'use strict';
const crypto       = require('crypto');
const router       = require('express').Router();
const Order        = require('../models/Order');
const Product      = require('../models/Product');
const mpService    = require('../services/mercadoPago.service');
const emailService = require('../services/email.service');

const STATUS_LABELS = {
  paid:              'Pagamento aprovado',
  payment_failed:    'Pagamento recusado',
  stock_unavailable: 'Estoque indisponível'
};

function verifySignature(req) {
  const secret = process.env.MERCADO_PAGO_WEBHOOK_SECRET;
  if (!secret) return true; // dev: skip validation when secret not set

  const xSignature = req.headers['x-signature'];
  const xRequestId = req.headers['x-request-id'];
  const dataId     = req.body?.data?.id;
  if (!xSignature) return false;

  const parts = {};
  xSignature.split(',').forEach(p => {
    const [k, v] = p.trim().split('=', 2);
    parts[k] = v;
  });
  const { ts, v1 } = parts;
  if (!ts || !v1) return false;

  const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;
  const expected  = crypto.createHmac('sha256', secret).update(manifest).digest('hex');

  try {
    return crypto.timingSafeEqual(Buffer.from(v1), Buffer.from(expected));
  } catch {
    return false;
  }
}

async function checkStock(order) {
  const errors = [];
  for (const item of order.items) {
    if (!item.productId) continue;
    const product = await Product.findById(item.productId).catch(() => null);
    if (!product) continue;

    if (product.variants && product.variants.length > 0) {
      const variant   = product.variants.find(v => item.cor ? v.cor === item.cor : true);
      if (!variant) continue;
      const sizeEntry = (variant.tamanhos || []).find(t => t.tamanho === item.tamanho);
      if (!sizeEntry) continue;
      if ((Number(sizeEntry.estoque) || 0) < item.quantidade) errors.push(item.nome);
    } else if (product.estoque) {
      const available = product.estoque.get
        ? (product.estoque.get(item.tamanho) || 0)
        : (product.estoque[item.tamanho]     || 0);
      if (available < item.quantidade) errors.push(item.nome);
    }
  }
  return errors;
}

async function reduceStock(order) {
  for (const item of order.items) {
    if (!item.productId) continue;
    const product = await Product.findById(item.productId).catch(() => null);
    if (!product) continue;

    if (product.variants && product.variants.length > 0) {
      const variant   = product.variants.find(v => item.cor ? v.cor === item.cor : true);
      if (!variant) continue;
      const sizeEntry = (variant.tamanhos || []).find(t => t.tamanho === item.tamanho);
      if (!sizeEntry) continue;
      sizeEntry.estoque = Math.max(0, (Number(sizeEntry.estoque) || 0) - item.quantidade);
      product.markModified('variants');
    } else if (product.estoque) {
      const current = product.estoque.get
        ? (product.estoque.get(item.tamanho) || 0)
        : (product.estoque[item.tamanho]     || 0);
      if (product.estoque.set) product.estoque.set(item.tamanho, Math.max(0, current - item.quantidade));
      else product.estoque[item.tamanho] = Math.max(0, current - item.quantidade);
    }
    await product.save();
  }
}

router.post('/webhooks/mercadopago', async (req, res) => {
  try {
    if (!verifySignature(req)) {
      console.warn('Webhook MP: assinatura inválida');
      return res.sendStatus(200); // always 200 to avoid MP retries
    }

    const { type, data } = req.body;
    if (type !== 'payment') return res.sendStatus(200);

    const paymentId = data?.id;
    if (!paymentId) return res.sendStatus(200);

    const payment = await mpService.getPayment(paymentId);
    const orderId = payment.external_reference;
    if (!orderId) return res.sendStatus(200);

    const order = await Order.findById(orderId);
    if (!order) return res.sendStatus(200);

    /* idempotência */
    if (
      order.payment?.paymentId === String(paymentId) &&
      order.payment?.status   === payment.status
    ) return res.sendStatus(200);

    const now = new Date();
    order.payment = {
      provider:     'mercadopago',
      preferenceId: order.payment?.preferenceId,
      paymentId:    String(paymentId),
      status:       payment.status,
      paidAt:       payment.status === 'approved' ? now : order.payment?.paidAt
    };

    if (payment.status === 'approved' && order.status !== 'paid') {
      const stockErrors = await checkStock(order);
      if (stockErrors.length > 0) {
        order.status = 'stock_unavailable';
        order.timeline.push({ status: 'stock_unavailable', label: STATUS_LABELS.stock_unavailable, date: now });
      } else {
        await reduceStock(order);
        order.status = 'paid';
        order.timeline.push({ status: 'paid', label: STATUS_LABELS.paid, date: now });
        await order.save();
        emailService.sendPaymentConfirmed(order).catch(() => {});
        return res.sendStatus(200);
      }
    } else if (['rejected', 'cancelled'].includes(payment.status)) {
      order.status = 'payment_failed';
      order.timeline.push({ status: 'payment_failed', label: STATUS_LABELS.payment_failed, date: now });
    }

    await order.save();
    res.sendStatus(200);
  } catch (err) {
    console.error('Webhook MP error:', err.message);
    res.sendStatus(200);
  }
});

module.exports = router;
