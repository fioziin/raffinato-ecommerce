'use strict';

function getCoupons() {
  try {
    if (process.env.COUPONS) return JSON.parse(process.env.COUPONS);
  } catch (e) {
    console.warn('[Coupons] COUPONS env inválida, usando padrão.');
  }
  return [
    { code: 'RAFFINATO10', type: 'percent', value: 10, description: '10% de desconto' }
  ];
}

exports.validate = (req, res) => {
  const { code, subtotal } = req.body;
  if (!code) return res.status(400).json({ valid: false, message: 'Código obrigatório.' });

  const coupons = getCoupons();
  const coupon  = coupons.find(c => c.code === String(code).trim().toUpperCase());

  if (!coupon) {
    return res.status(404).json({ valid: false, message: 'Cupom inválido ou expirado.' });
  }

  const sub = Math.max(0, Number(subtotal) || 0);
  let discount = 0;

  if (coupon.type === 'percent') {
    discount = sub * (coupon.value / 100);
  } else if (coupon.type === 'fixed') {
    discount = Math.min(coupon.value, sub);
  }
  // type 'shipping' → desconto no frete, tratado no frontend

  res.json({
    valid:       true,
    code:        coupon.code,
    type:        coupon.type,
    value:       coupon.value,
    discount:    parseFloat(discount.toFixed(2)),
    description: coupon.description || `${coupon.value}% de desconto`
  });
};
