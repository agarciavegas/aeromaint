import fs from 'fs';
import path from 'path';

const IMAGES_DIR = '/home/z/my-project/telegram-ai-bot/data/images';

// Asegurar directorio de imagenes
if (!fs.existsSync(IMAGES_DIR)) {
  fs.mkdirSync(IMAGES_DIR, { recursive: true });
}

// Enviar mensaje de texto a Telegram
export async function sendMessage(token, chatId, text, parseMode = 'Markdown') {
  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  
  // Dividir mensajes largos (Telegram max 4096 caracteres)
  const chunks = splitMessage(text, 4000);
  
  for (const chunk of chunks) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: chunk,
          parse_mode: parseMode
        })
      });
      
      const data = await response.json();
      if (!data.ok) {
        // Si falla con Markdown, reintentar sin formato
        if (parseMode === 'Markdown') {
          await sendMessage(token, chatId, chunk, null);
          continue;
        }
        console.error('Error enviando mensaje:', data.description);
      }
      
      // Pequena pausa entre mensajes
      await sleep(300);
    } catch (error) {
      console.error('Error enviando mensaje:', error.message);
    }
  }
}

// Enviar imagen a Telegram
export async function sendImage(token, chatId, base64Image, caption = '') {
  const url = `https://api.telegram.org/bot${token}/sendPhoto`;
  
  try {
    // Guardar imagen temporalmente
    const filename = `img_${Date.now()}.png`;
    const filepath = path.join(IMAGES_DIR, filename);
    const buffer = Buffer.from(base64Image, 'base64');
    fs.writeFileSync(filepath, buffer);
    
    // Enviar como multipart
    const formData = new FormData();
    formData.append('chat_id', chatId);
    formData.append('photo', new Blob([buffer]), filename);
    if (caption) {
      formData.append('caption', caption.substring(0, 1024));
    }
    
    const response = await fetch(url, {
      method: 'POST',
      body: formData
    });
    
    const data = await response.json();
    if (!data.ok) {
      console.error('Error enviando imagen:', data.description);
    }
    
    // Limpiar imagen temporal
    try { fs.unlinkSync(filepath); } catch {}
    
    return data.ok;
  } catch (error) {
    console.error('Error enviando imagen:', error.message);
    return false;
  }
}

// Enviar accion de "escribiendo..."
export async function sendTyping(token, chatId) {
  const url = `https://api.telegram.org/bot${token}/sendChatAction`;
  
  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        action: 'typing'
      })
    });
  } catch {}
}

// Obtener updates via long polling
export async function getUpdates(token, offset = 0, timeout = 30) {
  const url = `https://api.telegram.org/bot${token}/getUpdates`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        offset,
        timeout,
        allowed_updates: ['message']
      }),
      signal: AbortSignal.timeout((timeout + 10) * 1000)
    });
    
    const data = await response.json();
    if (data.ok) {
      return data.result;
    }
    console.error('Error obteniendo updates:', data.description);
    return [];
  } catch (error) {
    if (error.name !== 'AbortError') {
      console.error('Error en polling:', error.message);
    }
    return [];
  }
}

// Dividir mensaje largo en chunks
function splitMessage(text, maxLength) {
  if (text.length <= maxLength) return [text];
  
  const chunks = [];
  let remaining = text;
  
  while (remaining.length > 0) {
    let splitPoint = maxLength;
    
    // Intentar dividir en un salto de linea
    const lastNewline = remaining.lastIndexOf('\n', maxLength);
    if (lastNewline > maxLength / 2) {
      splitPoint = lastNewline + 1;
    }
    
    chunks.push(remaining.substring(0, splitPoint));
    remaining = remaining.substring(splitPoint);
  }
  
  return chunks;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
