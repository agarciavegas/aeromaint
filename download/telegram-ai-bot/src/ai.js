/**
 * Modulo de IA - Integracion con OpenAI para respuestas inteligentes.
 * Usa GPT-4o-mini por defecto (rapido y economico).
 * Incluye system prompt con herramientas disponibles.
 */
const OpenAI = require('openai');
const store = require('./store');

let openai = null;

function initAI() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey === 'sk-tu-api-key-aqui') {
    console.log('⚠️  OPENAI_API_KEY no configurada. Modo IA desactivado.');
    return false;
  }
  try {
    openai = new OpenAI({ apiKey });
    console.log('✅ IA inicializada con modelo:', process.env.OPENAI_MODEL || 'gpt-4o-mini');
    return true;
  } catch (err) {
    console.error('❌ Error inicializando IA:', err.message);
    return false;
  }
}

function isAvailable() {
  return openai !== null;
}

const SYSTEM_PROMPT = `Eres un asistente personal avanzado integrado en Telegram. Tu nombre es ZBot.

Tienes las siguientes capacidades:
- 📝 NOTAS: Puedes crear, listar y borrar notas del usuario
- 💰 GASTOS: Puedes registrar, consultar y borrar gastos del usuario  
- 🔖 MARCADORES: Puedes guardar, listar y borrar marcadores/URLs
- 🕷️ SCRAPING: Puedes configurar monitores web que vigilen paginas y avisen cuando cambien
- ⏰ TAREAS: Puedes programar recordatorios y tareas periodicas
- 🔗 n8n: Puedes listar y gestionar workflows de n8n si esta conectado

REGLAS IMPORTANTES:
1. Responde SIEMPRE en español
2. Se conciso pero informativo (es Telegram, no un documento)
3. Para crear notas, gastos, marcadores o scrapers, usa formato JSON en tu respuesta
4. Usa emojis para hacer las respuestas mas visuales
5. Si el usuario pide algo que no puedes hacer, sugiere alternativas

COMANDOS ESPECIALES (incluyelos en tu respuesta cuando sea apropiado):
- Para crear nota: [NOTA: texto de la nota]
- Para crear gasto: [GASTO: cantidad|categoria|descripcion]
- Para crear marcador: [MARCADOR: url|titulo]
- Para crear scraper: [SCRAPER: url|selector|intervalo_minutos|nombre]
- Para listar notas: [LISTAR_NOTAS]
- Para listar gastos: [LISTAR_GASTOS: periodo] (periodo: today/week/month/all)
- Para listar marcadores: [LISTAR_MARCADORES]
- Para listar scrapers: [LISTAR_SCRAPERS]
- Para borrar algo: [BORRAR: tipo|id]

Ejemplos de uso:
Usuario: "Apunta que tengo que llamar al dentista"
Tu: "📝 ¡Anotado! [NOTA: Llamar al dentista]"

Usuario: "He gastado 25 euros en comida"
Tu: "💰 Registrado! [GASTO: 25|comida|]"

Usuario: "Vigila esta web https://ejemplo.com/ofertas cada 30 minutos"
Tu: "🕷️ Monitor configurado! [SCRAPER: https://ejemplo.com/ofertas|body|30|Ofertas]"

Usuario: "Que gastos he tenido esta semana?"
Tu: "[LISTAR_GASTOS: week]"`;

async function chat(userMessage, chatId) {
  if (!openai) {
    return '⚠️ La IA no está configurada. Añade tu OPENAI_API_KEY en el archivo .env para activarla.\n\nMientras tanto, puedes usar los comandos directos como /nota, /gasto, /marcador, etc.';
  }

  try {
    // Get conversation history
    const history = store.getConversationHistory(chatId);
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
    ];

    // Add recent conversation history (last 10 messages)
    const recentHistory = history.slice(-10);
    for (const msg of recentHistory) {
      messages.push({ role: msg.role, content: msg.content });
    }

    messages.push({ role: 'user', content: userMessage });

    const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
    const completion = await openai.chat.completions.create({
      model,
      messages,
      temperature: 0.7,
      max_tokens: 1500,
    });

    const response = completion.choices[0]?.message?.content || 'No pude generar una respuesta.';

    // Save to conversation history
    store.addMessageToHistory(chatId, 'user', userMessage);
    store.addMessageToHistory(chatId, 'assistant', response);

    return response;
  } catch (err) {
    console.error('Error en chat AI:', err.message);
    if (err.status === 401) {
      return '❌ API key de OpenAI inválida. Verifica tu OPENAI_API_KEY en .env';
    }
    if (err.status === 429) {
      return '⏳ Demasiadas peticiones. Espera un momento e inténtalo de nuevo.';
    }
    return `❌ Error de IA: ${err.message}`;
  }
}

module.exports = { initAI, isAvailable, chat };
