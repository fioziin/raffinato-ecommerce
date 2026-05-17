window.RAFFINATO_CONFIG = {
  API_URL:
    !window.location.hostname ||
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1'
      ? 'http://localhost:5000/api'
      : 'https://raffinato-ecommerce-production.up.railway.app/api'
};

window.RAFFINATO_CONFIG.BASE_URL =
  window.RAFFINATO_CONFIG.API_URL.replace(/\/api$/, '');

/**
 * Converte qualquer valor de URL de imagem para URL absoluta válida.
 * Retorna "" se não houver URL utilizável.
 */
window.resolveImageUrl = function (url) {
  if (!url || typeof url !== 'string') return '';
  const clean = url.trim();
  if (!clean) return '';
  if (clean.startsWith('http://') || clean.startsWith('https://')) return clean;
  const base = (window.RAFFINATO_CONFIG && window.RAFFINATO_CONFIG.BASE_URL)
    || 'https://raffinato-ecommerce-production.up.railway.app';
  if (clean.startsWith('/uploads')) return base + clean;
  if (clean.startsWith('uploads'))  return base + '/' + clean;
  return clean;
};
