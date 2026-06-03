/**
 * Modulo de Web Scraping - Monitoriza paginas web y detecta cambios.
 * Usa axios + cheerio para scraping ligero.
 */
const axios = require('axios');
const cheerio = require('cheerio');
const store = require('./store');

const activeMonitors = new Map();

/**
 * Scrapea una URL y extrae contenido segun el selector CSS
 */
async function scrapeUrl(url, selector = 'body') {
  try {
    const response = await axios.get(url, {
      timeout: 15000,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
      },
    });

    const $ = cheerio.load(response.data);
    const elements = $(selector);

    if (elements.length === 0) {
      return { success: false, error: `Selector "${selector}" no encontrado en la pagina` };
    }

    const content = elements.text().trim().replace(/\s+/g, ' ');
    const html = elements.html() || '';

    return {
      success: true,
      content: content.substring(0, 5000), // Limit content
      html: html.substring(0, 10000),
      elementCount: elements.length,
      url,
    };
  } catch (err) {
    return {
      success: false,
      error: err.message,
      url,
    };
  }
}

/**
 * Comprueba un scraper individual y detecta cambios
 */
async function checkScraper(scraper) {
  const result = await scrapeUrl(scraper.url, scraper.selector);

  if (!result.success) {
    return { changed: false, error: result.error, scraper };
  }

  const previousContent = scraper.lastContent;
  const currentContent = result.content;

  // Update scraper with latest content
  store.updateScraper(scraper.id, {
    lastCheck: new Date().toISOString(),
    lastContent: currentContent,
  });

  if (previousContent && previousContent !== currentContent) {
    return {
      changed: true,
      previousContent: previousContent.substring(0, 500),
      newContent: currentContent.substring(0, 500),
      scraper,
    };
  }

  return { changed: false, scraper };
}

/**
 * Inicia el monitoreo periodico de un scraper
 */
function startMonitor(scraper, bot, chatId) {
  if (activeMonitors.has(scraper.id)) {
    clearInterval(activeMonitors.get(scraper.id));
  }

  const intervalMs = (scraper.interval || 30) * 60 * 1000; // Default 30 min

  const timerId = setInterval(async () => {
    try {
      const result = await checkScraper(scraper);
      if (result.changed) {
        const message = `🕷️ *Cambio detectado en ${scraper.name}*\n\n` +
          `🔗 URL: ${scraper.url}\n` +
          `📝 Contenido anterior:\n\`\`\`\n${result.previousContent.substring(0, 300)}...\n\`\`\`\n\n` +
          `📝 Nuevo contenido:\n\`\`\`\n${result.newContent.substring(0, 300)}...\n\`\`\``;
        bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
      }
    } catch (err) {
      console.error(`Error en monitor ${scraper.name}:`, err.message);
    }
  }, intervalMs);

  activeMonitors.set(scraper.id, timerId);
  console.log(`✅ Monitor iniciado: ${scraper.name} (cada ${scraper.interval || 30} min)`);
}

/**
 * Detiene un monitor
 */
function stopMonitor(scraperId) {
  if (activeMonitors.has(scraperId)) {
    clearInterval(activeMonitors.get(scraperId));
    activeMonitors.delete(scraperId);
    return true;
  }
  return false;
}

/**
 * Inicia todos los scrapers almacenados
 */
function startAllMonitors(bot, chatId) {
  const scrapers = store.getScrapers().filter((s) => s.active);
  for (const scraper of scrapers) {
    startMonitor(scraper, bot, chatId);
  }
  console.log(`🕷️ ${scrapers.length} monitores de scraping iniciados`);
  return scrapers.length;
}

/**
 * Detiene todos los monitores
 */
function stopAllMonitors() {
  for (const [id] of activeMonitors) {
    clearInterval(activeMonitors.get(id));
  }
  activeMonitors.clear();
  console.log('🕷️ Todos los monitores detenidos');
}

/**
 * Ejecuta un check manual de un scraper
 */
async function manualCheck(scraperId) {
  const scrapers = store.getScrapers();
  const scraper = scrapers.find((s) => s.id === scraperId);
  if (!scraper) {
    return { error: 'Scraper no encontrado' };
  }
  return await checkScraper(scraper);
}

module.exports = {
  scrapeUrl,
  checkScraper,
  startMonitor,
  stopMonitor,
  startAllMonitors,
  stopAllMonitors,
  manualCheck,
};
