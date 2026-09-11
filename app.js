/* ASAR BOOTS — логика магазина (без зависимостей) */
(function () {
  const D = window.ASAR;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const fmt = n => Math.round(n).toLocaleString('ru-RU').replace(/ /g, ' ');
  const tg = n => fmt(n) + ' ₸';
  const colorById = id => D.colors.find(c => c.id === id);
  const seasonName = s => s === 'winter' ? 'Зима с мехом' : 'Осень';
  const stockOf = (season, color, size) => D.stock[season][color][D.sizes.indexOf(+size)] || 0;
  const stockColor = (season, color) => D.stock[season][color].reduce((a, b) => a + b, 0);
  const pairs = n => n === 1 ? '1 пара' : (n >= 2 && n <= 4 ? n + ' пары' : n + ' пар');

  /* ---------- Meta Pixel (включается, если указан ID) ---------- */
  if (D.metaPixelId) {
    !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
    fbq('init', D.metaPixelId); fbq('track', 'PageView');
  }
  const track = (ev, data) => { try { window.fbq && fbq('track', ev, data || {}); } catch (e) {} };

  /* ---------- Контакты ---------- */
  const waLink = text => `https://wa.me/${D.whatsapp}?text=${encodeURIComponent(text)}`;
  const WA_DEFAULT = 'Здравствуйте! Хочу заказать ботинки Asar boots. Подскажите по размеру и наличию.';
  ['waHero', 'waFab'].forEach(id => $('#' + id).href = waLink(WA_DEFAULT));
  $('#waSize').href = waLink('Здравствуйте! Помогите подобрать размер ботинок Asar boots. Длина стопы: __ см.');
  $('#phoneFoot').textContent = D.phone; $('#phoneFoot').href = 'tel:' + D.phone.replace(/[^\d+]/g, '');
  $('#igFoot').href = 'https://instagram.com/' + D.instagram;
  $('#year').textContent = new Date().getFullYear();
  $('#dlPrice').textContent = fmt(D.delivery);
  $('#pickupCity').textContent = D.freePickupCity + 'е';
  $$('[data-dl]').forEach(el => el.textContent = fmt(D.delivery));
  $$('[data-now]').forEach(el => el.textContent = fmt(D.price[el.dataset.now].now));
  $$('[data-old]').forEach(el => el.textContent = tg(D.price[el.dataset.old].old));
  $$('[data-disc]').forEach(el => { const p = D.price[el.dataset.disc]; el.textContent = '−' + Math.round((1 - p.now / p.old) * 100) + '%'; });

  const total = ['autumn', 'winter'].reduce((a, s) => a + D.colors.reduce((b, c) => b + stockColor(s, c.id), 0), 0);
  $('#stockTotal').textContent = fmt(total);

  /* ---------- Таймер до конца дня ---------- */
  (function timer() {
    const tick = () => {
      const n = new Date(), end = new Date(n); end.setHours(23, 59, 59, 999);
      let s = Math.max(0, Math.floor((end - n) / 1000));
      const h = Math.floor(s / 3600); s -= h * 3600; const m = Math.floor(s / 60); s -= m * 60;
      $('#tH').textContent = String(h).padStart(2, '0'); $('#tM').textContent = String(m).padStart(2, '0'); $('#tS').textContent = String(s).padStart(2, '0');
    };
    tick(); setInterval(tick, 1000);
  })();

  /* ---------- Состояние ---------- */
  const state = { aud: 'all', season: 'autumn', sel: {} /* color -> size */ };
  let heroVisible = true;
  const visibleSizes = () => state.aud === 'women' ? D.womenSizes : state.aud === 'men' ? D.menSizes : D.sizes;

  /* ---------- Каталог ---------- */
  function chipsHtml(season, color, selected, forSheet) {
    const vis = forSheet ? D.sizes : visibleSizes();
    return vis.map(sz => {
      const left = stockOf(season, color, sz);
      const cls = ['chip', left === 0 ? 'out' : '', left > 0 && left <= 5 ? 'low' : ''].join(' ');
      return `<button type="button" class="${cls}" data-size="${sz}" data-left="${left}" aria-pressed="${selected === sz}">${sz}</button>`;
    }).join('');
  }
  function stockText(season, color, size) {
    if (!size) return { t: 'Выберите размер', hot: false };
    const left = stockOf(season, color, size);
    if (left === 0) return { t: `Размер ${size} закончился. Есть в другом сезоне или цвете.`, hot: true };
    if (left <= 3) return { t: `Размер ${size}: ${pairs(left)} — последние!`, hot: true };
    if (left <= 8) return { t: `Размер ${size}: осталось ${pairs(left)}. Уходит быстро.`, hot: true };
    return { t: `Размер ${size}: в наличии, отправим сегодня.`, hot: false };
  }

  function renderGrid() {
    const s = state.season, p = D.price[s];
    $('#grid').innerHTML = D.colors.map(c => {
      const tot = stockColor(s, c.id);
      const sel = state.sel[c.id];
      const st = stockText(s, c.id, sel);
      const low = tot > 0 && tot < 40 ? `<span class="card-low">Осталось ${pairs(tot)}</span>` : '';
      const tag = c.tag ? `<span class="card-tag">${c.tag}</span>` : '';
      return `<article class="card" data-color="${c.id}">
        <div class="card-img" data-open><img src="img/${c.id}-main.webp" width="800" height="730" loading="lazy" alt="Ботинки ${c.name.toLowerCase()} Asar boots">${tag}${low}</div>
        <div class="card-body">
          <div class="card-head">
            <div><div class="card-name"><i class="sw" style="background:${c.hex}"></i>${c.name}</div><div class="card-sub">${seasonName(s)} · нубук · ${tot > 0 ? 'в наличии' : 'нет в наличии'}</div></div>
            <div class="card-price"><s>${tg(p.old)}</s><div class="now">${tg(p.now)}</div></div>
          </div>
          <div class="size-chips">${chipsHtml(s, c.id, sel)}</div>
          <p class="card-stock ${st.hot ? 'hot' : ''}">${st.t}</p>
          <div class="card-actions">
            <button type="button" class="btn btn-outline" data-add>В корзину</button>
            <button type="button" class="btn btn-gold" data-buy>Купить</button>
          </div>
        </div>
      </article>`;
    }).join('');
    $('#winterNote').hidden = s !== 'winter';
  }
  renderGrid();

  $('#grid').addEventListener('click', e => {
    const card = e.target.closest('.card'); if (!card) return;
    const color = card.dataset.color;
    const chip = e.target.closest('.chip');
    if (chip) {
      state.sel[color] = +chip.dataset.size;
      $$('.chip', card).forEach(c => c.setAttribute('aria-pressed', c === chip));
      const st = stockText(state.season, color, state.sel[color]);
      const el = $('.card-stock', card); el.textContent = st.t; el.classList.toggle('hot', st.hot);
      return;
    }
    if (e.target.closest('[data-open]')) { openProduct(color); return; }
    if (e.target.closest('[data-add]') || e.target.closest('[data-buy]')) {
      const buy = !!e.target.closest('[data-buy]');
      if (!state.sel[color]) { openProduct(color, buy); toast('Выберите размер'); return; }
      addToCart(color, state.season, state.sel[color]);
      if (buy) openCart(); else toast('Добавлено в корзину');
    }
  });

  $$('[data-aud]').forEach(b => b.addEventListener('click', () => {
    state.aud = b.dataset.aud; $$('[data-aud]').forEach(x => x.setAttribute('aria-pressed', x === b)); renderGrid();
  }));
  $$('.catalog [data-season]').forEach(b => b.addEventListener('click', () => {
    state.season = b.dataset.season; $$('.catalog [data-season]').forEach(x => x.setAttribute('aria-pressed', x === b)); renderGrid();
  }));

  /* ---------- Таблица размеров ---------- */
  $('#sizeTable').innerHTML = `<thead><tr><th>Размер</th>${D.sizes.map(s => `<th>${s}</th>`).join('')}</tr></thead>
    <tbody><tr><td>Стелька, см</td>${D.sizes.map(s => `<td>${String(D.insole[s]).replace('.', ',')}</td>`).join('')}</tr>
    <tr><td>Для кого</td>${D.sizes.map(s => `<td>${D.womenSizes.includes(s) ? 'Ж' : 'М'}</td>`).join('')}</tr></tbody>`;

  /* ---------- Шторки ---------- */
  let openSheet = null;
  function show(id) {
    const el = $('#' + id); el.hidden = false; openSheet = id;
    document.body.style.overflow = 'hidden'; $('#stickyCta').classList.add('hide');
    if (!history.state || history.state.sheet !== id) history.pushState({ sheet: id }, '');
  }
  function hide() {
    if (!openSheet) return;
    $('#' + openSheet).hidden = true; openSheet = null;
    document.body.style.overflow = ''; updateSticky();
  }
  window.addEventListener('popstate', () => { if (openSheet) hide(); });
  $$('[data-close]').forEach(el => el.addEventListener('click', e => {
    if (el.tagName === 'A' && el.getAttribute('href')?.startsWith('#')) { hide(); return; }
    e.preventDefault(); if (openSheet) history.back();
  }));

  /* ---------- Товар ---------- */
  const P = { color: null, season: 'autumn', size: null };
  function openProduct(color, buyIntent) {
    P.color = color; P.season = state.season; P.size = state.sel[color] || null;
    const c = colorById(color);
    $('#pTitle').textContent = 'Ботинки ' + c.name.toLowerCase();
    $('#pTrack').innerHTML = ['main', 'side', 'back'].map(v => `<div><img src="img/${color}-${v}.webp" alt="Ботинки ${c.name.toLowerCase()}, вид ${v === 'main' ? 'спереди' : v === 'side' ? 'сбоку' : 'сзади'}" loading="eager"></div>`).join('');
    $('#pDots').innerHTML = '<i class="on"></i><i></i><i></i>';
    $('#pTrack').scrollLeft = 0;
    renderProduct();
    show('productSheet');
    track('ViewContent', { content_name: 'Asar boots ' + c.name, content_type: 'product', value: D.price[P.season].now, currency: 'KZT' });
  }
  function renderProduct() {
    const p = D.price[P.season];
    $('#pOld').textContent = tg(p.old); $('#pNow').textContent = fmt(p.now);
    $('#pSub').textContent = `${seasonName(P.season)} · нубук${P.season === 'winter' ? ' · натуральный мех' : ' · текстильная подкладка'} · размеры 36–45`;
    $$('#pSeason [data-season]').forEach(b => b.setAttribute('aria-pressed', b.dataset.season === P.season));
    $('#pSizes').innerHTML = chipsHtml(P.season, P.color, P.size, true);
    const st = stockText(P.season, P.color, P.size);
    const el = $('#pStock'); el.textContent = st.t; el.classList.toggle('hot', st.hot);
  }
  $('#pTrack').addEventListener('scroll', () => {
    const t = $('#pTrack'); const i = Math.round(t.scrollLeft / t.clientWidth);
    $$('#pDots i').forEach((d, k) => d.classList.toggle('on', k === i));
  }, { passive: true });
  $$('#pSeason [data-season]').forEach(b => b.addEventListener('click', () => { P.season = b.dataset.season; renderProduct(); }));
  $('#pSizes').addEventListener('click', e => {
    const chip = e.target.closest('.chip'); if (!chip) return;
    P.size = +chip.dataset.size; state.sel[P.color] = P.size; renderProduct();
  });
  function productAdd(buy) {
    if (!P.size) { toast('Выберите размер'); $('#pSizes').scrollIntoView({ block: 'center', behavior: 'smooth' }); return; }
    addToCart(P.color, P.season, P.size);
    if (buy) { $('#productSheet').hidden = true; openSheet = null; openCart(); }
    else { history.back(); toast('Добавлено в корзину'); }
  }
  $('#pAddCart').addEventListener('click', () => productAdd(false));
  $('#pBuyNow').addEventListener('click', () => productAdd(true));

  /* ---------- Корзина ---------- */
  let cart = [];
  try { cart = JSON.parse(localStorage.getItem('asar-cart') || '[]'); } catch (e) {}
  const save = () => { try { localStorage.setItem('asar-cart', JSON.stringify(cart)); } catch (e) {} };
  function addToCart(color, season, size) {
    const it = cart.find(i => i.color === color && i.season === season && i.size === size);
    if (it) it.qty++; else cart.push({ color, season, size, qty: 1 });
    save(); renderCart();
    track('AddToCart', { content_name: 'Asar boots ' + colorById(color).name + ' ' + size, value: D.price[season].now, currency: 'KZT' });
  }
  const cartCount = () => cart.reduce((a, i) => a + i.qty, 0);
  const cartSum = () => cart.reduce((a, i) => a + i.qty * D.price[i.season].now, 0);
  const deliveryCost = () => ($('#orderForm [name=pickup]').checked || cart.length === 0) ? 0 : D.delivery;
  function renderCart() {
    const n = cartCount();
    $('#cartCount').hidden = n === 0; $('#cartCount').textContent = n;
    $('#cartEmpty').hidden = n > 0; $('#cartSummary').hidden = n === 0; $('#orderForm').hidden = n === 0;
    $('#cartItems').innerHTML = cart.map((i, k) => {
      const c = colorById(i.color);
      return `<div class="ci">
        <img src="img/${i.color}-side.webp" alt="">
        <div><div class="ci-name">Ботинки ${c.name.toLowerCase()}, ${i.size}</div><div class="ci-sub">${seasonName(i.season)}</div><div class="ci-price">${tg(D.price[i.season].now)}</div><button type="button" class="ci-del" data-del="${k}">Убрать</button></div>
        <div class="qty"><button type="button" data-q="${k}" data-d="-1">−</button><span>${i.qty}</span><button type="button" data-q="${k}" data-d="1">+</button></div>
      </div>`;
    }).join('');
    const sum = cartSum(), dl = deliveryCost();
    $('#sumItems').textContent = tg(sum); $('#sumDl').textContent = dl ? tg(dl) : 'бесплатно';
    $('#sumTotal').textContent = tg(sum + dl); $('#btnTotal').textContent = tg(sum + dl);
    updateSticky();
  }
  $('#cartItems').addEventListener('click', e => {
    const q = e.target.closest('[data-q]'), d = e.target.closest('[data-del]');
    if (q) { const it = cart[+q.dataset.q]; it.qty += +q.dataset.d; if (it.qty <= 0) cart.splice(+q.dataset.q, 1); }
    else if (d) cart.splice(+d.dataset.del, 1);
    else return;
    save(); renderCart();
  });
  $('#orderForm [name=pickup]').addEventListener('change', renderCart);
  function openCart() {
    $('#orderSuccess').hidden = true; $('#orderForm').hidden = cart.length === 0; $('#cartSummary').hidden = cart.length === 0;
    renderCart(); show('cartSheet');
    if (cart.length) track('InitiateCheckout', { value: cartSum(), currency: 'KZT', num_items: cartCount() });
  }
  $('#cartTop').addEventListener('click', openCart);
  renderCart();

  /* ---------- Телефон ---------- */
  const digits = v => v.replace(/\D/g, '');
  function maskPhone(input) {
    input.addEventListener('input', () => {
      let d = digits(input.value);
      if (d.startsWith('8')) d = '7' + d.slice(1);
      if (d && !d.startsWith('7')) d = '7' + d;
      d = d.slice(0, 11);
      let out = '+7';
      if (d.length > 1) out += ' ' + d.slice(1, 4);
      if (d.length > 4) out += ' ' + d.slice(4, 7);
      if (d.length > 7) out += ' ' + d.slice(7, 9);
      if (d.length > 9) out += ' ' + d.slice(9, 11);
      input.value = d.length ? out : '';
    });
  }
  $$('input[type=tel]').forEach(maskPhone);
  const validPhone = v => digits(v).length === 11;

  /* ---------- Отправка ---------- */
  async function send(payload) {
    try {
      const r = await fetch('/api/order', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      return r.ok;
    } catch (e) { return false; }
  }
  const orderNo = () => 'A' + String(Date.now()).slice(-6);

  $('#orderForm').addEventListener('submit', async e => {
    e.preventDefault();
    const f = e.target, err = $('#formErr'); err.hidden = true;
    const name = f.name.value.trim(), phone = f.phone.value, city = f.city.value.trim();
    $$('input', f).forEach(i => i.classList.remove('bad'));
    if (!name) { f.name.classList.add('bad'); f.name.focus(); return; }
    if (!validPhone(phone)) { f.phone.classList.add('bad'); f.phone.focus(); err.textContent = 'Проверьте номер телефона'; err.hidden = false; return; }
    if (!f.pickup.checked && !city) { f.city.classList.add('bad'); f.city.focus(); return; }
    const btn = $('#orderSubmit'); btn.disabled = true; $('#btnLabel').textContent = 'Отправляем…';
    const no = orderNo(), sum = cartSum(), dl = deliveryCost();
    const items = cart.map(i => ({ title: `Ботинки ${colorById(i.color).name.toLowerCase()} (${seasonName(i.season).toLowerCase()})`, size: i.size, qty: i.qty, price: D.price[i.season].now }));
    const payload = { type: 'order', orderNo: no, name, phone, city: f.pickup.checked ? 'Самовывоз, ' + D.freePickupCity : city, pickup: f.pickup.checked, contact: f.contact.value, pay: f.pay.value, items, sum, delivery: dl, total: sum + dl, url: location.href };
    await send(payload);
    const lines = items.map(i => `• ${i.title}, размер ${i.size} × ${i.qty} — ${tg(i.price * i.qty)}`).join('\n');
    const text = `Заказ ${no}\n${lines}\nДоставка: ${dl ? tg(dl) : 'самовывоз'}\nИтого: ${tg(sum + dl)}\n\nИмя: ${name}\nТелефон: ${phone}\nГород: ${payload.city}\nОплата: ${f.pay.value === 'kaspi' ? 'Kaspi перевод' : 'Kaspi Red / рассрочка'}`;
    $('#waOrder').href = waLink(text);
    $('#orderNo').textContent = no;
    track('Purchase', { value: sum + dl, currency: 'KZT', num_items: cartCount() });
    cart = []; save(); renderCart();
    $('#cartSummary').hidden = true; $('#orderForm').hidden = true; $('#cartEmpty').hidden = true;
    $('#orderSuccess').hidden = false; $('#cartSheet .sheet-body').scrollTop = 0;
    btn.disabled = false; $('#btnLabel').textContent = 'Оформить заказ';
  });

  /* ---------- Обратный звонок ---------- */
  const openCall = e => { e && e.preventDefault(); $('#callSuccess').hidden = true; $('#callForm').hidden = false; show('callSheet'); setTimeout(() => $('#callForm [name=phone]').focus(), 300); };
  $('#callTop').addEventListener('click', openCall);
  $('#callFinal').addEventListener('click', openCall);
  $('#callForm').addEventListener('submit', async e => {
    e.preventDefault();
    const f = e.target, err = $('#callErr'); err.hidden = true;
    if (!validPhone(f.phone.value)) { f.phone.classList.add('bad'); err.textContent = 'Проверьте номер телефона'; err.hidden = false; return; }
    const b = $('button[type=submit]', f); b.disabled = true; b.textContent = 'Отправляем…';
    await send({ type: 'callback', phone: f.phone.value, name: f.name.value.trim(), url: location.href });
    track('Lead', { content_name: 'callback' });
    f.hidden = true; $('#callSuccess').hidden = false; b.disabled = false; b.textContent = 'Жду звонка'; f.reset();
  });

  /* ---------- Липкая кнопка ---------- */

  function updateSticky() {
    const s = $('#stickyCta'), b = $('#stickyBtn');
    if (cart.length) { b.textContent = 'Оформить заказ · ' + tg(cartSum() + deliveryCost()); b.href = '#'; b.onclick = e => { e.preventDefault(); openCart(); }; }
    else { b.textContent = 'Выбрать цвет и размер'; b.href = '#catalog'; b.onclick = null; }
    s.classList.toggle('hide', (heroVisible && !cart.length) || !!openSheet);
  }
  new IntersectionObserver(([en]) => { heroVisible = en.isIntersecting; updateSticky(); }, { threshold: 0.15 }).observe($('.hero-cta'));

  /* ---------- Тост ---------- */
  let tt;
  function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(tt); tt = setTimeout(() => t.classList.remove('on'), 1800); }
})();
