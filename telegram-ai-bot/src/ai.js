import ZAI from 'z-ai-web-dev-sdk';

let zaiInstance = null;

async function getZAI() {
  if (!zaiInstance) {
    zaiInstance = await ZAI.create();
  }
  return zaiInstance;
}

// Memoria de conversacion por chat
const conversations = new Map();
const MAX_HISTORY = 20;

function getHistory(chatId) {
  if (!conversations.has(chatId)) {
    conversations.set(chatId, []);
  }
  return conversations.get(chatId);
}

function addToHistory(chatId, role, content) {
  const history = getHistory(chatId);
  history.push({ role, content });
  // Mantener solo los ultimos N mensajes
  if (history.length > MAX_HISTORY) {
    history.splice(0, history.length - MAX_HISTORY);
  }
}

function clearHistory(chatId) {
  conversations.delete(chatId);
}

// Funcion principal de chat con IA
export async function chat(chatId, userMessage, tools = []) {
  const zai = await getZAI();
  const history = getHistory(chatId);
  
  // Anadir mensaje del usuario al historial
  addToHistory(chatId, 'user', userMessage);
  
  // Construir mensajes
  const systemPrompt = buildSystemPrompt(tools);
  const messages = [
    { role: 'system', content: systemPrompt },
    ...history
  ];
  
  try {
    const completion = await zai.chat.completions.create({
      messages,
      temperature: 0.7,
      max_tokens: 2000
    });
    
    let response = completion.choices[0]?.message?.content || 'Lo siento, no pude generar una respuesta.';
    
    // Procesar comandos de herramientas en la respuesta
    response = await processToolCommands(chatId, response, tools);
    
    // Anadir respuesta al historial
    addToHistory(chatId, 'assistant', response);
    
    return response;
  } catch (error) {
    console.error('Error en chat:', error.message);
    return '❌ Error al comunicarse con la IA. Intenta de nuevo.';
  }
}

// Generar imagen
export async function generateImage(prompt) {
  try {
    const zai = await getZAI();
    const response = await zai.images.generations.create({
      prompt,
      size: '1024x1024'
    });
    return response.data[0]?.base64 || null;
  } catch (error) {
    console.error('Error generando imagen:', error.message);
    return null;
  }
}

// Buscar en la web
export async function webSearch(query, num = 5) {
  try {
    const zai = await getZAI();
    const results = await zai.functions.invoke('web_search', {
      query,
      num
    });
    return results;
  } catch (error) {
    console.error('Error en busqueda web:', error.message);
    return [];
  }
}

// Leer pagina web
export async function readWebPage(url) {
  try {
    const zai = await ZAI.create();
    const result = await zai.functions.invoke('page_reader', { url });
    return result;
  } catch (error) {
    console.error('Error leyendo pagina:', error.message);
    return null;
  }
}

// Construir system prompt con herramientas disponibles
function buildSystemPrompt(tools) {
  let prompt = `Eres un asistente personal inteligente llamado ZBot. Vives en Telegram y ayudaras al usuario con todo lo que necesite.

CARACTERISTICAS:
- Responde siempre en espanol
- Se conciso pero informativo
- Usa emojis para hacer las respuestas mas atractivas
- Tienes memoria de la conversacion actual
- Puedes buscar informacion en internet
- Puedes generar imagenes
- Puedes guardar notas y recordatorios
- Puedes analizar paginas web

HERRAMIENTAS DISPONIBLES:
Cuando necesites usar una herramienta, incluye el comando en tu respuesta entre corchetes. El sistema lo procesara automaticamente.

1. [SEARCH: termino de busqueda] - Busca informacion en internet
2. [IMAGE: descripcion de la imagen] - Genera una imagen con IA
3. [READ: url de la pagina] - Lee y resume el contenido de una pagina web
4. [NOTE: texto de la nota] - Guarda una nota para despues
5. [REMIND: hora fecha | mensaje] - Crea un recordatorio

EJEMPLOS:
- "Buscame informacion sobre X" -> usa [SEARCH: X] y resume los resultados
- "Genera una imagen de X" -> usa [IMAGE: X]
- "Que dice esta pagina? URL" -> usa [READ: URL]
- "Apuntame esto: X" -> usa [NOTE: X]
- "Recuerdame X a las Y" -> usa [REMIND: Y | X]

REGLAS:
- No inventes informacion, usa SEARCH si no estas seguro
- Para imagenes, se descriptivo y creativo
- Siempre confirma cuando guardes notas o recordatorios
- Si algo falla, explicalo de forma sencilla`;

  return prompt;
}

// Procesar comandos de herramientas en la respuesta
async function processToolCommands(chatId, response, tools) {
  // Los comandos se procesan externamente en el handler principal
  return response;
}

export { getHistory, addToHistory, clearHistory };
