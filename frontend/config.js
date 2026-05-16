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
 * Garante que toda URL de imagem seja absoluta.
 * URLs relativas (ex: /uploads/...) são prefixadas com BASE_URL.
 */
window.resolveImageUrl = function (url) {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const base = window.RAFFINATO_CONFIG.BASE_URL;
  return base + (url.startsWith('/') ? '' : '/') + url;
};
