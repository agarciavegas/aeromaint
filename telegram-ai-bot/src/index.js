import { chat, generateImage, webSearch, readWebPage, clearHistory } from './ai.js';
import { addNote, getNotes, deleteNote, clearNotes, addReminder, getReminders, deleteReminder, logConversation } from './store.js';
import { sendMessage, sendImage, sendTyping, getUpdates } from './telegram.js';

// ============================================================
// CONFIGURACION
// ============================================================
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8207150505:AAF2qZEAi8CAcHPHFc58lcJzOH4vwqMTsGQ';
const ALLOWED_CHAT_ID = Number(process.env.TELEGRAM_CHAT_ID || '1135426447');
const BOT_NAME = 'ZBot';

let offset = 0;
let isRunning = true;

// ============================================================
// MANEJO DE SEÑALES PARA CERRAR LIMPIAMENTE
// ============================================================
process.on('SIGINT', () => {
  console.log('\n🛑 Cerrando bot...');
  isRunning = false;
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Cerrando bot...');
  isRunning = false;
  process.exit(0);
});

// ============================================================
// COMANDOS ESPECIALES
// ============================================================
const COMMANDS = {
  '/start': async (chatId) => {
    return `¡Hola! 👋 Soy *${BOT_NAME}*, tu asistente personal con IA.\n\n` +
      `🧠 *Lo que puedo hacer:*\n` +
      `• 💬 Conversar y responder preguntas\n` +
      `• 🔍 Buscar informacion en internet\n` +
      `• 🎨 Generar imagenes con IA\n` +
      `• 📝 Guardar notas y recordatorios\n` +
      `• 🌐 Analizar paginas web\n` +
      `• 📊 Resumir articulos\n\n` +
      `💡 *Simplemente escribe lo que necesites en lenguaje natural!*\n\n` +
      `Comandos rapido:\n` +
      `/nota <texto> - Guardar nota\n` +
      `/notas - Ver notas\n` +
      `/buscar <tema> - Buscar en internet\n` +
      `/imagen <descripcion> - Generar imagen\n` +
      `/recordar <hora> <mensaje> - Recordatorio\n` +
      `/borrar - Limpiar conversacion\n` +
      `/help - Ver ayuda`;
  },
  
  '/help': async (chatId) => {
    return `📚 *Ayuda de ${BOT_NAME}*\n\n` +
      `*Conversacion:*\n` +
      `Escribe lo que quieras y te respondere con IA.\n\n` +
      `*Comandos:*\n` +
      `/start - Mensaje de bienvenida\n` +
      `/nota <texto> - Guardar una nota\n` +
      `/notas - Listar todas las notas\n` +
      `/borrarnota <id> - Eliminar una nota\n` +
      `/buscar <tema> - Buscar en internet\n` +
      `/imagen <desc> - Generar imagen con IA\n` +
      `/recordar <hora> | <msg> - Crear recordatorio\n` +
      `/recordatorios - Ver recordatorios\n` +
      `/leer <url> - Leer y resumir una web\n` +
      `/borrar - Limpiar historial de chat\n` +
      `/help - Esta ayuda\n\n` +
      `*Ejemplos:*\n` +
      `• "Que tiempo hace en Madrid?"\n` +
      `• "Buscame noticias de IA"\n` +
      `• "Genera una imagen de un atardecer en la playa"\n` +
      `• "Resumeme esta web: https://..."\n` +
      `• "Apuntame: comprar leche"`;
  }
};

// ============================================================
// PROCESAR MENSAJE
// ============================================================
async function processMessage(chatId, text) {
  console.log(`📩 [${new Date().toISOString()}] Mensaje: ${text.substring(0, 100)}`);
  
  // Verificar permisos
  if (chatId !== ALLOWED_CHAT_ID) {
    await sendMessage(BOT_TOKEN, chatId, '⛔ No tienes permiso para usar este bot.');
    return;
  }
  
  // Enviar indicador de escribiendo
  await sendTyping(BOT_TOKEN, chatId);
  
  // Procesar comandos directos
  const commandResult = await handleDirectCommands(chatId, text);
  if (commandResult !== null) {
    await sendMessage(BOT_TOKEN, chatId, commandResult);
    logConversation(chatId, text, commandResult);
    return;
  }
  
  // Procesar con IA
  try {
    const aiResponse = await chat(chatId, text);
    
    // Procesar herramientas integradas en la respuesta
    const { cleanResponse, actions } = parseToolActions(aiResponse);
    
    // Enviar respuesta de texto
    await sendMessage(BOT_TOKEN, chatId, cleanResponse);
    
    // Ejecutar acciones
    for (const action of actions) {
      await executeAction(chatId, action);
    }
    
    logConversation(chatId, text, cleanResponse);
  } catch (error) {
    console.error('Error procesando mensaje:', error);
    await sendMessage(BOT_TOKEN, chatId, '❌ Error al procesar tu mensaje. Intenta de nuevo.');
  }
}

