/**
 * Приём заказов и заявок на звонок.
 * Пересылает в Telegram, если в Vercel заданы переменные окружения:
 *   TELEGRAM_BOT_TOKEN — токен бота (@BotFather)
 *   TELEGRAM_CHAT_ID   — id чата/группы, куда слать заявки
 * Без них просто логирует заявку (видно в Vercel → Logs) и отвечает ok.
 */
const fmt = n => Math.round(n).toLocaleString('ru-RU').replace(/ /g, ' ') + ' ₸';

function render(p) {
  if (p.type === 'callback') {
    return `📞 <b>Обратный звонок</b>\nТелефон: ${esc(p.phone)}${p.name ? '\nИмя: ' + esc(p.name) : ''}\n${esc(p.url || '')}`;
  }
  const items = (p.items || []).map(i => `• ${esc(i.title)}, размер ${i.size} × ${i.qty} — ${fmt(i.price * i.qty)}`).join('\n');
  return `🥾 <b>Новый заказ ${esc(p.orderNo)}</b>\n${items}\nДоставка: ${p.delivery ? fmt(p.delivery) : 'самовывоз'}\n<b>Итого: ${fmt(p.total || 0)}</b>\n\nИмя: ${esc(p.name)}\nТелефон: ${esc(p.phone)}\nГород: ${esc(p.city)}\nСвязь: ${p.contact === 'call' ? 'звонок' : 'WhatsApp'}\nОплата: ${p.pay === 'kaspi_red' ? 'Kaspi Red / рассрочка' : 'Kaspi перевод'}`;
}
const esc = s => String(s ?? '').replace(/[<>&]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]));

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'POST only' });

  let p = req.body;
  if (typeof p === 'string') { try { p = JSON.parse(p); } catch (e) { p = null; } }
  if (!p || !p.phone || String(p.phone).replace(/\D/g, '').length < 10) return res.status(400).json({ ok: false, error: 'bad phone' });
  if (p.type === 'order' && (!Array.isArray(p.items) || !p.items.length)) return res.status(400).json({ ok: false, error: 'empty order' });

  const text = render(p);
  console.log('[asar-order]', JSON.stringify(p));

  const token = process.env.TELEGRAM_BOT_TOKEN, chat = process.env.TELEGRAM_CHAT_ID;
  let forwarded = false;
  if (token && chat) {
    try {
      const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chat, text, parse_mode: 'HTML', disable_web_page_preview: true }),
      });
      forwarded = r.ok;
    } catch (e) { console.error('telegram error', e); }
  }
  return res.status(200).json({ ok: true, forwarded });
};
