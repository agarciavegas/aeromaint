/**
 * Almacenamiento simple basado en JSON para persistir datos del bot.
 * Guarda scrapers, tareas programadas, notas y configuracion.
 */
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const STORE_FILE = path.join(DATA_DIR, 'store.json');

const DEFAULT_STORE = {
  scrapers: [],
  scheduledTasks: [],
  notes: [],
  expenses: [],
  bookmarks: [],
  config: {
    morningBriefingEnabled: false,
    morningBriefingTime: '07:00',
    morningBriefingTopics: [],
  },
  conversations: {},
};

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function load() {
  ensureDataDir();
  try {
    if (fs.existsSync(STORE_FILE)) {
      const data = JSON.parse(fs.readFileSync(STORE_FILE, 'utf-8'));
      return { ...DEFAULT_STORE, ...data };
    }
  } catch (err) {
    console.error('Error cargando store:', err.message);
  }
  return { ...DEFAULT_STORE };
}

function save(store) {
  ensureDataDir();
  try {
    fs.writeFileSync(STORE_FILE, JSON.stringify(store, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error guardando store:', err.message);
  }
}

function getStore() {
  const store = load();
  return store;
}

function updateStore(updater) {
  const store = load();
  const result = updater(store);
  save(store);
  return result;
}

// === Scraper operations ===
function addScraper(scraper) {
  return updateStore((store) => {
    scraper.id = Date.now().toString();
    scraper.createdAt = new Date().toISOString();
    scraper.lastCheck = null;
    scraper.lastContent = null;
    scraper.active = true;
    store.scrapers.push(scraper);
    return scraper;
  });
}

function removeScraper(id) {
  return updateStore((store) => {
    store.scrapers = store.scrapers.filter((s) => s.id !== id);
    return true;
  });
}

function getScrapers() {
  return getStore().scrapers;
}

function updateScraper(id, updates) {
  return updateStore((store) => {
    const idx = store.scrapers.findIndex((s) => s.id === id);
    if (idx !== -1) {
      store.scrapers[idx] = { ...store.scrapers[idx], ...updates };
    }
    return store.scrapers[idx];
  });
}

// === Notes operations ===
function addNote(note) {
  return updateStore((store) => {
    note.id = Date.now().toString();
    note.createdAt = new Date().toISOString();
    store.notes.push(note);
    return note;
  });
}

function getNotes() {
  return getStore().notes;
}

function removeNote(id) {
  return updateStore((store) => {
    store.notes = store.notes.filter((n) => n.id !== id);
    return true;
  });
}

// === Expenses operations ===
function addExpense(expense) {
  return updateStore((store) => {
    expense.id = Date.now().toString();
    expense.createdAt = new Date().toISOString();
    store.expenses.push(expense);
    return expense;
  });
}

function getExpenses(period = 'all') {
  const store = getStore();
  if (period === 'all') return store.expenses;
  const now = new Date();
  const periodMs = {
    today: 86400000,
    week: 604800000,
    month: 2592000000,
  };
  const cutoff = new Date(now.getTime() - (periodMs[period] || 0));
  return store.expenses.filter((e) => new Date(e.createdAt) >= cutoff);
}

function removeExpense(id) {
  return updateStore((store) => {
    store.expenses = store.expenses.filter((e) => e.id !== id);
    return true;
  });
}

// === Bookmarks operations ===
function addBookmark(bookmark) {
  return updateStore((store) => {
    bookmark.id = Date.now().toString();
    bookmark.createdAt = new Date().toISOString();
    store.bookmarks.push(bookmark);
    return bookmark;
  });
}

function getBookmarks() {
  return getStore().bookmarks;
}

function removeBookmark(id) {
  return updateStore((store) => {
    store.bookmarks = store.bookmarks.filter((b) => b.id !== id);
    return true;
  });
}

// === Config operations ===
function getConfig() {
  return getStore().config;
}

function updateConfig(updates) {
  return updateStore((store) => {
    store.config = { ...store.config, ...updates };
    return store.config;
  });
}

// === Conversation memory ===
function getConversationHistory(chatId) {
  const store = getStore();
  return store.conversations[chatId] || [];
}

function addMessageToHistory(chatId, role, content) {
  return updateStore((store) => {
    if (!store.conversations[chatId]) {
      store.conversations[chatId] = [];
    }
    store.conversations[chatId].push({ role, content, timestamp: new Date().toISOString() });
    // Keep only last 20 messages per conversation
    if (store.conversations[chatId].length > 20) {
      store.conversations[chatId] = store.conversations[chatId].slice(-20);
    }
    return true;
  });
}

function clearConversation(chatId) {
  return updateStore((store) => {
    store.conversations[chatId] = [];
    return true;
  });
}

module.exports = {
  getStore,
  updateStore,
  addScraper,
  removeScraper,
  getScrapers,
  updateScraper,
  addNote,
  getNotes,
  removeNote,
  addExpense,
  getExpenses,
  removeExpense,
  addBookmark,
  getBookmarks,
  removeBookmark,
  getConfig,
  updateConfig,
  getConversationHistory,
  addMessageToHistory,
  clearConversation,
};
