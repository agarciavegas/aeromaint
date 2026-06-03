/**
 * Conector n8n - Permite gestionar workflows de n8n via API REST.
 * Se activa cuando n8n esta disponible en la URL configurada.
 */
const axios = require('axios');

function getConfig() {
  return {
    baseUrl: process.env.N8N_URL || 'http://localhost:5678',
    apiKey: process.env.N8N_API_KEY || '',
  };
}

function isConfigured() {
  const { apiKey } = getConfig();
  return apiKey && apiKey !== 'n8n_api_key_change_me';
}

function getHeaders() {
  return {
    'X-N8N-API-KEY': getConfig().apiKey,
    'Content-Type': 'application/json',
  };
}

/**
 * Verifica si n8n esta accesible
 */
async function checkConnection() {
  if (!isConfigured()) {
    return { connected: false, error: 'API key de n8n no configurada' };
  }
  try {
    const response = await axios.get(`${getConfig().baseUrl}/api/v1/workflows`, {
      headers: getHeaders(),
      timeout: 5000,
    });
    return { connected: true, workflowCount: response.data.data?.length || 0 };
  } catch (err) {
    return { connected: false, error: err.message };
  }
}

/**
 * Lista todos los workflows
 */
async function listWorkflows() {
  try {
    const response = await axios.get(`${getConfig().baseUrl}/api/v1/workflows`, {
      headers: getHeaders(),
      timeout: 10000,
    });
    const workflows = response.data.data || [];
    return workflows.map((w) => ({
      id: w.id,
      name: w.name,
      active: w.active,
      createdAt: w.createdAt,
      updatedAt: w.updatedAt,
      tags: w.tags?.map((t) => t.name) || [],
    }));
  } catch (err) {
    return { error: err.message };
  }
}

/**
 * Obtiene un workflow por ID
 */
async function getWorkflow(id) {
  try {
    const response = await axios.get(`${getConfig().baseUrl}/api/v1/workflows/${id}`, {
      headers: getHeaders(),
      timeout: 10000,
    });
    return response.data;
  } catch (err) {
    return { error: err.message };
  }
}

/**
 * Crea un nuevo workflow
 */
async function createWorkflow(workflowData) {
  try {
    const response = await axios.post(
      `${getConfig().baseUrl}/api/v1/workflows`,
      workflowData,
      { headers: getHeaders(), timeout: 10000 }
    );
    return response.data;
  } catch (err) {
    return { error: err.message };
  }
}

/**
 * Actualiza un workflow existente
 */
async function updateWorkflow(id, workflowData) {
  try {
    const response = await axios.put(
      `${getConfig().baseUrl}/api/v1/workflows/${id}`,
      workflowData,
      { headers: getHeaders(), timeout: 10000 }
    );
    return response.data;
  } catch (err) {
    return { error: err.message };
  }
}

/**
 * Elimina un workflow
 */
async function deleteWorkflow(id) {
  try {
    await axios.delete(`${getConfig().baseUrl}/api/v1/workflows/${id}`, {
      headers: getHeaders(),
      timeout: 10000,
    });
    return { success: true };
  } catch (err) {
    return { error: err.message };
  }
}

/**
 * Activa un workflow
 */
async function activateWorkflow(id) {
  try {
    const response = await axios.post(
      `${getConfig().baseUrl}/api/v1/workflows/${id}/activate`,
      {},
      { headers: getHeaders(), timeout: 10000 }
    );
    return response.data;
  } catch (err) {
    return { error: err.message };
  }
}

/**
 * Desactiva un workflow
 */
async function deactivateWorkflow(id) {
  try {
    const response = await axios.post(
      `${getConfig().baseUrl}/api/v1/workflows/${id}/deactivate`,
      {},
      { headers: getHeaders(), timeout: 10000 }
    );
    return response.data;
  } catch (err) {
    return { error: err.message };
  }
}

/**
 * Lista ejecuciones recientes
 */
async function listExecutions(limit = 10) {
  try {
    const response = await axios.get(`${getConfig().baseUrl}/api/v1/executions`, {
      headers: getHeaders(),
      params: { limit },
      timeout: 10000,
    });
    return response.data.data || [];
  } catch (err) {
    return { error: err.message };
  }
}

/**
 * Formatea la lista de workflows para Telegram
 */
function formatWorkflowsList(workflows) {
  if (!Array.isArray(workflows)) {
    return '❌ Error al obtener workflows';
  }
  if (workflows.length === 0) {
    return '📭 No hay workflows en n8n';
  }

  let msg = `🔗 *Workflows de n8n* (${workflows.length}):\n\n`;
  workflows.forEach((w) => {
    const status = w.active ? '🟢' : '🔴';
    msg += `${status} *${w.name}*\n`;
    msg += `   ID: ${w.id} | Tags: ${w.tags?.join(', ') || 'ninguno'}\n\n`;
  });
  return msg;
}

module.exports = {
  isConfigured,
  checkConnection,
  listWorkflows,
  getWorkflow,
  createWorkflow,
  updateWorkflow,
  deleteWorkflow,
  activateWorkflow,
  deactivateWorkflow,
  listExecutions,
  formatWorkflowsList,
};
