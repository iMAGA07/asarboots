/* ASAR BOOTS — логика страницы товара, корзины и заявок */
(function () {
  const D = window.ASAR;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const fmt = n => Math.round(n).toLocaleString('ru-RU').replace(/ /g, ' ');
  const tg = n => fmt(n) + ' ₸';
  const colorById = id => D.colors.find(c => c.id === id);
  const seasonName = s => s === 'winter' ? 'Зима с мехом' : 'Осень';
  const stockOf = (season, color, size) => D.stock[season][color][D.sizes.indexOf(+size)] || 0;
  const pairs = n => n === 1 ? '1 пара' : (n >= 2 && n <= 4 ? n + ' пары' : n + ' пар');

  /* Meta Pixel — только если задан ID */
  if (D.metaPixelId) {
    !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
    fbq('init', D.metaPixelId); fbq('track', 'PageView');
  }
  const track = (ev, data) => { try { window.fbq && fbq('track', ev, data || {}); } catch (e) {} };

  /* Контакты */
  const waLink = text => `https://wa.me/${D.whatsapp}?text=${encodeURIComponent(text)}`;
  const WA_DEFAULT = 'Здравствуйте! Хочу заказать ботинки Asar boots. Подскажите по размеру и наличию.';
  $('#waFab').href = $('#waFoot').href = waLink(WA_DEFAULT);
  $('#waSize').href = waLink('Здравствуйте! Помогите подобрать размер ботинок Asar boots. Длина стопы: __ см.');
  $('#phoneFoot').textContent = D.phone; $('#phoneFoot').href = 'tel:' + D.phone.replace(/[^\d+]/g, '');
  $('#igFoot').href = 'https://instagram.com/' + D.instagram;
  $('#year').textContent = new Date().getFullYear();
  $('#dlPrice').textContent = fmt(D.delivery);
  $('#pickupCity').textContent = D.freePickupCity + 'е';
  $('#segA').textContent = tg(D.price.autumn.now); $('#segW').textContent = tg(D.price.winter.now);

  /* Таймер «скидка закреплена» — минуты, переживает перезагрузку в рамках сессии */
  (function reserve() {
    const KEY = 'asar-reserve-until';
    let until = 0;
    try { until = +sessionStorage.getItem(KEY) || 0; } catch (e) {}
    const reset = () => { until = Date.now() + D.reserveMinutes * 60000; try { sessionStorage.setItem(KEY, until); } catch (e) {} };
    if (!until || until < Date.now()) reset();
    const tick = () => {
      let s = Math.max(0, Math.floor((until - Date.now()) / 1000));
      if (s === 0) { reset(); s = D.reserveMinutes * 60; }
      $('#tMM').textContent = String(Math.floor(s / 60)).padStart(2, '0');
      $('#tSS').textContent = String(s % 60).padStart(2, '0');
    };
    tick(); setInterval(tick, 1000);
  })();

  /* Состояние товара */
  const S = { color: D.colors[0].id, season: 'autumn', size: null };

  function renderGallery() {
    const c = colorById(S.color);
    const views = [['main', 'спереди'], ['side', 'сбоку'], ['back', 'сзади']];
    $('#gTrack').innerHTML = views.map(([v, t], i) => `<div><img src="img/${S.color}-${v}.webp" alt="Ботинки ${c.name.toLowerCase()} Asar boots, вид ${t}" ${i ? 'loading="lazy"' : 'fetchpriority="high"'}></div>`).join('');
    $('#gDots').innerHTML = views.map((_, i) => `<i class="${i === 0 ? 'on' : ''}"></i>`).join('');
    $('#gThumbs').innerHTML = views.map(([v, t], i) => `<button type="button" data-i="${i}" aria-pressed="${i === 0}" aria-label="Вид ${t}"><img src="img/${S.color}-${v}.webp" alt="" loading="lazy"></button>`).join('');
    $('#gTrack').scrollLeft = 0;
  }
  $('#gTrack').addEventListener('scroll', () => {
    const t = $('#gTrack'); const i = Math.round(t.scrollLeft / t.clientWidth);
    $$('#gDots i').forEach((d, k) => d.classList.toggle('on', k === i));
    $$('#gThumbs button').forEach((b, k) => b.setAttribute('aria-pressed', k === i));
  }, { passive: true });
  $('#gThumbs').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    const t = $('#gTrack'); t.scrollTo({ left: t.clientWidth * +b.dataset.i, behavior: 'smooth' });
  });
  $('#colorsList').innerHTML = D.colors.map(c => `<li><i style="background:${c.hex}"></i>${c.name}</li>`).join('');
  $('#phoneTop').textContent = D.phone; $('#phoneTop').href = 'tel:' + D.phone.replace(/[^\d+]/g, '');
  (function () { const n = ['autumn', 'winter'].reduce((a, s) => a + D.colors.reduce((b, c) => b + D.stock[s][c.id].reduce((x, y) => x + y, 0), 0), 0); $('#statStock').textContent = fmt(Math.floor(n / 100) * 100) + '+'; })();

  function renderSwatches() {
    $('#swatches').innerHTML = D.colors.map(c => `<button type="button" class="sw" data-color="${c.id}" aria-pressed="${c.id === S.color}" aria-label="${c.name}"><img src="img/${c.id}-side.webp" alt=""><span>${c.name}</span></button>`).join('');
    $('#colorName').textContent = colorById(S.color).name;
  }
  $('#swatches').addEventListener('click', e => {
    const b = e.target.closest('.sw'); if (!b || b.dataset.color === S.color) return;
    S.color = b.dataset.color; renderGallery(); renderSwatches(); renderSizes();
    track('ViewContent', { content_name: 'Asar boots ' + colorById(S.color).name, content_type: 'product', value: D.price[S.season].now, currency: 'KZT' });
  });

  function renderPrice() {
    const p = D.price[S.season];
    const disc = '−' + Math.round((1 - p.now / p.old) * 100) + '%';
    $('#priceNow').textContent = tg(p.now); $('#priceOld').textContent = tg(p.old);
    $('#priceSave').textContent = 'Экономия ' + tg(p.old - p.now); $('#gBadge').textContent = disc;
    $('#buyPrice').textContent = tg(p.now); $('#stickyNow').textContent = tg(p.now); $('#stickyOld').textContent = tg(p.old);
    $('#seasonHint').textContent = S.season === 'winter' ? 'Натуральный мех внутри, на морозы до −25°. Зимних мало, в основном 36–39.' : 'Текстильная подкладка, на сезон от +10° до −5°.';
  }
  $$('#season .seg-btn').forEach(b => b.addEventListener('click', () => {
    S.season = b.dataset.season; $$('#season .seg-btn').forEach(x => x.setAttribute('aria-pressed', x === b));
    renderPrice(); renderSizes();
  }));

  function chip(sz) {
    const left = stockOf(S.season, S.color, sz);
    const cls = ['chip', left === 0 ? 'out' : '', left > 0 && left <= 5 ? 'low' : ''].join(' ').trim();
    return `<button type="button" class="${cls}" data-size="${sz}" data-left="${left}" aria-pressed="${S.size === sz}">${sz}</button>`;
  }
  function renderSizes() {
    if (S.size && stockOf(S.season, S.color, S.size) === 0) S.size = null;
    $('#chipsW').innerHTML = D.womenSizes.map(chip).join('');
    $('#chipsM').innerHTML = D.menSizes.map(chip).join('');
    const el = $('#stockLine'); let t = 'Выберите размер', hot = false;
    if (S.size) {
      const left = stockOf(S.season, S.color, S.size);
      if (left <= 3) { t = `Размер ${S.size}: ${pairs(left)}, последние`; hot = true; }
      else if (left <= ((D.promo && D.promo.lowStockThreshold) || 8)) { t = `Размер ${S.size}: осталось ${pairs(left)}`; hot = true; }
      else t = `Размер ${S.size} в наличии. Отправим в день оплаты.`;
    }
    el.textContent = t; el.classList.toggle('hot', hot);
  }
  $('.size-groups').addEventListener('click', e => {
    const c = e.target.closest('.chip'); if (!c) return;
    S.size = +c.dataset.size; renderSizes(); updateSticky();
  });

  /* ---------- Триггеры продаж (настройки в data.js → promo) ---------- */
  (function triggers() {
    const P = D.promo || {};
    const MONTHS = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
    // дата окончания цен в верхней строке
    if (P.saleEnds) {
      const d = new Date(P.saleEnds + 'T23:59:59');
      if (d > new Date()) $('#announce').innerHTML = `<b>−37%</b> на все цвета до ${d.getDate()} ${MONTHS[d.getMonth()]}<span class="sep"></span>Доставка по Казахстану<span class="sep"></span>Обмен ${P.moneyBackDays || 14} дней`;
    }
    // соцдоказательство
    if (P.soldPairs > 0) { $('#proofLine').hidden = false; $('#proofLine span').textContent = `Уже отправили ${fmt(P.soldPairs)}+ пар по Казахстану`; }
    // возврат денег
    if (P.moneyBackDays) $('#moneyBackNote').textContent = `${P.moneyBackDays} дней на обмен размера или возврат денег`;
    // отправка сегодня / завтра
    if (P.shippingCutoffHour) {
      const upd = () => {
        const h = new Date().getHours(), left = P.shippingCutoffHour - h;
        const s = $('#shipLine span'); $('#shipLine').hidden = false;
        if (h < P.shippingCutoffHour) s.innerHTML = left <= 6 ? `Закажите в ближайшие <b>${left} ч</b> — отправим <b>сегодня</b>` : `Закажите до <b>${P.shippingCutoffHour}:00</b> — отправим <b>сегодня</b>`;
        else s.innerHTML = `Закажите сейчас — отправим <b>завтра утром</b>`;
      };
      upd(); setInterval(upd, 60000);
    }
    // остаток зимних в переключателе сезона
    const winterLeft = D.colors.reduce((a, c) => a + D.stock.winter[c.id].reduce((x, y) => x + y, 0), 0);
    $('#segW').textContent = tg(D.price.winter.now) + (winterLeft < 300 ? ` · осталось ${winterLeft}` : '');
    // вторая пара — доставка бесплатно
    if (P.freeDeliveryFromPairs === 2) $('#bundleNudge').hidden = false;
    // отзывы (только если заполнены в data.js)
    if (Array.isArray(D.reviews) && D.reviews.length) {
      $('#reviews').hidden = false;
      $('#reviewsList').innerHTML = D.reviews.map(r => {
        const c = r.color && colorById(r.color); const dt = r.date ? new Date(r.date) : null;
        return `<article class="rev"><div class="rev-head"><b>${r.name}${r.city ? ', ' + r.city : ''}</b><span>${dt ? dt.getDate() + ' ' + MONTHS[dt.getMonth()] : ''}</span></div><div class="rev-stars">★★★★★</div><p>${r.text}</p>${r.size ? `<span class="rev-tag">Размер ${r.size}${c ? ', ' + c.name.toLowerCase() : ''}</span>` : ''}</article>`;
      }).join('');
    }
    // помощь с размером: один раз за сессию, если размер не выбран и корзина пуста
    if (P.assistAfterSec > 0) {
      let shown = false; try { shown = sessionStorage.getItem('asar-assist') === '1'; } catch (e) {}
      $('#waAssist').href = waLink('Здравствуйте! Помогите подобрать размер ботинок Asar boots. Длина стопы: __ см.');
      $('#assistCall').addEventListener('click', () => { hide(); setTimeout(openCall, 50); });
      const fire = () => {
        if (S.size || cart.length || openSheet) return;
        if (document.visibilityState !== 'visible' && !location.search.includes('assist=1')) {
          document.addEventListener('visibilitychange', () => setTimeout(fire, 3000), { once: true }); return;
        }
        try { sessionStorage.setItem('asar-assist', '1'); } catch (e) {}
        show('assistSheet'); track('Lead', { content_name: 'assist_prompt' });
      };
      if (!shown) setTimeout(fire, P.assistAfterSec * 1000);
    }
  })();

  renderGallery(); renderSwatches(); renderPrice(); renderSizes();

  /* Таблица размеров */
  $('#sizeTable').innerHTML = `<thead><tr><th>Размер</th>${D.sizes.map(s => `<th>${s}</th>`).join('')}</tr></thead>
    <tbody><tr><td>Стелька, см</td>${D.sizes.map(s => `<td>${String(D.insole[s]).replace('.', ',')}</td>`).join('')}</tr>
    <tr><td>Для кого</td>${D.sizes.map(s => `<td>${D.womenSizes.includes(s) ? 'Ж' : 'М'}</td>`).join('')}</tr></tbody>`;

  /* Шторки */
  let openSheet = null;
  function show(id) {
    $('#' + id).hidden = false; openSheet = id;
    document.body.style.overflow = 'hidden'; updateSticky();
    if (!history.state || history.state.sheet !== id) history.pushState({ sheet: id }, '');
  }
  function hide() {
    if (!openSheet) return;
    $('#' + openSheet).hidden = true; openSheet = null;
    document.body.style.overflow = ''; updateSticky();
  }
  window.addEventListener('popstate', () => { if (openSheet) hide(); });
  const closeSheet = () => { if (!openSheet) return; const hadState = history.state && history.state.sheet; hide(); if (hadState) history.back(); };
  $$('[data-close]').forEach(el => el.addEventListener('click', closeSheet));

  /* Корзина */
  let cart = [];
  try { cart = JSON.parse(localStorage.getItem('asar-cart') || '[]'); } catch (e) {}
  const save = () => { try { localStorage.setItem('asar-cart', JSON.stringify(cart)); } catch (e) {} };
  const cartCount = () => cart.reduce((a, i) => a + i.qty, 0);
  const cartSum = () => cart.reduce((a, i) => a + i.qty * D.price[i.season].now, 0);
  const PR = D.promo || {};
  const freeByBundle = () => PR.freeDeliveryFromPairs > 0 && cartCount() >= PR.freeDeliveryFromPairs;
  const deliveryCost = () => ($('#orderForm [name=pickup]').checked || !cart.length || freeByBundle()) ? 0 : D.delivery;

  function addToCart(color, season, size) {
    const it = cart.find(i => i.color === color && i.season === season && i.size === size);
    if (it) it.qty++; else cart.push({ color, season, size, qty: 1 });
    save(); renderCart();
    track('AddToCart', { content_name: 'Asar boots ' + colorById(color).name + ' ' + size, value: D.price[season].now, currency: 'KZT' });
  }
  function renderCart() {
    const n = cartCount();
    $('#cartCount').hidden = n === 0; $('#cartCount').textContent = n;
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
    const nd = $('#cartNudge'), pickup = $('#orderForm [name=pickup]').checked;
    if (PR.freeDeliveryFromPairs > 0 && n > 0 && !pickup) {
      nd.hidden = false;
      $('span', nd).textContent = freeByBundle()
        ? `Доставка бесплатно: ${pairs(n)} едут одной посылкой.`
        : `Добавьте ${PR.freeDeliveryFromPairs - n === 1 ? 'ещё одну пару' : 'ещё ' + pairs(PR.freeDeliveryFromPairs - n)} — доставка бесплатно, экономия ${tg(D.delivery)}.`;
    } else nd.hidden = true;
    updateSticky();
  }
  function cartView(mode) { // 'cart' | 'success'
    const has = cart.length > 0, ok = mode === 'success';
    $('#orderSuccess').hidden = !ok;
    $('#cartEmpty').hidden = ok || has;
    $('#cartSummary').hidden = ok || !has;
    $('#orderForm').hidden = ok || !has;
  }
  $('#cartItems').addEventListener('click', e => {
    const q = e.target.closest('[data-q]'), d = e.target.closest('[data-del]');
    if (q) { const it = cart[+q.dataset.q]; it.qty += +q.dataset.d; if (it.qty <= 0) cart.splice(+q.dataset.q, 1); }
    else if (d) cart.splice(+d.dataset.del, 1);
    else return;
    save(); renderCart(); cartView('cart');
  });
  $('#orderForm [name=pickup]').addEventListener('change', renderCart);
  function openCart() {
    renderCart(); cartView('cart'); show('cartSheet'); $('#cartSheet .sheet-body').scrollTop = 0;
    if (cart.length) track('InitiateCheckout', { value: cartSum(), currency: 'KZT', num_items: cartCount() });
  }
  $('#cartTop').addEventListener('click', openCart);

  /* Купить / в корзину */
  function needSize() {
    if (S.size) return false;
    const o = $('#sizeOpt'); o.scrollIntoView({ block: 'center', behavior: 'smooth' });
    o.classList.remove('sizeOpt-attn'); void o.offsetWidth; o.classList.add('sizeOpt-attn');
    toast('Выберите размер'); return true;
  }
  $('#buyBtn').addEventListener('click', () => { if (needSize()) return; addToCart(S.color, S.season, S.size); openCart(); });
  $('#stickyBtn').addEventListener('click', () => { if (needSize()) return; addToCart(S.color, S.season, S.size); openCart(); });
  $('#addBtn').addEventListener('click', () => { if (needSize()) return; addToCart(S.color, S.season, S.size); toast('Добавлено в корзину'); });

  /* Телефон */
  const digits = v => v.replace(/\D/g, '');
  $$('input[type=tel]').forEach(input => input.addEventListener('input', () => {
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
  }));
  const validPhone = v => digits(v).length === 11;

  /* Отправка */
  async function send(payload) {
    try { const r = await fetch('/api/order', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }); return r.ok; }
    catch (e) { return false; }
  }
  const orderNo = () => 'A' + String(Date.now()).slice(-6);

  $('#orderForm').addEventListener('submit', async e => {
    e.preventDefault();
    const f = e.target, err = $('#formErr'); err.hidden = true;
    $$('input', f).forEach(i => i.classList.remove('bad'));
    const name = f.name.value.trim(), phone = f.phone.value, city = f.city.value.trim();
    if (!name) { f.name.classList.add('bad'); f.name.focus(); return; }
    if (!validPhone(phone)) { f.phone.classList.add('bad'); f.phone.focus(); err.textContent = 'Проверьте номер телефона'; err.hidden = false; return; }
    if (!f.pickup.checked && !city) { f.city.classList.add('bad'); f.city.focus(); err.textContent = 'Укажите город доставки'; err.hidden = false; return; }
    const btn = $('#orderSubmit'); btn.disabled = true; $('#btnLabel').textContent = 'Отправляем…';
    const no = orderNo(), sum = cartSum(), dl = deliveryCost();
    const items = cart.map(i => ({ title: `Ботинки ${colorById(i.color).name.toLowerCase()} (${seasonName(i.season).toLowerCase()})`, size: i.size, qty: i.qty, price: D.price[i.season].now }));
    const cityOut = f.pickup.checked ? 'Самовывоз, ' + D.freePickupCity : city;
    await send({ type: 'order', orderNo: no, name, phone, city: cityOut, pickup: f.pickup.checked, contact: f.contact.value, pay: f.pay.value, items, sum, delivery: dl, total: sum + dl, url: location.href });
    const lines = items.map(i => `• ${i.title}, размер ${i.size} × ${i.qty} — ${tg(i.price * i.qty)}`).join('\n');
    $('#waOrder').href = waLink(`Заказ ${no}\n${lines}\nДоставка: ${dl ? tg(dl) : 'самовывоз'}\nИтого: ${tg(sum + dl)}\n\nИмя: ${name}\nТелефон: ${phone}\nГород: ${cityOut}\nОплата: ${f.pay.value === 'kaspi' ? 'Kaspi перевод' : 'Kaspi Red / рассрочка'}`);
    $('#orderNo').textContent = no;
    track('Purchase', { value: sum + dl, currency: 'KZT', num_items: cartCount() });
    cart = []; save(); renderCart(); cartView('success');
    $('#cartSheet .sheet-body').scrollTop = 0;
    btn.disabled = false; $('#btnLabel').textContent = 'Оформить заказ';
  });

  /* Обратный звонок */
  const openCall = () => { $('#callSuccess').hidden = true; $('#callForm').hidden = false; show('callSheet'); setTimeout(() => $('#callForm [name=phone]').focus(), 300); };
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

  /* Липкая панель: показываем, когда основная кнопка ушла с экрана */
  let ctaVisible = true;
  function updateSticky() {
    $('#sticky').classList.toggle('hide', ctaVisible || !!openSheet);
    const ss = $('#stickySize'); ss.hidden = !S.size; if (S.size) ss.textContent = `Размер ${S.size} · ${colorById(S.color).name.toLowerCase()}`;
    $('#stickyOld').hidden = !!S.size;
  }
  new IntersectionObserver(([en]) => { ctaVisible = en.isIntersecting; updateSticky(); }, { threshold: 0 }).observe($('#buyBtn'));
  renderCart();

  /* Тост */
  let tt;
  function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(tt); tt = setTimeout(() => t.classList.remove('on'), 1800); }
})();
