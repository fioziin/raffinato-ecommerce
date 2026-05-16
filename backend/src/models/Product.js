const mongoose = require('mongoose');

const variantSizeSchema = new mongoose.Schema({
  tamanho: { type: String, required: true },
  estoque: { type: Number, default: 0, min: 0 }
}, { _id: false });

const variantSchema = new mongoose.Schema({
  cor:         { type: String, required: true },
  hex:         { type: String, default: '#000000' },
  imagem:      { type: String, default: '' },
  hoverImagem: { type: String, default: '' },
  tamanhos:    { type: [variantSizeSchema], default: [] }
}, { _id: false });

const productSchema = new mongoose.Schema({
  nome:           { type: String, required: true, trim: true },
  slug:           { type: String, required: true, unique: true, lowercase: true, trim: true },
  categoria:      { type: String, required: true, trim: true },
  genero:         { type: String, required: true, enum: ['masculino', 'feminino', 'unissex'] },
  preco:          { type: Number, required: true, min: 0 },
  precoAntigo:    { type: Number, default: null },
  imagem:         { type: String, default: '' },
  hoverImagem:    { type: String, default: '' },
  descricao:      { type: String, default: '' },
  descricaoLonga: { type: String, default: '' },
  tamanhos:       { type: [String], default: [] },
  estoque:        { type: Map, of: Number, default: {} },
  variants:       { type: [variantSchema], default: [] },
  promocao:       { type: Boolean, default: false },
  lancamento:     { type: Boolean, default: false },
  destaque:       { type: Boolean, default: false },
  ativo:          { type: Boolean, default: true },

  /* dimensões para cálculo de frete */
  weight: { type: Number, default: 0.3 },
  width:  { type: Number, default: 20 },
  height: { type: Number, default: 5 },
  length: { type: Number, default: 25 }
}, { timestamps: true });

productSchema.index({ genero: 1, ativo: 1 });
productSchema.index({ promocao: 1, ativo: 1 });
productSchema.index({ destaque: 1, ativo: 1 });

module.exports = mongoose.model('Product', productSchema);
