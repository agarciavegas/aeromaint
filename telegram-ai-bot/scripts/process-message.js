import ZAI from 'z-ai-web-dev-sdk';
import { addNote, getNotes, deleteNote, addReminder, getReminders } from '../src/store.js';

const msgText = process.argv[2] || '';
const chatId = 1135426447;

// Memoria simple en archivo
import { readFileSync, writeFileSync, existsSync } from 'fs';
const MEM_FILE = '/home/z/my-project/telegram-ai-bot/data/memory.json';

function getMemory() {
  try { return JSON.parse(readFileSync(MEM_FILE, 'utf8')); }
  catch { return []; }
}

function saveMemory(mem) {
  writeFileSync(MEM_FILE, JSON.stringify(mem.slice(-20), null, 2));
}

async function processMessage(text) {
  const [cmd, ...rest] = text.split(' ');
  const args = rest.join(' ');

  // Comandos directos (sin IA)
  if (cmd === '/start') {
    return `¡Hola! 👋 Soy *ZBot*, tu asistente IA 24/7.\n\n🧠 Puedo: conversar, buscar en internet, generar imagenes, guardar notas, leer webs.\n\n*Comandos:*\n/nota <txt> - Guardar nota\n/notas - Ver notas\n/buscar <tema> - Buscar\n/imagen <desc> - Generar imagen\n/leer <url> - Resumir web\n/recordar <msg> - Recordatorio\n/borrar - Limpiar historial\n/help - Ayuda\n\n💡 O escribe lo que quieras!`;
  }

  if (cmd === '/help') return `📚 *Ayuda*\n/nota <txt> /notas /buscar <tema> /imagen <desc> /leer <url> /recordar <msg> /recordatorios /borrar`;

  if (cmd === '/nota' && args) { const n = addNote(args); return `✅ Nota: "${n.text}" (ID:${n.id})`; }
  if (cmd === '/notas') { const ns = getNotes(); if (!ns.length) return '📋 Sin notas'; let m = `📋 *Notas* (${ns.length}):\n\n`; ns.forEach((n,i) => m += `${i+1}. ${n.text} (ID:${n.id})\n`); return m; }
  if (cmd === '/borrarnota') { const id = Number(args); if (!id) return '❌ /borrarnota <id>'; return deleteNote(id) ? '✅ Borrada' : '❌ No encontrada'; }
  if (cmd === '/recordar' && args) { const r = addReminder(args, null); return `⏰ Recordatorio: "${args}" (ID:${r.id})`; }
  if (cmd === '/recordatorios') { const rs = getReminders().filter(r=>!r.sent); if (!rs.length) return '⏰ Sin recordatorios'; let m = `⏰ *Recordatorios*:\n\n`; rs.forEach((r,i) => m += `${i+1}. ${r.text} (ID:${r.id})\n`); return m; }
  if (cmd === '/borrar') { saveMemory([]); return '🗑 Historial borrado 🆕'; }

  if (cmd === '/buscar' && args) {
    const zai = await ZAI.create();
    const results = await zai.functions.invoke('web_search', { query: args, num: 5 });
    if (!results?.length) return '🔍 Sin resultados';
    let m = `🔍 *"${args}":*\n\n`;
    results.forEach((r,i) => m += `${i+1}. *${r.name}*\n${r.snippet}\n\n`);
    return m;
  }

  if (cmd === '/leer' && args) {
    const zai = await ZAI.create();
    const url = args.startsWith('http') ? args : 'https://' + args;
    const page = await zai.functions.invoke('page_reader', { url });
    if (page?.data) {
      const plain = (page.data.html||'').replace(/<script[^>]*>[\s\S]*?<\/script>/gi,'').replace(/<style[^>]*>[\s\S]*?<\/style>/gi,'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim().substring(0,3000);
      const mem = getMemory();
      mem.push({ role: 'user', content: `Resume en 300 palabras en espanol:\n${plain}` });
      const completion = await zai.chat.completions.create({ messages: [{ role: 'system', content: 'Resume paginas web en espanol de forma concisa.' }, ...mem.slice(-10)], max_tokens: 500 });
      const summary = completion.choices[0]?.message?.content || 'No pude resumir';
      return `📄 *${page.data.title||'Web'}*\n\n${summary}\n\n🔗 ${url}`;
    }
    return '❌ No pude leer la pagina';
  }

  // Chat con IA
  const zai = await ZAI.create();
  const mem = getMemory();
  mem.push({ role: 'user', content: text });
  
  const completion = await zai.chat.completions.create({
    messages: [
      { role: 'system', content: 'Eres un asistente personal llamado ZBot. Respondes en espanol, eres conciso y usas emojis. Tienes memoria de la conversacion.' },
      ...mem.slice(-20)
    ],
    temperature: 0.7,
    max_tokens: 1000
  });
  
  const response = completion.choices[0]?.message?.content || 'Lo siento, no pude responder.';
  mem.push({ role: 'assistant', content: response });
  saveMemory(mem);
  
  return response;
}

// Ejecutar
processMessage(msgText).then(r => {
  if (r) console.log(r);
}).catch(e => {
  console.error('❌ Error procesando mensaje:', e.message);
});
