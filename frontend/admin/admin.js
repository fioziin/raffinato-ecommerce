'use strict';

const API = (window.RAFFINATO_CONFIG && window.RAFFINATO_CONFIG.API_URL) || 'http://localhost:5000/api';
const TOKEN_KEY = 'raffinato_admin_token';

/* ── auth ── */
function getToken() { return localStorage.getItem(TOKEN_KEY); }
function setToken(t) { localStorage.setItem(TOKEN_KEY, t); }
function clearToken() { localStorage.removeItem(TOKEN_KEY); }

function requireAuth() {
  if (!getToken()) { window.location.href = 'login.html'; return false; }
  return true;
}

function logout() {
  clearToken();
  window.location.href = 'login.html';
}

/* ── fetch helpers ── */
async function apiFetch(path, opts = {}) {
  const token = getToken();
  const res = await fetch(API + path, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opts.headers || {})
    }
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(data.message || 'Erro'), { status: res.status, data });
  return data;
}

async function apiGet(path) { return apiFetch(path); }
async function apiPost(path, body) { return apiFetch(path, { method: 'POST', body: JSON.stringify(body) }); }
async function apiPut(path, body) { return apiFetch(path, { method: 'PUT', body: JSON.stringify(body) }); }
async function apiPatch(path, body) { return apiFetch(path, { method: 'PATCH', body: JSON.stringify(body) }); }
async function apiDelete(path) { return apiFetch(path, { method: 'DELETE' }); }

/* ── toast ── */
function toast(msg, type = 'success') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const t = document.createElement('div');
  t.className = `toast${type === 'error' ? ' error' : type === 'warn' ? ' warn' : ''}`;
  const icon = type === 'error' ? '✕' : type === 'warn' ? '⚠' : '✓';
  t.innerHTML = `<span>${icon}</span> ${msg}`;
  container.appendChild(t);
  setTimeout(() => t.remove(), 3500);
}

/* ── format ── */
function fmtMoney(v) {
  return 'R$ ' + Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function fmtDate(d) {
  return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}
function fmtDateShort(d) {
  return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

/* ── status badges ── */
const STATUS_MAP = {
  pending:          { label: 'Aguardando',       cls: 'badge-pending' },
  awaiting_payment: { label: 'Aguard. Pagamento',cls: 'badge-pending' },
  paid:             { label: 'Pago',             cls: 'badge-paid' },
  preparing:        { label: 'Separando',        cls: 'badge-preparing' },
  shipped:          { label: 'Enviado',          cls: 'badge-shipped' },
  delivered:        { label: 'Entregue',         cls: 'badge-delivered' },
  canceled:         { label: 'Cancelado',        cls: 'badge-canceled' },
  payment_failed:   { label: 'Pagto. Recusado',  cls: 'badge-canceled' },
  stock_unavailable:{ label: 'Sem Estoque',       cls: 'badge-canceled' }
};

function statusBadge(status) {
  const s = STATUS_MAP[status] || { label: status, cls: '' };
  return `<span class="badge ${s.cls}">${s.label}</span>`;
}

/* ── sidebar active ── */
function initSidebar() {
  const page = location.pathname.split('/').pop();
  document.querySelectorAll('.nav-item').forEach(el => {
    if (el.getAttribute('href') === page) el.classList.add('active');
  });

  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) logoutBtn.addEventListener('click', logout);

  loadAdminInfo();
}

async function loadAdminInfo() {
  try {
    const info = JSON.parse(localStorage.getItem('raffinato_admin_info') || '{}');
    const name = info.name || 'Admin RAFFINATO';
    const el = document.getElementById('adminName');
    const av = document.getElementById('adminAvatar');
    if (el) el.textContent = name;
    if (av) av.textContent = name[0].toUpperCase();
  } catch {}
}

/* ── topbar date ── */
function initTopbarDate() {
  const el = document.getElementById('topbarDate');
  if (el) el.textContent = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
}

/* ── debounce ── */
function debounce(fn, ms = 350) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

/* ── modal helpers ── */
function openModal(id) {
  document.getElementById(id)?.classList.add('open');
}
function closeModal(id) {
  document.getElementById(id)?.classList.remove('open');
}
function initModalClose() {
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', e => {
      if (e.target === overlay) overlay.classList.remove('open');
    });
  });
  document.querySelectorAll('.modal-close').forEach(btn => {
    btn.addEventListener('click', () => btn.closest('.modal-overlay')?.classList.remove('open'));
  });
}

/* ── export to other pages ── */
window.Admin = {
  API, getToken, setToken, clearToken, requireAuth, logout,
  apiGet, apiPost, apiPut, apiPatch, apiDelete,
  toast, fmtMoney, fmtDate, fmtDateShort,
  statusBadge, STATUS_MAP,
  initSidebar, initTopbarDate, debounce,
  openModal, closeModal, initModalClose
};
