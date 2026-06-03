import fs from 'fs';
import path from 'path';

const DATA_DIR = '/home/z/my-project/telegram-ai-bot/data';

// Asegurar que el directorio de datos existe
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// --- NOTAS ---
const NOTES_FILE = path.join(DATA_DIR, 'notes.json');

function loadNotes() {
  try {
    return JSON.parse(fs.readFileSync(NOTES_FILE, 'utf8'));
  } catch {
    return [];
  }
}

function saveNotes(notes) {
  fs.writeFileSync(NOTES_FILE, JSON.stringify(notes, null, 2));
}

export function addNote(text) {
  const notes = loadNotes();
  const note = {
    id: Date.now(),
    text,
    createdAt: new Date().toISOString(),
    done: false
  };
  notes.push(note);
  saveNotes(notes);
  return note;
}

export function getNotes() {
  return loadNotes();
}

export function deleteNote(id) {
  const notes = loadNotes();
  const filtered = notes.filter(n => n.id !== Number(id));
  if (filtered.length === notes.length) return false;
  saveNotes(filtered);
  return true;
}

export function clearNotes() {
  saveNotes([]);
  return true;
}

// --- RECORDATORIOS ---
const REMINDERS_FILE = path.join(DATA_DIR, 'reminders.json');

function loadReminders() {
  try {
    return JSON.parse(fs.readFileSync(REMINDERS_FILE, 'utf8'));
  } catch {
    return [];
  }
}

function saveReminders(reminders) {
  fs.writeFileSync(REMINDERS_FILE, JSON.stringify(reminders, null, 2));
}

export function addReminder(text, triggerAt) {
  const reminders = loadReminders();
  const reminder = {
    id: Date.now(),
    text,
    triggerAt: triggerAt || null,
    createdAt: new Date().toISOString(),
    sent: false
  };
  reminders.push(reminder);
  saveReminders(reminders);
  return reminder;
}

export function getReminders() {
  return loadReminders();
}

export function deleteReminder(id) {
  const reminders = loadReminders();
  const filtered = reminders.filter(r => r.id !== Number(id));
  if (filtered.length === reminders.length) return false;
  saveReminders(filtered);
  return true;
}

export function getPendingReminders() {
  const reminders = loadReminders();
  const now = new Date();
  const pending = reminders.filter(r => !r.sent && (!r.triggerAt || new Date(r.triggerAt) <= now));
  // Marcar como enviados
  for (const r of pending) {
    r.sent = true;
  }
  saveReminders(reminders);
  return pending;
}

// --- CONVERSACION LOG ---
const LOG_FILE = path.join(DATA_DIR, 'conversation-log.json');

export function logConversation(chatId, message, response) {
  try {
    let log = [];
    try {
      log = JSON.parse(fs.readFileSync(LOG_FILE, 'utf8'));
    } catch {}
    
    log.push({
      chatId,
      message,
      response: response.substring(0, 500),
      timestamp: new Date().toISOString()
    });
    
    // Mantener solo los ultimos 100 registros
    if (log.length > 100) {
      log = log.slice(-100);
    }
    
    fs.writeFileSync(LOG_FILE, JSON.stringify(log, null, 2));
  } catch (error) {
    console.error('Error logging conversation:', error.message);
  }
}
