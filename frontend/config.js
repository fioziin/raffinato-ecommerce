window.RAFFINATO_CONFIG = {
  API_URL:
    !window.location.hostname ||
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1'
      ? 'http://localhost:5000/api'
      : 'https://raffinato-ecommerce-production.up.railway.app/api'
};
