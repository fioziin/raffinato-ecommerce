'use strict';

const BASE_URL = process.env.MELHOR_ENVIO_BASE_URL || 'https://sandbox.melhorenvio.com.br';
const TOKEN    = process.env.MELHOR_ENVIO_TOKEN;

/* ── SIMULAÇÃO POR REGIÃO ─────────────────────────────────── */
function getRegion(cep) {
  const p = parseInt(String(cep).replace(/\D/g, '').slice(0, 2), 10);
  if (p >= 1  && p <= 19) return 'sp';
  if (p >= 20 && p <= 39) return 'sudeste';
  return 'outros';
}

exports.simulateQuote = function(cep, subtotal) {
  const sub = Number(subtotal) || 0;
  const tables = {
    sp: [
      { id: 'pac',    name: 'PAC',    companyName: 'Correios', price: 18.90, deadline: 8,  simulated: true },
      { id: 'sedex',  name: 'SEDEX',  companyName: 'Correios', price: 29.90, deadline: 4,  simulated: true },
      { id: 'jadlog', name: 'Jadlog', companyName: 'Jadlog',   price: 24.90, deadline: 6,  simulated: true }
    ],
    sudeste: [
      { id: 'pac',    name: 'PAC',    companyName: 'Correios', price: 24.90, deadline: 10, simulated: true },
      { id: 'sedex',  name: 'SEDEX',  companyName: 'Correios', price: 39.90, deadline:  6, simulated: true },
      { id: 'jadlog', name: 'Jadlog', companyName: 'Jadlog',   price: 32.90, deadline:  8, simulated: true }
    ],
    outros: [
      { id: 'pac',    name: 'PAC',    companyName: 'Correios', price: 34.90, deadline: 14, simulated: true },
      { id: 'sedex',  name: 'SEDEX',  companyName: 'Correios', price: 59.90, deadline:  8, simulated: true },
      { id: 'jadlog', name: 'Jadlog', companyName: 'Jadlog',   price: 44.90, deadline: 12, simulated: true }
    ]
  };

  const options = tables[getRegion(cep)].map(o => ({ ...o }));
  if (sub >= 299) {
    options.unshift({ id: 'gratis', name: 'Frete Grátis', companyName: 'Correios', price: 0, deadline: 10, simulated: true });
  }
  return options;
};

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
