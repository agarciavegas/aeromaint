/**
 * Comandos del Bot - Maneja todos los comandos de Telegram y procesa
 * las respuestas de la IA para ejecutar acciones.
 */
const store = require('./store');
const ai = require('./ai');
const scraper = require('./scraper');
const scheduler = require('./scheduler');
const n8n = require('./n8n-connector');

const ALLOWED_CHAT_IDS = (process.env.TELEGRAM_CHAT_ID || '').split(',').map(String);

function isAuthorized(chatId) {
  return ALLOWED_CHAT_IDS.length > 0 && ALLOWED_CHAT_IDS.includes(String(chatId));
}

/**
 * Registra todos los comandos en el bot
 */
function registerCommands(bot) {
  // === Command: /start ===
  bot.onText(/\/start/, (msg) => {
    if (!isAuthorized(msg.chat.id)) return;
    const helpText = `🤖 *ZBot - Tu Asistente Personal con IA*

¡Hola! Soy tu asistente personal integrado con Telegram. Puedo hacer muchas cosas por ti:

📝 *Notas:* /nota <texto> - Crear nota
📋 *Listar:* /notas - Ver tus notas
💰 *Gastos:* /gasto <cantidad> <categoria> [descripcion]
📊 *Resumen:* /gastos [today|week|month]
🕷️ *Scraping:* /vigilar <url> [selector] [minutos] [nombre]
🔍 *Comprobar:* /check <id> - Check manual de scraper
🔖 *Marcadores:* /marcador <url> [titulo]
⏰ *Recordar:* /recordar <minutos> <mensaje>
☀️ *Briefing:* /briefing [hora HH:MM]
🧠 *IA:* Escribe cualquier mensaje y te responderé con IA
🔗 *n8n:* /n8n - Ver estado de n8n
🗑️ *Borrar:* /borrar <tipo> <id>
❓ *Ayuda:* /help

_Puedes escribirme en lenguaje natural y usaré IA para entenderte_ 🚀`;

    bot.sendMessage(msg.chat.id, helpText, { parse_mode: 'Markdown' });
  });

  // === Command: /help ===
  bot.onText(/\/help/, (msg) => {
    if (!isAuthorized(msg.chat.id)) return;
    bot.emit('text', msg, ['/start']); // Reuse start message
    // Actually send the help text directly
    const helpText = `🤖 *Comandos disponibles:*

📝 /nota <texto> - Crear una nota
📋 /notas - Listar todas las notas
💰 /gasto <cantidad> [categoria] [desc] - Registrar gasto
📊 /gastos [today|week|month|all] - Resumen de gastos
🕷️ /vigilar <url> [selector] [min] [nombre] - Vigilar web
🔍 /check - Ver estado de scrapers
🔖 /marcador <url> [titulo] - Guardar marcador
📚 /marcadores - Listar marcadores
⏰ /recordar <minutos> <mensaje> - Recordatorio
☀️ /briefing [HH:MM] - Configurar briefing matutino
🧠 /chat <mensaje> - Hablar con la IA directamente
🔗 /n8n - Estado de n8n
🗑️ /borrar <nota|gasto|marcador|scraper> <id>
🔄 /reset - Borrar historial de conversación
📊 /status - Estado del bot
❓ /help - Esta ayuda

_Escribe cualquier cosa sin / y la IA te responderá_ ✨`;
    bot.sendMessage(msg.chat.id, helpText, { parse_mode: 'Markdown' });
  });

  // === Command: /nota ===
  bot.onText(/\/nota\s+(.+)/, (msg, match) => {
    if (!isAuthorized(msg.chat.id)) return;
    const text = match[1].trim();
    const note = store.addNote({ text });
    bot.sendMessage(msg.chat.id, `📝 Nota creada:\n\n_${text}_\n\nID: \`${note.id}\``, { parse_mode: 'Markdown' });
  });

  // === Command: /notas ===
  bot.onText(/\/notas/, (msg) => {
    if (!isAuthorized(msg.chat.id)) return;
    const notes = store.getNotes();
    if (notes.length === 0) {
      bot.sendMessage(msg.chat.id, '📋 No tienes notas. Usa /nota <texto> para crear una.');
      return;
    }
    let text = `📋 *Tus notas* (${notes.length}):\n\n`;
    notes.forEach((n) => {
      const date = new Date(n.createdAt).toLocaleDateString('es-ES');
      text += `📝 \`${n.id}\` - ${n.text}\n   _${date}_\n\n`;
    });
    bot.sendMessage(msg.chat.id, text, { parse_mode: 'Markdown' });
  });

  // === Command: /gasto ===
  bot.onText(/\/gasto\s+(\d+\.?\d*)\s*(.*)/, (msg, match) => {
    if (!isAuthorized(msg.chat.id)) return;
    const amount = parseFloat(match[1]);
    const rest = match[2] ? match[2].trim() : '';
    const parts = rest.split(/\s+/);
    const category = parts[0] || 'general';
    const description = parts.slice(1).join(' ') || '';

    const expense = store.addExpense({ amount, category, description });
    bot.sendMessage(
      msg.chat.id,
      `💰 Gasto registrado:\n\n💵 ${amount.toFixed(2)}€ | 📂 ${category}${description ? ` | 📝 ${description}` : ''}\n\nID: \`${expense.id}\``,
      { parse_mode: 'Markdown' }
    );
  });

  // === Command: /gastos ===
  bot.onText(/\/gastos(?:\s+(\w+))?/, (msg, match) => {
    if (!isAuthorized(msg.chat.id)) return;
    const period = match[1] || 'week';
    const expenses = store.getExpenses(period);
    if (expenses.length === 0) {
      const periodNames = { today: 'hoy', week: 'esta semana', month: 'este mes', all: 'siempre' };
      bot.sendMessage(msg.chat.id, `📊 No tienes gastos ${periodNames[period] || period}.`);
      return;
    }

    const total = expenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
    const byCategory = {};
    expenses.forEach((e) => {
      const cat = e.category || 'general';
      byCategory[cat] = (byCategory[cat] || 0) + (parseFloat(e.amount) || 0);
    });

    const periodNames = { today: 'hoy', week: 'esta semana', month: 'este mes', all: 'total' };
    let text = `📊 *Gastos ${periodNames[period] || period}:*\n\n`;
    text += `💵 *Total: ${total.toFixed(2)}€*\n\n📂 *Por categoría:*\n`;
    Object.entries(byCategory)
      .sort((a, b) => b[1] - a[1])
      .forEach(([cat, amount]) => {
        const pct = ((amount / total) * 100).toFixed(0);
        text += `  • ${cat}: ${amount.toFixed(2)}€ (${pct}%)\n`;
      });

    text += `\n📝 *Últimos gastos:*\n`;
    expenses.slice(-5).forEach((e) => {
      const date = new Date(e.createdAt).toLocaleDateString('es-ES');
      text += `  • ${e.amount.toFixed(2)}€ | ${e.category} | ${e.description || 'sin desc.'} | _${date}_\n`;
    });

    bot.sendMessage(msg.chat.id, text, { parse_mode: 'Markdown' });
  });

  // === Command: /vigilar (scraper) ===
  bot.onText(/\/vigilar\s+(\S+)(?:\s+(\S+))?(?:\s+(\d+))?(?:\s+(.+))?/, (msg, match) => {
    if (!isAuthorized(msg.chat.id)) return;
    const url = match[1];
    const selector = match[2] || 'body';
    const interval = parseInt(match[3]) || 30;
    const name = match[4] || `Monitor ${store.getScrapers().length + 1}`;

    const scraperData = store.addScraper({ url, selector, interval, name });
    scraper.startMonitor(scraperData, bot, msg.chat.id);

    bot.sendMessage(
      msg.chat.id,
      `🕷️ Monitor configurado:\n\n🔗 URL: ${url}\n🎯 Selector: \`${selector}\`\n⏱️ Intervalo: cada ${interval} min\n📛 Nombre: ${name}\n\nID: \`${scraperData.id}\``,
      { parse_mode: 'Markdown' }
    );
  });

  // === Command: /check (scraper status) ===
  bot.onText(/\/check(?:\s+(\S+))?/, async (msg, match) => {
    if (!isAuthorized(msg.chat.id)) return;
    const scrapers = store.getScrapers();

    if (scrapers.length === 0) {
      bot.sendMessage(msg.chat.id, '🕷️ No tienes monitores activos. Usa /vigilar <url> para crear uno.');
      return;
    }

    if (match[1]) {
      // Check specific scraper
      const result = await scraper.manualCheck(match[1]);
      if (result.error) {
        bot.sendMessage(msg.chat.id, `❌ Error: ${result.error}`);
      } else if (result.changed) {
        bot.sendMessage(
          msg.chat.id,
          `🕷️ *Cambio detectado!*\n\n📝 Nuevo contenido:\n${result.newContent.substring(0, 500)}...`,
          { parse_mode: 'Markdown' }
        );
      } else {
        bot.sendMessage(msg.chat.id, '✅ Sin cambios desde el último check.');
      }
      return;
    }

    // List all scrapers
    let text = `🕷️ *Monitores activos* (${scrapers.length}):\n\n`;
    for (const s of scrapers) {
      const status = s.active ? '🟢' : '🔴';
      const lastCheck = s.lastCheck ? new Date(s.lastCheck).toLocaleString('es-ES') : 'Nunca';
      text += `${status} *${s.name}*\n`;
      text += `   🔗 ${s.url}\n`;
      text += `   ⏱️ Cada ${s.interval} min | Último: ${lastCheck}\n`;
      text += `   ID: \`${s.id}\`\n\n`;
    }
    bot.sendMessage(msg.chat.id, text, { parse_mode: 'Markdown' });
  });

  // === Command: /marcador ===
  bot.onText(/\/marcador\s+(\S+)(?:\s+(.+))?/, (msg, match) => {
    if (!isAuthorized(msg.chat.id)) return;
    const url = match[1];
    const title = match[2] || url;
    const bookmark = store.addBookmark({ url, title });
    bot.sendMessage(
      msg.chat.id,
      `🔖 Marcador guardado:\n\n📌 ${title}\n🔗 ${url}\n\nID: \`${bookmark.id}\``,
      { parse_mode: 'Markdown' }
    );
  });

  // === Command: /marcadores ===
  bot.onText(/\/marcadores/, (msg) => {
    if (!isAuthorized(msg.chat.id)) return;
    const bookmarks = store.getBookmarks();
    if (bookmarks.length === 0) {
      bot.sendMessage(msg.chat.id, '🔖 No tienes marcadores. Usa /marcador <url> [titulo].');
      return;
    }
    let text = `🔖 *Tus marcadores* (${bookmarks.length}):\n\n`;
    bookmarks.forEach((b) => {
      text += `📌 \`${b.id}\` - [${b.title}](${b.url})\n`;
    });
    bot.sendMessage(msg.chat.id, text, { parse_mode: 'Markdown' });
  });

  // === Command: /recordar ===
  bot.onText(/\/recordar\s+(\d+)\s+(.+)/, (msg, match) => {
    if (!isAuthorized(msg.chat.id)) return;
    const minutes = parseInt(match[1]);
    const message = match[2].trim();

    if (minutes < 1) {
      bot.sendMessage(msg.chat.id, '❌ El mínimo es 1 minuto.');
      return;
    }

    const result = scheduler.scheduleReminder(bot, msg.chat.id, message, minutes);
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    const timeStr = hours > 0 ? `${hours}h ${mins}m` : `${mins} min`;
    bot.sendMessage(
      msg.chat.id,
      `⏰ Recordatorio programado:\n\n📝 ${message}\n⏱️ En ${timeStr}`,
      { parse_mode: 'Markdown' }
    );
  });

  // === Command: /briefing ===
  bot.onText(/\/briefing(?:\s+(\d{1,2}):(\d{2}))?/, (msg, match) => {
    if (!isAuthorized(msg.chat.id)) return;
    const hour = match[1] || '07';
    const minute = match[2] || '00';
    const time = `${hour.padStart(2, '0')}:${minute}`;

    store.updateConfig({
      morningBriefingEnabled: true,
      morningBriefingTime: time,
    });

    scheduler.setupMorningBriefing(bot, msg.chat.id);
    bot.sendMessage(
      msg.chat.id,
      `☀️ Briefing matutino configurado:\n\n⏰ Todos los días a las ${time} (hora Madrid)\n\nIncluirá: notas pendientes, resumen de gastos, estado de monitores y marcadores.`,
      { parse_mode: 'Markdown' }
    );
  });

  // === Command: /n8n ===
  bot.onText(/\/n8n/, async (msg) => {
    if (!isAuthorized(msg.chat.id)) return;

    if (!n8n.isConfigured()) {
      bot.sendMessage(
        msg.chat.id,
        '🔗 n8n no está configurado aún.\n\nAñade N8N_URL y N8N_API_KEY en .env para conectar.\n\nUna vez configurado, podré:\n• Listar workflows\n• Activar/desactivar workflows\n• Crear workflows\n• Ver ejecuciones',
        { parse_mode: 'Markdown' }
      );
      return;
    }

    const connection = await n8n.checkConnection();
    if (!connection.connected) {
      bot.sendMessage(msg.chat.id, `❌ No puedo conectar con n8n: ${connection.error}`);
      return;
    }

    const workflows = await n8n.listWorkflows();
    const text = n8n.formatWorkflowsList(workflows);
    bot.sendMessage(msg.chat.id, text, { parse_mode: 'Markdown' });
  });

  // === Command: /borrar ===
  bot.onText(/\/borrar\s+(nota|gasto|marcador|scraper)\s+(\S+)/, (msg, match) => {
    if (!isAuthorized(msg.chat.id)) return;
    const type = match[1];
    const id = match[2];

    const deleters = {
      nota: { fn: store.removeNote, name: 'Nota' },
      gasto: { fn: store.removeExpense, name: 'Gasto' },
      marcador: { fn: store.removeBookmark, name: 'Marcador' },
      scraper: { fn: (id) => { scraper.stopMonitor(id); return store.removeScraper(id); }, name: 'Scraper' },
    };

    const deleter = deleters[type];
    if (!deleter) {
      bot.sendMessage(msg.chat.id, '❌ Tipo no válido. Usa: nota, gasto, marcador o scraper.');
      return;
    }

    deleter.fn(id);
    bot.sendMessage(msg.chat.id, `🗑️ ${deleter.name} con ID \`${id}\` eliminado.`, { parse_mode: 'Markdown' });
  });

  // === Command: /reset ===
  bot.onText(/\/reset/, (msg) => {
    if (!isAuthorized(msg.chat.id)) return;
    store.clearConversation(msg.chat.id);
    bot.sendMessage(msg.chat.id, '🔄 Historial de conversación borrado. Empezamos de cero.');
  });

  // === Command: /status ===
  bot.onText(/\/status/, async (msg) => {
    if (!isAuthorized(msg.chat.id)) return;

    const notes = store.getNotes().length;
    const expenses = store.getExpenses('all').length;
    const scrapers = store.getScrapers().length;
    const bookmarks = store.getBookmarks().length;
    const activeScrapers = store.getScrapers().filter((s) => s.active).length;
    const tasks = scheduler.listActive().length;
    const aiStatus = ai.isAvailable() ? '🟢 Activa' : '🔴 No configurada';
    const n8nStatus = n8n.isConfigured() ? '🟢 Configurado' : '🟡 No configurado';

    let text = `📊 *Estado de ZBot:*\n\n`;
    text += `🧠 IA: ${aiStatus}\n`;
    text += `🔗 n8n: ${n8nStatus}\n\n`;
    text += `📝 Notas: ${notes}\n`;
    text += `💰 Gastos: ${expenses}\n`;
    text += `🕷️ Scrapers: ${scrapers} (${activeScrapers} activos)\n`;
    text += `🔖 Marcadores: ${bookmarks}\n`;
    text += `⏰ Tareas programadas: ${tasks}\n`;
    text += `⏱️ Uptime: ${process.uptime().toFixed(0)}s`;

    bot.sendMessage(msg.chat.id, text, { parse_mode: 'Markdown' });
  });

  // === Command: /chat (explicit AI) ===
  bot.onText(/\/chat\s+(.+)/, async (msg, match) => {
    if (!isAuthorized(msg.chat.id)) return;
    const userMessage = match[1].trim();
    bot.sendChatAction(msg.chat.id, 'typing');

    const response = await ai.chat(userMessage, msg.chat.id);
    const processedResponse = processAIResponse(response, msg.chat.id, bot);
    bot.sendMessage(msg.chat.id, processedResponse, { parse_mode: 'Markdown' });
  });

  // === Regular messages (AI chat) ===
  bot.on('message', async (msg) => {
    if (!isAuthorized(msg.chat.id)) return;
    // Skip commands and non-text messages
    if (!msg.text || msg.text.startsWith('/')) return;

    bot.sendChatAction(msg.chat.id, 'typing');

    const response = await ai.chat(msg.text, msg.chat.id);
    const processedResponse = processAIResponse(response, msg.chat.id, bot);
    bot.sendMessage(msg.chat.id, processedResponse, { parse_mode: 'Markdown' });
  });
}

