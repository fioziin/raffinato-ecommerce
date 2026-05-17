'use strict';
const melhorEnvio = require('../services/melhorEnvio.service');

exports.quote = async (req, res, next) => {
  try {
    const { to, items } = req.body;
    if (!to?.postal_code) return res.status(400).json({ message: 'CEP de destino é obrigatório.' });
    if (!items?.length)   return res.status(400).json({ message: 'Lista de itens é obrigatória.' });

    const cep      = String(to.postal_code).replace(/\D/g, '');
    const subtotal = items.reduce((s, i) => s + (Number(i.price) || 0) * (Number(i.quantity) || 1), 0);

    /* Tenta Melhor Envio real quando token configurado */
    if (process.env.MELHOR_ENVIO_TOKEN) {
      try {
        const raw    = await melhorEnvio.quote({ to, items });
        const quotes = Array.isArray(raw)
          ? raw.filter(q => !q.error && q.price != null).map(q => ({
              id:          q.id,
              name:        q.name,
              companyId:   q.company?.id,
              companyName: q.company?.name,
              price:       parseFloat(q.price),
              deadline:    q.delivery_time,
              simulated:   false
            }))
          : [];

        if (quotes.length) {
          if (subtotal >= 299) {
            quotes.unshift({ id: 'gratis', name: 'Frete Grátis', companyName: 'Correios', price: 0, deadline: 10, simulated: false });
          }
          return res.json(quotes);
        }
      } catch (err) {
        console.warn('[Shipping] Melhor Envio indisponível, usando simulação:', err.message);
      }
    }

    /* Fallback: simulação por região */
    res.json(melhorEnvio.simulateQuote(cep, subtotal));
  } catch (err) { next(err); }
};
