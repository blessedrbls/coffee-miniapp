/* =========================================================
   Bean & Brew — логіка Telegram Mini App (чистий JavaScript)
   Екрани: home → category → cart → checkout → confirm → (success у демо)
   ========================================================= */
(() => {
  'use strict';

  // ---------- 1. Telegram чи звичайний браузер? ----------
  const tg = window.Telegram && window.Telegram.WebApp;
  // Увага: якщо Mini App відкрито з reply-кнопки (саме так працює sendData),
  // Telegram НЕ передає initData — рядок порожній. Тому орієнтуємося на platform:
  // у Telegram це 'ios', 'android', 'macos', 'tdesktop'…, у звичайному браузері — 'unknown'.
  const IS_TG = Boolean(tg && (tg.initData || (tg.platform && tg.platform !== 'unknown')));
  // Мову бот передає в адресі кнопки: ...?lang=uk (initData з користувачем може не бути)
  const URL_LANG = new URLSearchParams(window.location.search).get('lang') || '';

  const CURRENCY = 'USD'; // ціни в products.js — у центах
  const MAX_QTY = 20;
  const OPEN_HOUR = 8;
  const CLOSE_HOUR = 21;
  const COMMENT_MAX = 300;

  const CATEGORIES = window.CATEGORIES;
  const PRODUCTS = window.PRODUCTS;
  const byId = Object.fromEntries(PRODUCTS.map((p) => [p.id, p]));

  // ---------- 2. Переклади ----------
  const I18N = {
    uk: {
      brand_sub: 'Кав’ярня · самовивіз',
      greet_morning: 'Доброго ранку ☀️',
      greet_day: 'Гарного дня 👋',
      greet_evening: 'Доброго вечора 🌙',
      hero_title: 'Що будемо пити сьогодні?',
      hours: '🕗 08:00–21:00',
      address: '📍 вул. Кавова, 7',
      pickup_only: '🥡 Самовивіз',
      menu: 'Меню',
      popular: 'Популярне',
      items: ['позиція', 'позиції', 'позицій'],
      add: 'Додати',
      cart: 'Кошик',
      clear: 'Очистити',
      cart_empty_title: 'Кошик порожній',
      cart_empty_text: 'Додайте щось смачне з меню',
      to_menu: 'До меню',
      subtotal: 'Товари',
      pickup_price: 'Самовивіз',
      free: 'безкоштовно',
      total: 'Разом',
      pay_note: 'Оплата при отриманні в кав’ярні',
      btn_cart: 'Кошик · {count} · {total}',
      btn_checkout: 'Оформити · {total}',
      btn_next: 'Далі',
      btn_confirm: 'Підтвердити замовлення',
      btn_home: 'На головну',
      checkout_title: 'Оформлення',
      checkout_sub: 'Заберіть замовлення в кав’ярні',
      f_name: 'Ім’я',
      f_name_ph: 'Як до вас звертатися?',
      f_phone: 'Телефон',
      f_phone_ph: '+380 XX XXX XX XX',
      f_time: 'Час самовивозу',
      f_comment: 'Коментар',
      f_comment_ph: 'Напр.: без цукру, на вівсяному молоці',
      asap: 'Якнайшвидше (~15 хв)',
      today: 'Сьогодні',
      tomorrow: 'Завтра',
      err_name: 'Вкажіть ім’я (від 2 символів)',
      err_phone: 'Вкажіть коректний номер телефону',
      err_time: 'Оберіть час',
      confirm_title: 'Перевірте замовлення',
      confirm_sub: 'Усе правильно? Підтвердіть — і ми почнемо готувати',
      order: 'Замовлення',
      contacts: 'Контакти',
      edit: 'Змінити',
      name: 'Ім’я',
      phone: 'Телефон',
      time: 'Самовивіз',
      comment: 'Коментар',
      success_title: 'Замовлення оформлено!',
      success_text: 'У Telegram замовлення надійде боту, а бариста отримає його з кнопками статусів. Це демо-режим — нічого не надіслано.',
      sending: 'Надсилаємо…',
      send_failed: 'Не вдалося надіслати. Відкрийте меню кнопкою «☕ Відкрити меню» під полем вводу в чаті з ботом.',
      added: 'Додано: {name}',
      max_qty: 'Максимум {n} шт.',
      demo: 'Демо-режим',
      intro_title: 'Це Telegram Mini App',
      intro_text: 'Застосунок створений для відкриття всередині Telegram через бота. У браузері він працює в демо-режимі: можна переглянути меню, додати товари в кошик і пройти оформлення — замовлення нікуди не надсилається.',
      intro_btn: 'Переглянути демо',
      intro_hint: 'Мову й тему можна перемкнути вгорі сторінки',
    },
    en: {
      brand_sub: 'Coffee shop · pickup',
      greet_morning: 'Good morning ☀️',
      greet_day: 'Have a nice day 👋',
      greet_evening: 'Good evening 🌙',
      hero_title: 'What are we drinking today?',
      hours: '🕗 08:00–21:00',
      address: '📍 7 Coffee St.',
      pickup_only: '🥡 Pickup',
      menu: 'Menu',
      popular: 'Popular',
      items: ['item', 'items'],
      add: 'Add',
      cart: 'Cart',
      clear: 'Clear',
      cart_empty_title: 'Your cart is empty',
      cart_empty_text: 'Add something tasty from the menu',
      to_menu: 'Back to menu',
      subtotal: 'Items',
      pickup_price: 'Pickup',
      free: 'free',
      total: 'Total',
      pay_note: 'Pay at the counter when you pick up',
      btn_cart: 'Cart · {count} · {total}',
      btn_checkout: 'Checkout · {total}',
      btn_next: 'Next',
      btn_confirm: 'Confirm order',
      btn_home: 'Back to home',
      checkout_title: 'Checkout',
      checkout_sub: 'Pick up your order at the coffee shop',
      f_name: 'Name',
      f_name_ph: 'How should we call you?',
      f_phone: 'Phone',
      f_phone_ph: '+380 XX XXX XX XX',
      f_time: 'Pickup time',
      f_comment: 'Comment',
      f_comment_ph: 'E.g.: no sugar, oat milk',
      asap: 'As soon as possible (~15 min)',
      today: 'Today',
      tomorrow: 'Tomorrow',
      err_name: 'Enter your name (2+ characters)',
      err_phone: 'Enter a valid phone number',
      err_time: 'Choose a time',
      confirm_title: 'Review your order',
      confirm_sub: 'All good? Confirm and we’ll start brewing',
      order: 'Order',
      contacts: 'Contacts',
      edit: 'Edit',
      name: 'Name',
      phone: 'Phone',
      time: 'Pickup',
      comment: 'Comment',
      success_title: 'Order placed!',
      success_text: 'In Telegram the order goes to the bot, and the barista receives it with status buttons. This is demo mode — nothing was sent.',
      sending: 'Sending…',
      send_failed: 'Could not send. Open the menu with the “☕ Відкрити меню” button below the message field in the bot chat.',
      added: 'Added: {name}',
      max_qty: 'Maximum {n} pcs',
      demo: 'Demo mode',
      intro_title: 'This is a Telegram Mini App',
      intro_text: 'It is designed to be opened inside Telegram via the bot. In a regular browser it runs in demo mode: you can browse the menu, fill the cart and go through checkout — no order is sent.',
      intro_btn: 'View demo',
      intro_hint: 'Language and theme can be switched at the top',
    },
  };

  // ---------- 3. Невеликі утиліти ----------
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const storage = {
    get(key, fallback) {
      try { const v = localStorage.getItem(key); return v === null ? fallback : JSON.parse(v); }
      catch { return fallback; }
    },
    set(key, value) {
      try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* приватний режим */ }
    },
  };

  // Екранування тексту від користувача перед вставкою в HTML (захист від XSS)
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));

  // ---------- 4. Мова ----------
  function detectLang() {
    let code = '';
    if (IS_TG) {
      // Мова з налаштувань Telegram користувача: з адреси від бота або з initData
      const user = tg.initDataUnsafe && tg.initDataUnsafe.user;
      code = URL_LANG || (user && user.language_code) || navigator.language || '';
    } else {
      code = storage.get('bb_lang', '') || navigator.language || '';
    }
    return code.toLowerCase().startsWith('uk') ? 'uk' : 'en';
  }

  let lang = detectLang();

  function t(key, vars = {}) {
    const str = (I18N[lang] && I18N[lang][key]) ?? I18N.en[key] ?? key;
    return typeof str === 'string'
      ? str.replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? ''))
      : str;
  }
  const L = (obj) => obj[lang] || obj.en; // поле товару потрібною мовою

  function plural(n) {
    const forms = I18N[lang].items;
    if (lang === 'uk') {
      const m10 = n % 10; const m100 = n % 100;
      if (m10 === 1 && m100 !== 11) return forms[0];
      if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return forms[1];
      return forms[2];
    }
    return n === 1 ? forms[0] : forms[1];
  }

  // 380 (центів) → "$3.80". Формат однаковий для обох мов.
  const money = (cents) => (cents / 100).toLocaleString('en-US', { style: 'currency', currency: CURRENCY });

  // ---------- 5. Тема ----------
  function applyTheme() {
    const root = document.documentElement;
    if (IS_TG) {
      const p = tg.themeParams || {};
      root.dataset.theme = tg.colorScheme === 'dark' ? 'dark' : 'light';
      // Підставляємо кольори Telegram у наші CSS-змінні
      const set = (name, ...values) => {
        const v = values.find(Boolean);
        if (v) root.style.setProperty(name, v); else root.style.removeProperty(name);
      };
      set('--bg', p.secondary_bg_color, p.bg_color);
      set('--card', p.section_bg_color, p.bg_color);
      set('--text', p.text_color);
      set('--hint', p.hint_color, p.subtitle_text_color);
      set('--link', p.link_color, p.accent_text_color);
      set('--accent', p.button_color);
      set('--accent-text', p.button_text_color);
      set('--danger', p.destructive_text_color);
      set('--separator', p.section_separator_color);
      try {
        tg.setHeaderColor('secondary_bg_color');
        tg.setBackgroundColor('secondary_bg_color');
      } catch { /* стара версія Telegram */ }
    } else {
      const saved = storage.get('bb_theme', '');
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.dataset.theme = saved || (prefersDark ? 'dark' : 'light');
      $('#demo-theme').textContent = root.dataset.theme === 'dark' ? '☀️' : '🌙';
    }
  }

  // ---------- 6. Тактильний відгук (haptic feedback) ----------
  const haptic = {
    impact(style = 'light') { try { tg && tg.HapticFeedback && tg.HapticFeedback.impactOccurred(style); } catch {} },
    select() { try { tg && tg.HapticFeedback && tg.HapticFeedback.selectionChanged(); } catch {} },
    notify(type) { try { tg && tg.HapticFeedback && tg.HapticFeedback.notificationOccurred(type); } catch {} },
  };

  // ---------- 7. Кошик ----------
  // cart = { productId: кількість }
  let cart = storage.get('bb_cart', {});
  // прибираємо товари, яких уже немає в меню
  cart = Object.fromEntries(Object.entries(cart).filter(([id, q]) => byId[id] && q > 0 && q <= MAX_QTY));

  const qtyOf = (id) => cart[id] || 0;
  const cartLines = () => Object.entries(cart).map(([id, qty]) => ({ product: byId[id], qty }));
  const cartCount = () => Object.values(cart).reduce((a, b) => a + b, 0);
  const cartTotal = () => cartLines().reduce((sum, l) => sum + l.product.price * l.qty, 0);
  const categoryCount = (catId) => cartLines().filter((l) => l.product.category === catId).reduce((a, l) => a + l.qty, 0);

  function setQty(id, qty) {
    qty = Math.max(0, Math.min(MAX_QTY, qty));
    if (qty === 0) delete cart[id]; else cart[id] = qty;
    storage.set('bb_cart', cart);
    updateClosingConfirmation();
  }

  // ---------- 8. MainButton та BackButton ----------
  // У Telegram — справжні кнопки клієнта, у браузері — їх імітація.
  let mainHandler = null;
  const demoMain = $('#demo-main');
  const demoMainBtn = $('#demo-main-btn');

  function setMain(text, handler) {
    mainHandler = handler;
    if (IS_TG) {
      tg.MainButton.setParams({ text, is_visible: true, is_active: true });
    } else {
      const changed = demoMainBtn.textContent !== text;
      demoMainBtn.textContent = text;
      demoMain.hidden = false;
      document.body.classList.add('has-main');
      if (changed) bump(demoMainBtn);
    }
  }

  function hideMain() {
    mainHandler = null;
    if (IS_TG) tg.MainButton.hide();
    else { demoMain.hidden = true; document.body.classList.remove('has-main'); }
  }

  function updateBack() {
    const canGoBack = stack.length > 1 && current().screen !== 'success';
    if (IS_TG) { canGoBack ? tg.BackButton.show() : tg.BackButton.hide(); }
    else { $('#demo-back').hidden = !canGoBack; }
  }

  function updateClosingConfirmation() {
    if (!IS_TG) return;
    try { cartCount() > 0 ? tg.enableClosingConfirmation() : tg.disableClosingConfirmation(); } catch {}
  }

  function bump(el) {
    el.classList.remove('bump');
    void el.offsetWidth; // перезапуск CSS-анімації
    el.classList.add('bump');
  }

  // ---------- 9. Тост ----------
  let toastTimer;
  function toast(text, ms = 1800) {
    const el = $('#toast');
    el.textContent = text;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), ms);
  }

  // ---------- 10. Навігація (стек екранів) ----------
  const stack = [{ screen: 'home', params: {} }];
  const current = () => stack[stack.length - 1];

  function go(screen, params = {}) { stack.push({ screen, params }); render('forward'); }
  function back() {
    if (stack.length > 1) { stack.pop(); haptic.select(); render('back'); }
  }
  function replace(screen, params = {}) { stack[stack.length - 1] = { screen, params }; render('fade'); }
  function resetHome() { stack.length = 0; stack.push({ screen: 'home', params: {} }); render('back'); }

  // ---------- 11. Шматки розмітки ----------
  function img(product, extraClass = '') {
    const cat = CATEGORIES.find((c) => c.id === product.category);
    return `<div class="img-wrap ${extraClass}">${cat ? cat.emoji : '☕'}
      <img src="${product.image}" alt="${esc(L(product.name))}" loading="lazy"
           onload="this.classList.add('loaded')" onerror="this.remove()"></div>`;
  }

  function qtyControl(id) {
    const q = qtyOf(id);
    if (q === 0) {
      return `<button class="add-btn" type="button" data-action="inc" data-id="${id}">+ ${t('add')}</button>`;
    }
    return `<div class="stepper">
      <button type="button" data-action="dec" data-id="${id}" aria-label="−">−</button>
      <span class="num">${q}</span>
      <button type="button" data-action="inc" data-id="${id}" aria-label="+">+</button>
    </div>`;
  }

  function greeting() {
    const h = new Date().getHours();
    if (h < 12) return t('greet_morning');
    if (h < 18) return t('greet_day');
    return t('greet_evening');
  }

  // ---------- 12. Екрани ----------
  const form = {
    name: (IS_TG && tg.initDataUnsafe && tg.initDataUnsafe.user && tg.initDataUnsafe.user.first_name) || '',
    phone: '',
    pickup: 'asap',
    comment: '',
  };

  const SCREENS = {
    // --- Категорії ---
    home: {
      render() {
        const popularIds = ['cappuccino', 'matcha_latte', 'croissant', 'cheesecake', 'flat_white'];
        return `
          <section class="hero" style="background-image:url('https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=900&q=70')">
            <div class="hero-brand">Bean &amp; Brew</div>
            <div class="hero-greet">${greeting()}</div>
            <h1>${t('hero_title')}</h1>
            <div class="hero-meta"><span>${t('hours')}</span><span>${t('address')}</span><span>${t('pickup_only')}</span></div>
          </section>

          <h2 class="section-title">${t('menu')}</h2>
          <div class="categories stagger">
            ${CATEGORIES.map((c) => {
              const n = PRODUCTS.filter((p) => p.category === c.id).length;
              const inCart = categoryCount(c.id);
              return `<button class="category" type="button" data-action="open-category" data-id="${c.id}"
                        style="background-image:url('${c.image}')">
                <div class="category-body">
                  <div class="category-name"><span>${c.emoji}</span>${L(c.name)}</div>
                  <div class="category-tag">${L(c.tagline)}</div>
                </div>
                ${inCart ? `<span class="category-badge">${inCart}</span>` : ''}
                <span class="category-count">${n} ${plural(n)}</span>
              </button>`;
            }).join('')}
          </div>

          <h2 class="section-title">${t('popular')}</h2>
          <div class="popular">
            ${popularIds.map((id) => byId[id]).filter(Boolean).map((p) => `
              <button class="product-mini" type="button" data-action="open-category" data-id="${p.category}">
                ${img(p)}
                <div class="product-mini-body">
                  <div class="product-mini-name">${L(p.name)}</div>
                  <div class="product-mini-price">${money(p.price)}</div>
                </div>
              </button>`).join('')}
          </div>`;
      },
      main() { cartMainButton(); },
    },

    // --- Список товарів ---
    category: {
      render({ id }) {
        const cat = CATEGORIES.find((c) => c.id === id) || CATEGORIES[0];
        const items = PRODUCTS.filter((p) => p.category === cat.id);
        return `
          <div class="chips">
            ${CATEGORIES.map((c) => `<button class="chip ${c.id === cat.id ? 'active' : ''}" type="button"
                data-action="switch-category" data-id="${c.id}">${c.emoji} ${L(c.name)}</button>`).join('')}
          </div>
          <div class="screen-head"><h1>${L(cat.name)}</h1><p>${L(cat.tagline)}</p></div>
          <div class="products stagger">
            ${items.map((p) => `
              <article class="product ${qtyOf(p.id) ? 'in-cart' : ''}" data-product="${p.id}">
                ${img(p)}
                <div class="product-body">
                  <h3 class="product-name">${L(p.name)}</h3>
                  <p class="product-desc">${L(p.description)}</p>
                  <div class="product-foot">
                    <span class="price">${money(p.price)}<small>· ${L(p.size)}</small></span>
                    <div class="qty" data-qty-for="${p.id}">${qtyControl(p.id)}</div>
                  </div>
                </div>
              </article>`).join('')}
          </div>`;
      },
      main() { cartMainButton(); },
    },

    // --- Кошик ---
    cart: {
      render() {
        const lines = cartLines();
        if (!lines.length) {
          return `<div class="empty">
            <div class="empty-icon">🛒</div>
            <h2>${t('cart_empty_title')}</h2>
            <p>${t('cart_empty_text')}</p>
            <button class="secondary-btn" type="button" data-action="home">${t('to_menu')}</button>
          </div>`;
        }
        const count = cartCount();
        return `
          <div class="screen-head row">
            <div><h1>${t('cart')}</h1><p>${count} ${plural(count)}</p></div>
            <button class="text-btn" type="button" data-action="clear-cart">${t('clear')}</button>
          </div>
          <div class="card">
            ${lines.map(({ product: p, qty }) => `
              <div class="cart-row">
                ${img(p)}
                <div class="cart-info">
                  <div class="cart-name">${L(p.name)}</div>
                  <div class="cart-sub">${money(p.price)} · ${L(p.size)}</div>
                </div>
                <div class="qty" data-qty-for="${p.id}">${qtyControl(p.id)}</div>
              </div>`).join('')}
          </div>
          <div class="card">
            <div class="sum-row"><span>${t('subtotal')}</span><span>${money(cartTotal())}</span></div>
            <div class="sum-row"><span>${t('pickup_price')}</span><span class="free">${t('free')}</span></div>
            <div class="sum-row total"><span>${t('total')}</span><span>${money(cartTotal())}</span></div>
          </div>
          <p class="note">💳 ${t('pay_note')}</p>`;
      },
      main() {
        if (cartCount()) setMain(t('btn_checkout', { total: money(cartTotal()) }), () => go('checkout'));
        else hideMain();
      },
    },

    // --- Оформлення ---
    checkout: {
      render() {
        const slots = pickupSlots();
        if (!slots.some((s) => s.value === form.pickup)) form.pickup = slots[0] ? slots[0].value : '';
        return `
          <div class="screen-head"><h1>${t('checkout_title')}</h1><p>${t('checkout_sub')}</p></div>
          <form class="form" id="checkout-form" novalidate autocomplete="on">
            <div class="field" data-field="name">
              <label for="f-name">${t('f_name')}</label>
              <input id="f-name" name="name" type="text" maxlength="50" autocomplete="given-name"
                     placeholder="${esc(t('f_name_ph'))}" value="${esc(form.name)}">
              <div class="field-error">${t('err_name')}</div>
            </div>
            <div class="field" data-field="phone">
              <label for="f-phone">${t('f_phone')}</label>
              <input id="f-phone" name="phone" type="tel" inputmode="tel" maxlength="20" autocomplete="tel"
                     placeholder="${esc(t('f_phone_ph'))}" value="${esc(form.phone)}">
              <div class="field-error">${t('err_phone')}</div>
            </div>
            <div class="field" data-field="pickup">
              <label for="f-pickup">${t('f_time')}</label>
              <select id="f-pickup" name="pickup">
                ${slots.map((s) => `<option value="${s.value}" ${s.value === form.pickup ? 'selected' : ''}>${esc(s.label)}</option>`).join('')}
              </select>
              <div class="field-error">${t('err_time')}</div>
            </div>
            <div class="field" data-field="comment">
              <label for="f-comment">${t('f_comment')}</label>
              <textarea id="f-comment" name="comment" maxlength="${COMMENT_MAX}"
                        placeholder="${esc(t('f_comment_ph'))}">${esc(form.comment)}</textarea>
              <div class="field-counter"><span id="comment-len">${form.comment.length}</span>/${COMMENT_MAX}</div>
            </div>
          </form>`;
      },
      mount() {
        const f = $('#checkout-form');
        f.addEventListener('input', (e) => {
          const { name, value } = e.target;
          if (name in form) form[name] = value;
          if (name === 'comment') $('#comment-len').textContent = value.length;
          e.target.closest('.field').classList.remove('invalid');
        });
        // Enter у полі = «Далі»; ховаємо клавіатуру
        f.addEventListener('submit', (e) => { e.preventDefault(); onCheckoutNext(); });
      },
      main() { setMain(t('btn_next'), onCheckoutNext); },
    },

    // --- Підтвердження ---
    confirm: {
      render() {
        return `
          <div class="screen-head"><h1>${t('confirm_title')}</h1><p>${t('confirm_sub')}</p></div>

          <div class="block-title"><span>${t('order')}</span>
            <button class="text-btn" type="button" data-action="edit-cart">${t('edit')}</button></div>
          <div class="card">
            ${cartLines().map(({ product: p, qty }) => `
              <div class="line"><span><b>${L(p.name)}</b> <span class="muted">× ${qty}</span></span>
              <span>${money(p.price * qty)}</span></div>`).join('')}
            <div class="sum-row total"><span>${t('total')}</span><span>${money(cartTotal())}</span></div>
          </div>

          <div class="block-title"><span>${t('contacts')}</span>
            <button class="text-btn" type="button" data-action="back">${t('edit')}</button></div>
          <div class="card">
            <div class="kv"><span>${t('name')}</span><span>${esc(form.name.trim())}</span></div>
            <div class="kv"><span>${t('phone')}</span><span>${esc(form.phone.trim())}</span></div>
            <div class="kv"><span>${t('time')}</span><span>${esc(pickupLabel(form.pickup))}</span></div>
            ${form.comment.trim() ? `<div class="kv"><span>${t('comment')}</span><span>${esc(form.comment.trim())}</span></div>` : ''}
          </div>
          <p class="note">💳 ${t('pay_note')}</p>`;
      },
      main() { setMain(t('btn_confirm'), submitOrder); },
    },

    // --- Успіх (лише в демо-режимі; у Telegram Mini App закривається) ---
    success: {
      render({ orderNo, total }) {
        return `<div class="success">
          <div class="check"><svg viewBox="0 0 24 24" width="46" height="46" aria-hidden="true">
            <path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg></div>
          <h1>${t('success_title')}</h1>
          <div class="order-no">#${orderNo} · ${money(total)}</div>
          <p>${t('success_text')}</p>
        </div>`;
      },
      main() { setMain(t('btn_home'), resetHome); },
    },
  };

  function cartMainButton() {
    const count = cartCount();
    if (count) setMain(t('btn_cart', { count, total: money(cartTotal()) }), () => go('cart'));
    else hideMain();
  }

  // ---------- 13. Час самовивозу ----------
  // Слоти кожні 15 хв: від «зараз + 20 хв» до закриття. Якщо вже зачинено — на завтра.
  function pickupSlots() {
    const now = new Date();
    const slots = [];
    const pad = (n) => String(n).padStart(2, '0');
    const fmt = (d) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;

    const start = new Date(now.getTime() + 20 * 60000);
    start.setSeconds(0, 0);
    start.setMinutes(Math.ceil(start.getMinutes() / 15) * 15);
    const open = new Date(now); open.setHours(OPEN_HOUR, 15, 0, 0);
    if (start < open) start.setTime(open.getTime());
    const close = new Date(now); close.setHours(CLOSE_HOUR, 0, 0, 0);

    const isOpenNow = now.getHours() >= OPEN_HOUR && now < new Date(close.getTime() - 15 * 60000);
    if (isOpenNow) slots.push({ value: 'asap', label: t('asap') });

    for (let d = new Date(start); d < close; d = new Date(d.getTime() + 15 * 60000)) {
      slots.push({ value: `today ${fmt(d)}`, label: `${t('today')}, ${fmt(d)}` });
    }
    if (!slots.length) {
      const first = new Date(now); first.setDate(first.getDate() + 1); first.setHours(OPEN_HOUR, 0, 0, 0);
      const end = new Date(first); end.setHours(12, 0, 0, 0);
      for (let d = first; d <= end; d = new Date(d.getTime() + 15 * 60000)) {
        slots.push({ value: `tomorrow ${fmt(d)}`, label: `${t('tomorrow')}, ${fmt(d)}` });
      }
    }
    return slots;
  }

  function pickupLabel(value) {
    if (value === 'asap') return t('asap');
    const [day, time] = value.split(' ');
    return `${day === 'tomorrow' ? t('tomorrow') : t('today')}, ${time}`;
  }

  // ---------- 14. Валідація та відправка ----------
  function validate() {
    const errors = [];
    if (form.name.trim().length < 2) errors.push('name');
    const phone = form.phone.trim();
    const digits = phone.replace(/\D/g, '');
    if (!/^\+?[\d\s()-]+$/.test(phone) || digits.length < 10 || digits.length > 15) errors.push('phone');
    if (!form.pickup) errors.push('pickup');
    return errors;
  }

  function onCheckoutNext() {
    const errors = validate();
    $$('.field').forEach((f) => f.classList.toggle('invalid', errors.includes(f.dataset.field)));
    if (errors.length) {
      haptic.notify('error');
      const first = $(`.field[data-field="${errors[0]}"]`);
      first.scrollIntoView({ behavior: 'smooth', block: 'center' });
      $('input, select', first).focus({ preventScroll: true });
      return;
    }
    if (document.activeElement) document.activeElement.blur(); // ховаємо клавіатуру
    haptic.impact('medium');
    go('confirm');
  }

  function buildPayload() {
    // Ціну НЕ передаємо як джерело правди: бот перерахує суму сам за своїм прайсом.
    return {
      v: 1,
      items: cartLines().map(({ product, qty }) => ({ id: product.id, qty })),
      name: form.name.trim().slice(0, 50),
      phone: form.phone.trim().slice(0, 20),
      pickup: form.pickup,
      comment: form.comment.trim().slice(0, COMMENT_MAX),
      lang,
      client_total: cartTotal(), // лише для звірки, бот на неї не покладається
    };
  }

  function submitOrder() {
    if (!cartCount()) return;
    const payload = buildPayload();
    const json = JSON.stringify(payload);

    if (IS_TG) {
      haptic.notify('success');
      try {
        tg.MainButton.showProgress();
        tg.disableClosingConfirmation();
        // Надсилаємо дані боту. Telegram сам закриває Mini App після sendData.
        tg.sendData(json);
        setTimeout(() => {
          // Якщо застосунок досі відкритий — його відкрили не через reply-кнопку,
          // і sendData не спрацював. Повідомляємо користувача.
          tg.MainButton.hideProgress();
          updateClosingConfirmation();
          toast(t('send_failed'), 5000);
        }, 2500);
      } catch (err) {
        tg.MainButton.hideProgress();
        toast(t('send_failed'), 5000);
      }
      return;
    }

    // Демо-режим: показуємо, що саме полетіло б боту
    console.log('[demo] sendData payload:', payload);
    haptic.notify('success');
    const total = cartTotal();
    cart = {};
    storage.set('bb_cart', cart);
    stack.length = 0;
    stack.push({ screen: 'success', params: { orderNo: 1000 + Math.floor(Math.random() * 9000), total } });
    render('forward');
  }

  // ---------- 15. Рендер ----------
  const app = $('#app');

  function render(direction = 'fade') {
    const { screen, params } = current();
    const def = SCREENS[screen];
    const cls = direction === 'none' ? '' : `enter-${direction}`;
    app.innerHTML = `<div class="screen ${cls}">${def.render(params || {})}</div>`;
    if (def.mount) def.mount(params || {});
    def.main();
    updateBack();
    if (direction !== 'none') window.scrollTo({ top: 0 });
  }

  // Оновлюємо лише змінені шматки, щоб не перезапускати анімацію всього екрану
  function refreshQty(id) {
    $$(`[data-qty-for="${id}"]`).forEach((el) => {
      el.innerHTML = qtyControl(id);
      const num = $('.num', el);
      if (num) bump(num);
    });
    $$(`[data-product="${id}"]`).forEach((el) => el.classList.toggle('in-cart', qtyOf(id) > 0));
    const { screen } = current();
    if (screen === 'cart') render('none');
    else SCREENS[screen].main();
  }

  // ---------- 16. Обробка кліків (делегування) ----------
  app.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const { action, id } = btn.dataset;

    switch (action) {
      case 'open-category':
        haptic.select();
        go('category', { id });
        break;
      case 'switch-category':
        if (id !== current().params.id) { haptic.select(); replace('category', { id }); }
        break;
      case 'inc': {
        if (qtyOf(id) >= MAX_QTY) { haptic.notify('warning'); toast(t('max_qty', { n: MAX_QTY })); break; }
        const wasZero = qtyOf(id) === 0;
        setQty(id, qtyOf(id) + 1);
        haptic.impact('light'); // haptic при додаванні в кошик
        if (wasZero) toast(t('added', { name: L(byId[id].name) }), 1200);
        refreshQty(id);
        break;
      }
      case 'dec':
        setQty(id, qtyOf(id) - 1);
        haptic.select();
        refreshQty(id);
        break;
      case 'clear-cart':
        haptic.notify('warning');
        cart = {};
        storage.set('bb_cart', cart);
        updateClosingConfirmation();
        render('fade');
        break;
      case 'home':
        resetHome();
        break;
      case 'edit-cart':
        // з підтвердження повертаємося до кошика
        while (stack.length > 1 && current().screen !== 'cart') stack.pop();
        render('back');
        break;
      case 'back':
        back();
        break;
      default:
        break;
    }
  });

  // ---------- 17. Демо-режим (браузер) ----------
  function setupDemo() {
    document.body.classList.add('is-demo');
    $('#demo-bar').hidden = false;

    const paintDemoTexts = () => {
      document.documentElement.lang = lang;
      $('#demo-label').textContent = t('demo');
      $('#demo-lang').textContent = lang === 'uk' ? 'EN' : 'UA';
      $('#intro-title').textContent = t('intro_title');
      $('#intro-text').textContent = t('intro_text');
      $('#intro-btn').textContent = t('intro_btn');
      $('#intro-hint').textContent = t('intro_hint');
    };
    paintDemoTexts();

    $('#demo-back').addEventListener('click', back);
    demoMainBtn.addEventListener('click', () => mainHandler && mainHandler());

    $('#demo-lang').addEventListener('click', () => {
      lang = lang === 'uk' ? 'en' : 'uk';
      storage.set('bb_lang', lang);
      paintDemoTexts();
      render('none');
    });

    $('#demo-theme').addEventListener('click', () => {
      const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
      storage.set('bb_theme', next);
      applyTheme();
    });

    // Заглушка показується один раз за сесію
    let seen = false;
    try { seen = sessionStorage.getItem('bb_intro') === '1'; } catch {}
    if (!seen) {
      $('#intro').hidden = false;
      $('#intro-btn').addEventListener('click', () => {
        $('#intro').hidden = true;
        try { sessionStorage.setItem('bb_intro', '1'); } catch {}
      });
    }
  }

  // ---------- 18. Старт ----------
  function init() {
    applyTheme();

    if (IS_TG) {
      tg.ready();   // повідомляємо Telegram, що застосунок готовий
      tg.expand();  // розгортаємо на всю висоту
      try { if (tg.isVersionAtLeast('7.7')) tg.disableVerticalSwipes(); } catch {}
      tg.onEvent('themeChanged', applyTheme);
      tg.MainButton.onClick(() => mainHandler && mainHandler());
      tg.BackButton.onClick(back);
      document.documentElement.lang = lang;
      updateClosingConfirmation();
    } else {
      setupDemo();
      // у браузері тема стежить за системною, якщо користувач не обрав власну
      if (window.matchMedia) {
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
          if (!storage.get('bb_theme', '')) applyTheme();
        });
      }
    }

    render('fade');
  }

  init();
})();
