'use strict';
const { MercadoPagoConfig, Preference, Payment } = require('mercadopago');

function getClient() {
  return new MercadoPagoConfig({
    accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN,
    options: { timeout: 10000 }
  });
}

exports.createPreference = async ({ order }) => {
  const client     = getClient();
  const preference = new Preference(client);

  const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5500';
  const BACKEND_URL  = process.env.BACKEND_URL  || 'http://localhost:5000';

  const items = order.items.map(item => ({
    id:         String(item.productId || item.nome).slice(0, 100),
    title:      item.nome.slice(0, 256),
    quantity:   item.quantidade,
    unit_price: parseFloat(item.preco.toFixed(2)),
    currency_id: 'BRL'
  }));

  if (order.shipping > 0) {
    const label = order.shippingOption?.serviceName
      ? `Frete — ${order.shippingOption.serviceName}`
      : 'Frete';
    items.push({ id: 'frete', title: label, quantity: 1, unit_price: parseFloat(order.shipping.toFixed(2)), currency_id: 'BRL' });
  }

  const result = await preference.create({
    body: {
      external_reference: order._id.toString(),
      items,
      payer: {
        name:  order.customer.name,
        email: order.customer.email,
        identification: {
          type:   'CPF',
          number: (order.customer.cpf || '').replace(/\D/g, '')
        }
      },
      back_urls: {
        success: `${FRONTEND_URL}/obrigado.html?orderNumber=${order.orderNumber}`,
        failure: `${FRONTEND_URL}/checkout.html?payment=failed`,
        pending: `${FRONTEND_URL}/obrigado.html?orderNumber=${order.orderNumber}&payment=pending`
      },
      auto_return:          'approved',
      notification_url:     `${BACKEND_URL}/api/webhooks/mercadopago`,
      statement_descriptor: 'RAFFINATO',
      payment_methods:      { installments: 12 }
    }
  });

  return result;
};

exports.getPayment = async (paymentId) => {
  const client  = getClient();
  const payment = new Payment(client);
  return payment.get({ id: String(paymentId) });
};
