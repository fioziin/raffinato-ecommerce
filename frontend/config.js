window.RAFFINATO_CONFIG = {
  API_URL:
    !window.location.hostname ||
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1'
      ? 'http://localhost:5000/api'
      : 'https://SEU-BACKEND.up.railway.app/api' // Substitua pela URL real do Railway antes de publicar
};
