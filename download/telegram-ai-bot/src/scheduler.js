/**
 * Modulo de Tareas Programadas - Cron jobs para automatizaciones periodicas.
 * Incluye briefing matutino, checks de scraping y recordatorios.
 */
const cron = require('node-cron');
const scraper = require('./scraper');
const store = require('./store');

const activeCrons = new Map();

/**
 * Configura el briefing matutino
 */
function setupMorningBriefing(bot, chatId) {
  const config = store.getConfig();
  const time = config.morningBriefingTime || '07:00';
  const [hour, minute] = time.split(':');

  // Schedule: minute hour * * *
  const expression = `${minute} ${hour} * * *`;

  if (activeCrons.has('morning-briefing')) {
    clearInterval(activeCrons.get('morning-briefing'));
  }

  const task = cron.schedule(expression, async () => {
    try {
      const briefing = await generateMorningBriefing();
      bot.sendMessage(chatId, briefing, { parse_mode: 'Markdown' });
    } catch (err) {
      console.error('Error en briefing matutino:', err.message);
    }
  }, {
    scheduled: true,
    timezone: 'Europe/Madrid',
  });

  activeCrons.set('morning-briefing', task);
  console.log(`⏰ Briefing matutino configurado a las ${time} (Europe/Madrid)`);
}

/**
 * Genera el contenido del briefing matutino
 */
async function generateMorningBriefing() {
  const config = store.getConfig();
  const now = new Date();
  const dateStr = now.toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  let briefing = `☀️ *Buenos días!* _${dateStr}_\n\n`;

  // Notes
  const notes = store.getNotes();
  if (notes.length > 0) {
    briefing += `📝 *Notas pendientes* (${notes.length}):\n`;
    notes.slice(-5).forEach((n) => {
      briefing += `  • ${n.text}\n`;
    });
    briefing += '\n';
  }

  // Expenses summary
  const weekExpenses = store.getExpenses('week');
  if (weekExpenses.length > 0) {
    const total = weekExpenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
    const byCategory = {};
    weekExpenses.forEach((e) => {
      const cat = e.category || 'otro';
      byCategory[cat] = (byCategory[cat] || 0) + (parseFloat(e.amount) || 0);
    });
    briefing += `💰 *Gastos esta semana:* ${total.toFixed(2)}€\n`;
    Object.entries(byCategory).forEach(([cat, amount]) => {
      briefing += `  • ${cat}: ${amount.toFixed(2)}€\n`;
    });
    briefing += '\n';
  }

  // Active scrapers
  const scrapers = store.getScrapers().filter((s) => s.active);
  if (scrapers.length > 0) {
    briefing += `🕷️ *Monitores activos:* ${scrapers.length}\n`;
    scrapers.forEach((s) => {
      const lastCheck = s.lastCheck ? new Date(s.lastCheck).toLocaleString('es-ES') : 'Nunca';
      briefing += `  • ${s.name}: último check ${lastCheck}\n`;
    });
    briefing += '\n';
  }

  // Bookmarks
  const bookmarks = store.getBookmarks();
  if (bookmarks.length > 0) {
    briefing += `🔖 *Marcadores:* ${bookmarks.length} guardados\n`;
  }

  briefing += '\n_¡Que tengas un gran día! 🚀_';
  return briefing;
}

/**
 * Programa un recordatorio
 */
function scheduleReminder(bot, chatId, message, minutes) {
  const id = `reminder-${Date.now()}`;
  const ms = minutes * 60 * 1000;

  const timerId = setTimeout(() => {
    bot.sendMessage(chatId, `⏰ *Recordatorio:* ${message}`, { parse_mode: 'Markdown' });
    activeCrons.delete(id);
  }, ms);

  activeCrons.set(id, timerId);
  return { id, message, minutes };
}

/**
 * Configura checks periodicos de scraping
 */
function setupScraperChecks(bot, chatId) {
  // Check all scrapers every 5 minutes for quick detection
  const id = 'scraper-check-all';
  if (activeCrons.has(id)) {
    return;
  }

  const task = cron.schedule('*/5 * * * *', async () => {
    const scrapers = store.getScrapers().filter((s) => s.active);
    for (const s of scrapers) {
      const result = await scraper.checkScraper(s);
      if (result.changed) {
        const msg = `🕷️ *Cambio detectado en ${s.name}*\n\n` +
          `🔗 ${s.url}\n` +
          `📝 Nuevo contenido:\n${result.newContent.substring(0, 400)}...`;
        bot.sendMessage(chatId, msg, { parse_mode: 'Markdown' });
      }
    }
  }, { scheduled: true });

  activeCrons.set(id, task);
  console.log('⏰ Checks periodicos de scraping configurados (cada 5 min)');
}

/**
 * Detiene todas las tareas programadas
 */
function stopAll() {
  for (const [id, task] of activeCrons) {
    if (task.stop) {
      task.stop();
    } else {
      clearTimeout(task);
    }
  }
  activeCrons.clear();
  console.log('⏰ Todas las tareas programadas detenidas');
}

/**
 * Lista las tareas activas
 */
function listActive() {
  const tasks = [];
  for (const [id, task] of activeCrons) {
    tasks.push({ id, type: id.startsWith('reminder') ? 'recordatorio' : 'cron' });
  }
  return tasks;
}

module.exports = {
  setupMorningBriefing,
  generateMorningBriefing,
  scheduleReminder,
  setupScraperChecks,
  stopAll,
  listActive,
};