// ============================================================
// COMANDOS DIRECTOS (sin IA, respuesta inmediata)
// ============================================================
async function handleDirectCommands(chatId, text) {
  const parts = text.trim().split(' ');
  const command = parts[0].toLowerCase();
  const args = parts.slice(1).join(' ');
  
  // Comandos simples sin argumentos
  if (COMMANDS[command]) {
    return await COMMANDS[command](chatId);
  }
  
  // /nota <texto>
  if (command === '/nota' && args) {
    const note = addNote(args);
    return `✅ *Nota guardada!*\n📝 ${note.text}\n🆔 ID: ${note.id}`;
  }
  
  // /notas
  if (command === '/notas') {
    const notes = getNotes();
    if (notes.length === 0) {
      return '📋 No tienes notas guardadas.\n\nUsa /nota <texto> para guardar una.';
    }
    let response = `📋 *Tus notas* (${notes.length}):\n\n`;
    notes.forEach((n, i) => {
      const date = new Date(n.createdAt).toLocaleDateString('es-ES');
      response += `${i + 1}. ${n.text}\n   🆔 ${n.id} | 📅 ${date}\n\n`;
    });
    response += '\n_Borra con /borrarnota <id>_';
    return response;
  }
  
  // /borrarnota <id>
  if (command === '/borrarnota') {
    const id = Number(args);
    if (!id) return '❌ Uso: /borrarnota <id>\n\nVer IDs con /notas';
    const deleted = deleteNote(id);
    return deleted ? '✅ Nota eliminada.' : '❌ Nota no encontrada.';
  }
  
  // /buscar <tema>
  if (command === '/buscar' && args) {
    await sendTyping(BOT_TOKEN, chatId);
    const results = await webSearch(args, 5);
    if (!results || results.length === 0) {
      return '🔍 No encontre resultados para esa busqueda.';
    }
    let response = `🔍 *Resultados para "${args}":*\n\n`;
    results.forEach((r, i) => {
      response += `${i + 1}. *${r.name}*\n`;
      response += `   ${r.snippet}\n`;
      response += `   🔗 ${r.url}\n\n`;
    });
    return response;
  }
  
  // /imagen <descripcion>
  if (command === '/imagen' && args) {
    await sendTyping(BOT_TOKEN, chatId);
    await sendMessage(BOT_TOKEN, chatId, `🎨 Generando imagen: "${args}"...`);
    const base64 = await generateImage(args);
    if (base64) {
      await sendImage(BOT_TOKEN, chatId, base64, `🎨 "${args}"`);
      return null; // Ya enviamos la imagen
    }
    return '❌ No pude generar la imagen. Intenta con otra descripcion.';
  }
  
  // /leer <url>
  if (command === '/leer' && args) {
    await sendTyping(BOT_TOKEN, chatId);
    const url = args.startsWith('http') ? args : `https://${args}`;
    const pageData = await readWebPage(url);
    if (pageData && pageData.data) {
      const title = pageData.data.title || 'Sin titulo';
      // Convertir HTML a texto plano
      const plainText = (pageData.data.html || '')
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .substring(0, 3000);
      
      // Pedir a la IA que resuma
      const summaryPrompt = `Resume el siguiente contenido de la pagina web "${title}" de forma concisa en espanol (max 500 palabras). Destaca los puntos mas importantes:\n\n${plainText}`;
      const summary = await chat(chatId, summaryPrompt);
      return `📄 *${title}*\n\n${summary}\n\n🔗 ${url}`;
    }
    return '❌ No pude leer esa pagina. Verifica la URL.';
  }
  
  // /recordar <hora> | <mensaje>
  if (command === '/recordar' && args) {
    const parts = args.split('|').map(s => s.trim());
    const time = parts[0] || '';
    const message = parts[1] || parts[0] || '';
    
    const reminder = addReminder(message, time || null);
    return `⏰ *Recordatorio creado!*\n📝 ${message}\n${time ? `🕐 ${time}` : '📌 Sin hora especifica'}\n🆔 ID: ${reminder.id}`;
  }
  
  // /recordatorios
  if (command === '/recordatorios') {
    const reminders = getReminders();
    const pending = reminders.filter(r => !r.sent);
    if (pending.length === 0) {
      return '⏰ No tienes recordatorios pendientes.';
    }
    let response = `⏰ *Recordatorios* (${pending.length} pendientes):\n\n`;
    pending.forEach((r, i) => {
      response += `${i + 1}. ${r.text}\n`;
      response += `   🆔 ${r.id}${r.triggerAt ? ` | 🕐 ${r.triggerAt}` : ''}\n\n`;
    });
    return response;
  }
  
  // /borrar (limpiar historial)
  if (command === '/borrar') {
    clearHistory(chatId);
    return '🗑 Historial de conversacion borrado. Empezamos de cero! 🆕';
  }
  
  return null; // No es un comando directo, procesar con IA
}

