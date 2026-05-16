'use strict';

const BASE_URL = process.env.MELHOR_ENVIO_BASE_URL || 'https://sandbox.melhorenvio.com.br';
const TOKEN    = process.env.MELHOR_ENVIO_TOKEN;

exports.quote = async ({ to, items }) => {
  if (!TOKEN) throw Object.assign(new Error('Token Melhor Envio não configurado.'), { status: 503 });

  const cep = String(to?.postal_code || '').replace(/\D/g, '');
  if (cep.length !== 8) throw Object.assign(new Error('CEP de destino inválido.'), { status: 400 });
  if (!items || !items.length) throw Object.assign(new Error('Lista de produtos vazia.'), { status: 400 });

  const products = items.map((item, i) => ({
    id:              String(i + 1),
    width:           Number(item.width)   || 20,
    height:          Number(item.height)  || 5,
    length:          Number(item.length)  || 25,
    weight:          Number(item.weight)  || 0.3,
    insurance_value: Number(item.price)   || 0,
    quantity:        Number(item.quantity) || 1
  }));

  const payload = {
    from:     { postal_code: process.env.STORE_POSTAL_CODE || '01310100' },
    to:       { postal_code: cep },
    products,
    options:  { receipt: false, own_hand: false, collect: false, insurance_value: 0, reverse: false }
  };

  const res = await fetch(`${BASE_URL}/api/v2/me/shipment/calculate`, {
    method:  'POST',
    headers: {
      'Content-Type':  'application/json',
      'Accept':        'application/json',
      'Authorization': `Bearer ${TOKEN}`,
      'User-Agent':    `Raffinato Store (${process.env.STORE_EMAIL || 'contato@raffinato.com'})`
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw Object.assign(new Error(err.message || 'Erro Melhor Envio'), { status: res.status });
  }

  return res.json();
};