/**
 * Procesa la respuesta de la IA para ejecutar acciones especiales
 * (crear notas, gastos, scrapers, etc.) basandose en los tags especiales
 */
function processAIResponse(response, chatId, bot) {
  let processed = response;

  // Process [NOTA: texto]
  const notaMatch = response.match(/\[NOTA:\s*(.+?)\]/);
  if (notaMatch) {
    const note = store.addNote({ text: notaMatch[1] });
    processed = processed.replace(notaMatch[0], `✅ Nota guardada (ID: ${note.id})`);
  }

  // Process [GASTO: cantidad|categoria|descripcion]
  const gastoMatch = response.match(/\[GASTO:\s*(.+?)\]/);
  if (gastoMatch) {
    const parts = gastoMatch[1].split('|');
    const amount = parseFloat(parts[0]);
    const category = parts[1] || 'general';
    const description = parts[2] || '';
    if (!isNaN(amount)) {
      const expense = store.addExpense({ amount, category, description });
      processed = processed.replace(gastoMatch[0], `✅ Gasto de ${amount.toFixed(2)}€ registrado (ID: ${expense.id})`);
    }
  }

  // Process [MARCADOR: url|titulo]
  const marcadorMatch = response.match(/\[MARCADOR:\s*(.+?)\]/);
  if (marcadorMatch) {
    const parts = marcadorMatch[1].split('|');
    const url = parts[0];
    const title = parts[1] || url;
    const bookmark = store.addBookmark({ url, title });
    processed = processed.replace(marcadorMatch[0], `✅ Marcador guardado (ID: ${bookmark.id})`);
  }

  // Process [SCRAPER: url|selector|intervalo|nombre]
  const scraperMatch = response.match(/\[SCRAPER:\s*(.+?)\]/);
  if (scraperMatch) {
    const parts = scraperMatch[1].split('|');
    const url = parts[0];
    const selector = parts[1] || 'body';
    const interval = parseInt(parts[2]) || 30;
    const name = parts[3] || `Monitor ${store.getScrapers().length + 1}`;
    const scraperData = store.addScraper({ url, selector, interval, name });
    scraper.startMonitor(scraperData, bot, chatId);
    processed = processed.replace(scraperMatch[0], `✅ Monitor "${name}" configurado cada ${interval} min (ID: ${scraperData.id})`);
  }

  // Process [LISTAR_NOTAS]
  if (response.includes('[LISTAR_NOTAS]')) {
    const notes = store.getNotes();
    if (notes.length === 0) {
      processed = processed.replace('[LISTAR_NOTAS]', '📋 No hay notas');
    } else {
      const notesList = notes.map((n) => `• ${n.text}`).join('\n');
      processed = processed.replace('[LISTAR_NOTAS]', `📋 Tus notas:\n${notesList}`);
    }
  }

  // Process [LISTAR_GASTOS: periodo]
  const gastosMatch = response.match(/\[LISTAR_GASTOS:\s*(\w+)\]/);
  if (gastosMatch) {
    const period = gastosMatch[1];
    const expenses = store.getExpenses(period);
    if (expenses.length === 0) {
      processed = processed.replace(gastosMatch[0], '📊 No hay gastos en este periodo');
    } else {
      const total = expenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
      processed = processed.replace(gastosMatch[0], `📊 Total: ${total.toFixed(2)}€ en ${expenses.length} gastos`);
    }
  }

  // Process [LISTAR_MARCADORES]
  if (response.includes('[LISTAR_MARCADORES]')) {
    const bookmarks = store.getBookmarks();
    if (bookmarks.length === 0) {
      processed = processed.replace('[LISTAR_MARCADORES]', '🔖 No hay marcadores');
    } else {
      const list = bookmarks.map((b) => `• [${b.title}](${b.url})`).join('\n');
      processed = processed.replace('[LISTAR_MARCADORES]', `🔖 Tus marcadores:\n${list}`);
    }
  }

  // Process [LISTAR_SCRAPERS]
  if (response.includes('[LISTAR_SCRAPERS]')) {
    const scrapers = store.getScrapers();
    if (scrapers.length === 0) {
      processed = processed.replace('[LISTAR_SCRAPERS]', '🕷️ No hay monitores activos');
    } else {
      const list = scrapers.map((s) => `• ${s.name} - ${s.url} (cada ${s.interval} min)`).join('\n');
      processed = processed.replace('[LISTAR_SCRAPERS]', `🕷️ Tus monitores:\n${list}`);
    }
  }

  // Process [BORRAR: tipo|id]
  const borrarMatch = response.match(/\[BORRAR:\s*(\w+)\|(\S+)\]/);
  if (borrarMatch) {
    const type = borrarMatch[1];
    const id = borrarMatch[2];
    const deleters = {
      nota: store.removeNote,
      gasto: store.removeExpense,
      marcador: store.removeBookmark,
      scraper: (id) => { scraper.stopMonitor(id); return store.removeScraper(id); },
    };
    if (deleters[type]) {
      deleters[type](id);
      processed = processed.replace(borrarMatch[0], `🗑️ ${type} eliminado`);
    }
  }

  return processed;
}

module.exports = { registerCommands, isAuthorized };
