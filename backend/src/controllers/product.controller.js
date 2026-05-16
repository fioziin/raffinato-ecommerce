const Product = require('../models/Product');

/* ── PÚBLICOS ── */
exports.list = async (req, res, next) => {
  try {
    const { genero, promocao, destaque, lancamento } = req.query;
    const filter = { ativo: true };
    if (genero)   filter.genero   = genero;
    if (promocao  === 'true') filter.promocao  = true;
    if (destaque  === 'true') filter.destaque  = true;
    if (lancamento === 'true') filter.lancamento = true;
    const products = await Product.find(filter).sort({ createdAt: -1 });
    res.json(products);
  } catch (err) { next(err); }
};

exports.getById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product || !product.ativo) return res.status(404).json({ message: 'Produto não encontrado.' });
    res.json(product);
  } catch (err) { next(err); }
};

exports.getBySlug = async (req, res, next) => {
  try {
    const product = await Product.findOne({ slug: req.params.slug, ativo: true });
    if (!product) return res.status(404).json({ message: 'Produto não encontrado.' });
    res.json(product);
  } catch (err) { next(err); }
};

/* ── ADMIN ── */
exports.adminList = async (req, res, next) => {
  try {
    const { q } = req.query;
    const filter = {};
    if (q) filter.nome = { $regex: String(q).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };
    const products = await Product.find(filter).sort({ createdAt: -1 });
    res.json(products);
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    if (!req.body.slug) {
      req.body.slug = req.body.nome.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    }
    const product = await Product.create(req.body);
    res.status(201).json(product);
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!product) return res.status(404).json({ message: 'Produto não encontrado.' });
    res.json(product);
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ message: 'Produto não encontrado.' });
    res.json({ message: 'Produto removido.' });
  } catch (err) { next(err); }
};

exports.toggleActive = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Produto não encontrado.' });
    product.ativo = !product.ativo;
    await product.save();
    res.json({ ativo: product.ativo });
  } catch (err) { next(err); }
};
