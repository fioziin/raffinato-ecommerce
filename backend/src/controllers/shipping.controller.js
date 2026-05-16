'use strict';
const melhorEnvio = require('../services/melhorEnvio.service');

exports.quote = async (req, res, next) => {
  try {
    const { to, items } = req.body;
    if (!to?.postal_code) return res.status(400).json({ message: 'CEP de destino é obrigatório.' });
    if (!items?.length)   return res.status(400).json({ message: 'Lista de itens é obrigatória.' });

    const quotes = await melhorEnvio.quote({ to, items });

    const valid = Array.isArray(quotes)
      ? quotes
          .filter(q => !q.error && q.price != null)
          .map(q => ({
            id:          q.id,
            name:        q.name,
            companyId:   q.company?.id,
            companyName: q.company?.name,
            price:       parseFloat(q.price),
            deadline:    q.delivery_time
          }))
      : [];

    res.json(valid);
  } catch (err) { next(err); }
};
