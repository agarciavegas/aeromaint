// Error handlers globales
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION:', err.message, err.stack);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('UNHANDLED REJECTION:', reason);
});

import { chat, generateImage, webSearch, readWebPage, clearHistory } from './ai.js';
import { addNote, getNotes, deleteNote, clearNotes, addReminder, getReminders, logConversation } from './store.js';

const BOT_TOKEN = '8207150505:AAF2qZEAi8CAcHPHFc58lcJzOH4vwqMTsGQ';
const ALLOWED_CHAT_ID = 1135426447;
const API = `https://api.telegram.org/bot${BOT_TOKEN}`;
let lastId = 0;

async function tg(method, body = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const r = await fetch(`${API}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal
    });
    clearTimeout(timer);
    return await r.json();
  } catch(e) {
    clearTimeout(timer);
    return { ok: false, error: e.message };
  }
}

async function send(chatId, text) {
  if (!text) return;
  // Dividir mensajes largos
  let rest = text;
  while (rest.length > 0) {
    let cut = 4000;
    const nl = rest.lastIndexOf('\n', 4000);
    if (nl > 2000) cut = nl + 1;
    const chunk = rest.substring(0, cut);
    rest = rest.substring(cut);
    let r = await tg('sendMessage', { chat_id: chatId, text: chunk, parse_mode: 'Markdown' });
    if (!r.ok) await tg('sendMessage', { chat_id: chatId, text: chunk });
    await new Promise(z => setTimeout(z, 350));
  }
}

async function sendImg(chatId, b64, cap) {
  try {
    const buf = Buffer.from(b64, 'base64');
    const fd = new FormData();
    fd.append('chat_id', String(chatId));
    fd.append('photo', new Blob([buf]), 'img.png');
    if (cap) fd.append('caption', cap.substring(0, 1024));
    await fetch(`${API}/sendPhoto`, { method: 'POST', body: fd });
  } catch(e) { console.error('sendImg:', e.message); }
}

async function handle(chatId, text) {
  const [c, ...r] = text.split(' ');
  const a = r.join(' ');

  if (c === '/start') return `¡Hola! 👋 Soy *ZBot*, tu asistente IA.\n\n🧠 Puedo: conversar, buscar en internet, generar imagenes, guardar notas, leer webs.\n\n*Comandos:*\n/nota <txt> - Guardar nota\n/notas - Ver notas\n/buscar <tema> - Buscar en internet\n/imagen <desc> - Generar imagen\n/leer <url> - Resumir web\n/recordar <msg> - Recordatorio\n/borrar - Limpiar historial\n/help - Ayuda\n\n💡 O escribe lo que quieras!`;
  if (c === '/help') return `📚 *Ayuda*\n\n/nota <txt> /notas /borrarnota <id>\n/buscar <tema> /imagen <desc>\n/leer <url> /recordar <msg> /recordatorios\n/borrar\n\nO escribe y respondo con IA!`;

  if (c === '/nota' && a) { const n = addNote(a); return `✅ Nota: "${n.text}" (ID:${n.id})`; }
  if (c === '/notas') { const ns = getNotes(); if (!ns.length) return '📋 Sin notas. /nota <texto>'; let m = `📋 *Notas* (${ns.length}):\n\n`; ns.forEach((n,i) => m += `${i+1}. ${n.text} (ID:${n.id})\n`); return m; }
  if (c === '/borrarnota') { const id = Number(a); if (!id) return '❌ /borrarnota <id>'; return deleteNote(id) ? '✅ Borrada' : '❌ No encontrada'; }
  if (c === '/recordar' && a) { const rm = addReminder(a, null); return `⏰ Recordatorio: "${a}" (ID:${rm.id})`; }
  if (c === '/recordatorios') { const rs = getReminders().filter(r=>!r.sent); if (!rs.length) return '⏰ Sin recordatorios'; let m = `⏰ *Recordatorios*:\n\n`; rs.forEach((r,i) => m += `${i+1}. ${r.text} (ID:${r.id})\n`); return m; }
  if (c === '/borrar') { clearHistory(chatId); return '🗑 Historial borrado 🆕'; }

  if (c === '/buscar' && a) {
    const res = await webSearch(a, 5);
    if (!res?.length) return '🔍 Sin resultados';
    let m = `🔍 *"${a}":*\n\n`;
    res.forEach((r,i) => m += `${i+1}. *${r.name}*\n${r.snippet}\n\n`);
    return m;
  }

  if (c === '/imagen' && a) {
    await send(chatId, `🎨 Generando: "${a}"...`);
    const b64 = await generateImage(a);
    if (b64) { await sendImg(chatId, b64, `🎨 "${a}"`); return null; }
    return '❌ Error generando imagen';
  }

  if (c === '/leer' && a) {
    const url = a.startsWith('http') ? a : 'https://' + a;
    const p = await readWebPage(url);
    if (p?.data) {
      const t = (p.data.html||'').replace(/<script[^>]*>[\s\S]*?<\/script>/gi,'').replace(/<style[^>]*>[\s\S]*?<\/style>/gi,'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim().substring(0,3000);
      const s = await chat(chatId, `Resume en 300 palabras en espanol:\n${t}`);
      return `📄 *${p.data.title||'Web'}*\n\n${s}\n\n🔗 ${url}`;
    }
    return '❌ No pude leer la pagina';
  }

  return await chat(chatId, text);
}

// === POLLING CON SETTIMEOUT ===
function poll() {
  tg('getUpdates', { offset: lastId, timeout: 0 }).then(data => {
    if (data.ok && data.result && data.result.length > 0) {
      for (const u of data.result) {
        lastId = u.update_id + 1;
        if (u.message?.text && u.message.chat.id === ALLOWED_CHAT_ID) {
          const text = u.message.text;
          console.log(`📩 ${new Date().toISOString()} ${text.substring(0,60)}`);
          tg('sendChatAction', { chat_id: ALLOWED_CHAT_ID, action: 'typing' }).catch(()=>{});
          handle(ALLOWED_CHAT_ID, text).then(resp => {
            if (resp) return send(ALLOWED_CHAT_ID, resp);
          }).then(() => {
            logConversation(ALLOWED_CHAT_ID, text, 'ok');
          }).catch(e => {
            console.error('handle error:', e.message);
            send(ALLOWED_CHAT_ID, '❌ Error. Intenta de nuevo.').catch(()=>{});
          });
        }
      }
    }
  }).catch(e => {
    console.error('poll error:', e.message);
  }).finally(() => {
    // Programar siguiente poll en 2 segundos
    setTimeout(poll, 2000);
  });
}

// === INICIO ===
async function main() {
  console.log('🤖 ZBot iniciando...');
  await tg('deleteWebhook', { drop_pending_updates: true });
  const info = await tg('getMe');
  if (!info.ok) { console.error('❌ Token invalido'); process.exit(1); }
  console.log(`✅ @${info.result.username} | Chat: ${ALLOWED_CHAT_ID}`);
  console.log('📡 Escuchando...');
  
  // Enviar notificacion
  await tg('sendMessage', { 
    chat_id: ALLOWED_CHAT_ID, 
    text: '🤖 *ZBot está online!* Escribe /start para comenzar',
    parse_mode: 'Markdown'
  });
  
  // Iniciar polling
  poll();
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