// ============================================================
// PARSEAR ACCIONES DE HERRAMIENTAS EN RESPUESTA IA
// ============================================================
function parseToolActions(response) {
  const actions = [];
  let cleanResponse = response;
  
  // Buscar patrones [SEARCH: ...], [IMAGE: ...], [NOTE: ...], [REMIND: ... | ...], [READ: ...]
  const patterns = [
    { regex: /\[SEARCH:\s*([^\]]+)\]/gi, type: 'search' },
    { regex: /\[IMAGE:\s*([^\]]+)\]/gi, type: 'image' },
    { regex: /\[NOTE:\s*([^\]]+)\]/gi, type: 'note' },
    { regex: /\[REMIND:\s*([^\]|]+)\s*\|\s*([^\]]+)\]/gi, type: 'remind' },
    { regex: /\[READ:\s*([^\]]+)\]/gi, type: 'read' }
  ];
  
  for (const { regex, type } of patterns) {
    let match;
    while ((match = regex.exec(response)) !== null) {
      actions.push({
        type,
        value: match[1],
        value2: match[2] || null,
        original: match[0]
      });
    }
  }
  
  // Limpiar comandos de la respuesta
  for (const action of actions) {
    cleanResponse = cleanResponse.replace(action.original, '');
  }
  
  return { cleanResponse: cleanResponse.trim(), actions };
}

// ============================================================
// EJECUTAR ACCIONES DE HERRAMIENTAS
// ============================================================
async function executeAction(chatId, action) {
  switch (action.type) {
    case 'search': {
      await sendTyping(BOT_TOKEN, chatId);
      const results = await webSearch(action.value, 3);
      if (results && results.length > 0) {
        let msg = `🔍 *Resultados para "${action.value}":*\n\n`;
        results.forEach((r, i) => {
          msg += `${i + 1}. *${r.name}*\n   ${r.snippet}\n\n`;
        });
        await sendMessage(BOT_TOKEN, chatId, msg);
      }
      break;
    }
    
    case 'image': {
      await sendTyping(BOT_TOKEN, chatId);
      await sendMessage(BOT_TOKEN, chatId, `🎨 Generando imagen...`);
      const base64 = await generateImage(action.value);
      if (base64) {
        await sendImage(BOT_TOKEN, chatId, base64, `🎨 "${action.value}"`);
      }
      break;
    }
    
    case 'note': {
      const note = addNote(action.value);
      await sendMessage(BOT_TOKEN, chatId, `✅ Nota guardada: "${note.text}" (ID: ${note.id})`);
      break;
    }
    
    case 'remind': {
      const reminder = addReminder(action.value2 || action.value, action.value);
      await sendMessage(BOT_TOKEN, chatId, `⏰ Recordatorio creado: "${action.value2 || action.value}"`);
      break;
    }
    
    case 'read': {
      await sendTyping(BOT_TOKEN, chatId);
      const pageData = await readWebPage(action.value);
      if (pageData && pageData.data) {
        const title = pageData.data.title || 'Sin titulo';
        const plainText = (pageData.data.html || '')
          .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
          .substring(0, 2000);
        const summary = await chat(chatId, `Resume en 200 palabras: ${plainText}`);
        await sendMessage(BOT_TOKEN, chatId, `📄 *${title}*\n\n${summary}`);
      }
      break;
    }
  }
}

// ============================================================
// LOOP PRINCIPAL - LONG POLLING
// ============================================================
async function startBot() {
  console.log('');
  console.log('╔══════════════════════════════════════════╗');
  console.log('║       ZBot - Telegram AI Bot 🤖         ║');
  console.log('║       Iniciando...                       ║');
  console.log('╚══════════════════════════════════════════╝');
  console.log('');
  
  // Verificar token
  try {
    const botInfo = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getMe`);
    const data = await botInfo.json();
    if (!data.ok) {
      console.error('❌ Token de Telegram invalido!');
      process.exit(1);
    }
    console.log(`✅ Bot conectado: @${data.result.username} (${data.result.first_name})`);
  } catch (error) {
    console.error('❌ Error conectando con Telegram:', error.message);
    process.exit(1);
  }
  
  console.log(`✅ Chat ID autorizado: ${ALLOWED_CHAT_ID}`);
  console.log(`✅ Modelo IA: z-ai-web-dev-sdk`);
  console.log('');
  console.log('📡 Escuchando mensajes... (Ctrl+C para parar)');
  console.log('─────────────────────────────────────────');
  
  // Loop de polling
  while (isRunning) {
    try {
      const updates = await getUpdates(BOT_TOKEN, offset, 30);
      
      for (const update of updates) {
        // Actualizar offset
        offset = update.update_id + 1;
        
        // Procesar mensaje
        if (update.message && update.message.text) {
          const chatId = update.message.chat.id;
          const text = update.message.text;
          
          // Procesar en background para no bloquear el polling
          processMessage(chatId, text).catch(err => {
            console.error('Error procesando mensaje:', err);
          });
        }
      }
    } catch (error) {
      if (isRunning) {
        console.error('Error en polling:', error.message);
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
  }
}

// ============================================================
// INICIAR
// ============================================================
startBot().catch(error => {
  console.error('Error fatal:', error);
  process.exit(1);
});
