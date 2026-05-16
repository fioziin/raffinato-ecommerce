/* RAFFINATO — main.js */
(function () {
  'use strict';

  /* ── UTILS ── */
  const CART_KEY = 'raffinato_cart';
  const fmt = n => 'R$ ' + n.toLocaleString('pt-BR', { minimumFractionDigits: 2 });

  /* ── WISHLIST STATE ── */
  const WISH_KEY = 'raffinato_wishlist';
  function getWishlist() {
    try { return JSON.parse(localStorage.getItem(WISH_KEY)) || []; }
    catch { return []; }
  }

  /* ── SCROLL REVEAL ── */
  const revealObs = ('IntersectionObserver' in window)
    ? new IntersectionObserver((entries) => {
        entries.forEach(e => {
          if (!e.isIntersecting) return;
          e.target.classList.add('is-visible');
          revealObs.unobserve(e.target);
        });
      }, { threshold: 0.1 })
    : null;

  function observeReveal(root) {
    if (!revealObs) {
      (root === document ? document.querySelectorAll('.reveal') : root.querySelectorAll('.reveal'))
        .forEach(el => el.classList.add('is-visible'));
      return;
    }
    const els = root === document
      ? document.querySelectorAll('.reveal')
      : root.querySelectorAll('.reveal');
    els.forEach((el, i) => {
      if (el.classList.contains('pcard')) {
        el.style.transitionDelay = `${(i % 4) * 0.07}s`;
      }
      revealObs.observe(el);
    });
  }

  /* ── CART STATE ── */
  function getCart() {
    try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; }
    catch { return []; }
  }

  function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    updateCartBadge();
  }

  function updateCartBadge() {
    const el = document.getElementById('cartCount');
    if (!el) return;
    const total = getCart().reduce((s, i) => s + i.qty, 0);
    el.textContent = total;
    el.dataset.empty = total === 0 ? 'true' : 'false';
  }

  /* ── CART DRAWER ── */
  const cartDrawer  = document.getElementById('cartDrawer');
  const cartOverlay = document.getElementById('cartOverlay');
  const cartClose   = document.getElementById('cartClose');
  const cartBtn     = document.getElementById('cartBtn');

  function openCart() {
    renderCart();
    cartDrawer && cartDrawer.classList.add('is-open');
    cartOverlay && cartOverlay.classList.add('is-active');
    if (cartDrawer) cartDrawer.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeCart() {
    cartDrawer && cartDrawer.classList.remove('is-open');
    cartOverlay && cartOverlay.classList.remove('is-active');
    if (cartDrawer) cartDrawer.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  cartBtn     && cartBtn.addEventListener('click', openCart);
  cartClose   && cartClose.addEventListener('click', closeCart);
  cartOverlay && cartOverlay.addEventListener('click', closeCart);

  function renderCart() {
    const body    = document.getElementById('cartBody');
    const totalEl = document.getElementById('cartTotal');
    if (!body) return;

    const cart = getCart();

    if (!cart.length) {
      body.innerHTML = `
        <div class="cart-empty">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
            <line x1="3" y1="6" x2="21" y2="6"/>
            <path d="M16 10a4 4 0 0 1-8 0"/>
          </svg>
          <p>Seu carrinho está vazio.</p>
          <a href="#" class="cart-empty-link" id="cartEmptyShop">Continuar comprando</a>
        </div>`;
      document.getElementById('cartEmptyShop')
        && document.getElementById('cartEmptyShop').addEventListener('click', e => { e.preventDefault(); closeCart(); });
      if (totalEl) totalEl.textContent = fmt(0);
      return;
    }

    const total = cart.reduce((s, i) => s + i.preco * i.qty, 0);

    body.innerHTML = cart.map(item => {
      const corInfo = item.cor
        ? `<span style="display:inline-flex;align-items:center;gap:4px">
             <span style="display:inline-block;width:9px;height:9px;border-radius:50%;background:${item.corHex || '#888'};border:1px solid rgba(0,0,0,.15)"></span>
             ${item.cor}
           </span> &nbsp;·&nbsp; `
        : '';
      return `
      <div class="ci">
        <img class="ci__img" src="${item.imagem}" alt="${item.nome}">
        <div class="ci__info">
          <span class="ci__name">${item.nome}</span>
          <span class="ci__meta">${corInfo}Tam: ${item.size} &nbsp;·&nbsp; ${fmt(item.preco)}</span>
          <div class="ci__row">
            <div class="ci__qty">
              <button class="ci__qbtn" data-action="dec" data-id="${item.id}" data-size="${item.size}" data-cor="${item.cor || ''}">−</button>
              <span class="ci__qval">${item.qty}</span>
              <button class="ci__qbtn" data-action="inc" data-id="${item.id}" data-size="${item.size}" data-cor="${item.cor || ''}">+</button>
            </div>
            <span class="ci__subtotal">${fmt(item.preco * item.qty)}</span>
          </div>
        </div>
        <button class="ci__rm" data-id="${item.id}" data-size="${item.size}" data-cor="${item.cor || ''}" aria-label="Remover item">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>`;
    }).join('');

    if (totalEl) totalEl.textContent = fmt(total);

    body.querySelectorAll('.ci__rm').forEach(btn => {
      btn.addEventListener('click', () => {
        saveCart(getCart().filter(i =>
          !(i.id === btn.dataset.id && i.size === btn.dataset.size && (i.cor || '') === btn.dataset.cor)
        ));
        renderCart();
      });
    });

    body.querySelectorAll('.ci__qbtn').forEach(btn => {
      btn.addEventListener('click', () => {
        const cart = getCart();
        const item = cart.find(i =>
          i.id === btn.dataset.id && i.size === btn.dataset.size && (i.cor || '') === btn.dataset.cor
        );
        if (item) {
          item.qty = Math.max(1, item.qty + (btn.dataset.action === 'inc' ? 1 : -1));
          saveCart(cart);
          renderCart();
        }
      });
    });
  }

  /* ── EXPOSE GLOBALLY (used by produto.html) ── */
  window.raffinato = {
    openCart,
    closeCart,
    addCartItem(item) {
      const cart = getCart();
      const existing = cart.find(i =>
        i.id === item.id && i.size === item.size && (i.cor || '') === (item.cor || '')
      );
      if (existing) existing.qty += item.qty;
      else cart.push(item);
      saveCart(cart);
      openCart();
    }
  };

  /* ── PRODUCT CARD HTML ── */
  function pcardHTML(p) {
    const off = p.precoAntigo ? Math.round((1 - p.preco / p.precoAntigo) * 100) : 0;
    const wished = getWishlist().includes(String(p.id));
    const resolve = typeof resolveImageUrl === 'function' ? resolveImageUrl : u => u || '';
    const img   = resolve(p.imagem);
    const hover = p.hoverImagem ? resolve(p.hoverImagem) : null;
    return `
      <a class="pcard reveal" href="produto.html?id=${p.id}">
        <div class="pcard__img-wrap">
          ${p.promocao ? `<span class="pcard__badge pcard__badge--off">${off}% OFF</span>` : ''}
          ${p.lancamento && !p.promocao ? '<span class="pcard__badge pcard__badge--new">NOVO</span>' : ''}
          <img class="pcard__img pcard__img--primary" src="${img}" alt="${p.nome}" loading="lazy">
          ${hover ? `<img class="pcard__img pcard__img--hover" src="${hover}" alt="" loading="lazy" aria-hidden="true">` : ''}
          <button class="pcard__wish${wished ? ' is-wishlisted' : ''}" data-wish-id="${p.id}" aria-label="Lista de desejos">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="${wished ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
          </button>
          <button class="pcard__buy" data-id="${p.id}">COMPRAR</button>
        </div>
        <div class="pcard__info">
          <h3 class="pcard__name">${p.nome}</h3>
          <div class="pcard__prices">
            ${p.precoAntigo ? `<s class="pcard__old">${fmt(p.precoAntigo)}</s>` : ''}
            <strong class="pcard__price">${fmt(p.preco)}</strong>
          </div>
          <p class="pcard__install">ou 3x de ${fmt(p.preco / 3)} sem juros</p>
        </div>
      </a>`;
  }

  function renderSection(gridId, products) {
    const el = document.getElementById(gridId);
    if (!el || !products.length) return;
    el.innerHTML = products.map(pcardHTML).join('');
    observeReveal(el);

    el.querySelectorAll('.pcard__buy').forEach(btn => {
      btn.addEventListener('click', e => {
        e.preventDefault();
        e.stopPropagation();
        window.location.href = 'produto.html?id=' + btn.dataset.id;
      });
    });
  }

  /* ── RENDER SECTIONS FROM PRODUCTS ── */
  function normalizeProduct(p) {
    return { ...p, id: p.id || p._id };
  }

  function renderAll(products) {
    const ps = products.map(normalizeProduct);
    renderSection('grid-mais-vendidos', ps.filter(p => p.destaque).slice(0, 8));
    renderSection('grid-masculino',     ps.filter(p => p.genero === 'masculino').slice(0, 8));
    renderSection('grid-feminino',      ps.filter(p => p.genero === 'feminino').slice(0, 4));
    renderSection('grid-promocoes',     ps.filter(p => p.promocao).slice(0, 4));
    renderSection('grid-lancamentos',   ps.filter(p => p.lancamento).slice(0, 8));
  }

  (async function loadProducts() {
    try {
      const API = (window.RAFFINATO_CONFIG && window.RAFFINATO_CONFIG.API_URL) || 'http://localhost:5000/api';
      const res = await fetch(`${API}/products?limit=100&ativo=true`);
      if (!res.ok) throw new Error('api_fail');
      const data = await res.json();
      const products = (data.products || data || []);
      if (products.length) { renderAll(products); return; }
      throw new Error('empty');
    } catch {
      if (typeof PRODUCTS !== 'undefined' && PRODUCTS.length) renderAll(PRODUCTS);
    }
  })();

  /* ── HEADER SCROLL SHADOW ── */
  const header = document.getElementById('header');
  window.addEventListener('scroll', () => {
    header && header.classList.toggle('is-scrolled', window.scrollY > 4);
  }, { passive: true });
  header && header.classList.toggle('is-scrolled', window.scrollY > 4);

  /* ── SCROLL TO SECTION ── */
  document.querySelectorAll('[data-scroll]').forEach(el => {
    el.addEventListener('click', e => {
      const target = el.dataset.scroll;
      if (!target) return;
      if (target === 'top') {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      const section = document.getElementById(target);
      if (section) {
        e.preventDefault();
        const offset = (header ? header.offsetHeight : 92) + 16;
        window.scrollTo({ top: section.getBoundingClientRect().top + window.scrollY - offset, behavior: 'smooth' });
        closeMobileMenu();
      }
    });
  });

  /* ── MOBILE MENU ── */
  const hamburgerBtn  = document.getElementById('hamburgerBtn');
  const mobileMenu    = document.getElementById('mobileMenu');
  const mobileOverlay = document.getElementById('mobileOverlay');
  const mobileClose   = document.getElementById('mobileClose');

  function openMobileMenu() {
    mobileMenu && mobileMenu.classList.add('is-open');
    mobileOverlay && mobileOverlay.classList.add('is-active');
    hamburgerBtn && hamburgerBtn.classList.add('is-active');
    hamburgerBtn && hamburgerBtn.setAttribute('aria-expanded', 'true');
    mobileMenu && mobileMenu.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeMobileMenu() {
    mobileMenu && mobileMenu.classList.remove('is-open');
    mobileOverlay && mobileOverlay.classList.remove('is-active');
    hamburgerBtn && hamburgerBtn.classList.remove('is-active');
    hamburgerBtn && hamburgerBtn.setAttribute('aria-expanded', 'false');
    mobileMenu && mobileMenu.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  hamburgerBtn  && hamburgerBtn.addEventListener('click', openMobileMenu);
  mobileClose   && mobileClose.addEventListener('click', closeMobileMenu);
  mobileOverlay && mobileOverlay.addEventListener('click', closeMobileMenu);

  /* ── SEARCH OVERLAY ── */
  const searchBtn     = document.getElementById('searchBtn');
  const searchOverlay = document.getElementById('searchOverlay');
  const searchClose   = document.getElementById('searchClose');
  const searchInput   = document.getElementById('searchInput');

  function openSearch() {
    searchOverlay && searchOverlay.classList.add('is-open');
    searchOverlay && searchOverlay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    setTimeout(() => searchInput && searchInput.focus(), 80);
  }

  function closeSearch() {
    searchOverlay && searchOverlay.classList.remove('is-open');
    searchOverlay && searchOverlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  searchBtn   && searchBtn.addEventListener('click', openSearch);
  searchClose && searchClose.addEventListener('click', closeSearch);
  searchOverlay && searchOverlay.addEventListener('click', e => {
    if (e.target === searchOverlay) closeSearch();
  });

  /* ── KEYBOARD ESC ── */
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    closeSearch();
    closeMobileMenu();
    closeCart();
  });

  /* ── TOPBAR ROTATING MESSAGES ── */
  (function initTopbar() {
    const el = document.querySelector('.topbar__message');
    if (!el) return;
    const msgs = [
      '🚚 FRETE GRÁTIS ACIMA DE R$ 299,00 &nbsp;·&nbsp; PARCELE EM ATÉ 3X SEM JUROS',
      '✨ NOVOS LANÇAMENTOS TODA SEMANA &nbsp;·&nbsp; SEJA O PRIMEIRO A SABER',
      '🔄 TROCA FÁCIL EM ATÉ 7 DIAS &nbsp;·&nbsp; GARANTIA DE QUALIDADE'
    ];
    let idx = 0;
    setInterval(() => {
      el.classList.add('is-fading');
      setTimeout(() => {
        idx = (idx + 1) % msgs.length;
        el.innerHTML = msgs[idx];
        el.classList.remove('is-fading');
      }, 420);
    }, 4000);
  })();

  /* ── STATS COUNTER ── */
  (function initCounters() {
    const els = document.querySelectorAll('[data-count]');
    if (!els.length || !('IntersectionObserver' in window)) return;
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        const el = e.target;
        const target = parseInt(el.dataset.count, 10);
        const suffix = el.dataset.suffix || '';
        const duration = 1600;
        const startTime = performance.now();
        obs.unobserve(el);
        function tick(now) {
          const progress = Math.min((now - startTime) / duration, 1);
          const ease = 1 - Math.pow(1 - progress, 3);
          const val = Math.floor(ease * target);
          el.textContent = val.toLocaleString('pt-BR') + (progress < 1 ? '' : suffix);
          if (progress < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
      });
    }, { threshold: 0.4 });
    els.forEach(el => obs.observe(el));
  })();

  /* ── BACK TO TOP ── */
  (function initBackToTop() {
    const btn = document.getElementById('backToTop');
    if (!btn) return;
    window.addEventListener('scroll', () => {
      btn.classList.toggle('is-visible', window.scrollY > 500);
    }, { passive: true });
    btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  })();

  /* ── NEWSLETTER ── */
  (function initNewsletter() {
    const form    = document.getElementById('newsletterForm');
    const success = document.getElementById('newsletterSuccess');
    if (!form) return;
    form.addEventListener('submit', e => {
      e.preventDefault();
      form.style.opacity = '0';
      form.style.pointerEvents = 'none';
      setTimeout(() => {
        form.style.display = 'none';
        success && success.classList.add('is-visible');
      }, 350);
    });
  })();

  /* ── WISHLIST CLICK DELEGATION ── */
  document.addEventListener('click', e => {
    const btn = e.target.closest('.pcard__wish');
    if (!btn) return;
    e.preventDefault();
    e.stopPropagation();
    const id = String(btn.dataset.wishId);
    const list = getWishlist();
    const idx = list.indexOf(id);
    if (idx === -1) list.push(id);
    else list.splice(idx, 1);
    localStorage.setItem(WISH_KEY, JSON.stringify(list));
    const isNowWished = idx === -1;
    btn.classList.toggle('is-wishlisted', isNowWished);
    const path = btn.querySelector('path');
    if (path) path.setAttribute('fill', isNowWished ? 'currentColor' : 'none');
  });

  /* ── INIT ── */
  updateCartBadge();
  observeReveal(document);

})();
