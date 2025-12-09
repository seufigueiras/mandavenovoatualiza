// services/whatsappService.ts (Versão FINAL e CORRETA)

import axios from 'axios';

// --- CONFIGURAÇÃO (Chamada para o n8n) ---
// 🟢 Endereço de Produção do seu n8n (lido do .env.local)
const N8N_BASE_URL = process.env.NEXT_PUBLIC_N8N_BASE_URL; 
// 🟢 Endpoint Webhook que você criará no n8n para iniciar a conexão.
const N8N_CONNECT_PATH = '/webhook/qrcode'; // Path de Conexão, AJUSTADO para o seu fluxo
const N8N_STATUS_PATH_PREFIX = '/webhook/whatsapp-status/'; // Path de Status

// --- CLIENTE AXIOS CONFIGURADO ---

if (!N8N_BASE_URL) {
  console.error("Variável de ambiente NEXT_PUBLIC_N8N_BASE_URL não configurada.");
}

const whatsappClient = axios.create({
  baseURL: N8N_BASE_URL, 
  headers: {
    'Content-Type': 'application/json',
  },
});

// --- TIPAGENS BÁSICAS ---

interface InstanceCreationData {
  instanceName: string; // O UUID do Restaurante
  webhookUrl: string; // O Webhook de mensagens do n8n para a sua conexão
}

export interface InstanceStatus {
  state: 'CONNECTED' | 'DISCONNECTED' | 'SCAN_QR_CODE' | 'LOADING';
  qrcode?: string; // QR Code em Base64
  instanceName: string;
}

// --- FUNÇÕES DE SERVIÇO ---

/**
 * Inicia a sessão de WhatsApp chamando o Webhook do n8n.
 */
export async function createInstanceAndGetQrCode(data: InstanceCreationData): Promise<InstanceStatus> {
  if (!N8N_BASE_URL) {
    throw new Error('Configuração de URL do n8n ausente.');
  }
  
  const url = N8N_CONNECT_PATH; 
  
  try {
    const response = await whatsappClient.post(url, {
      instanceName: data.instanceName, 
      webhookUrl: data.webhookUrl,
    });

    const responseData = response.data;
    
    // Assumimos que o n8n retorna o QR Code e o Status
    return {
      state: responseData.state || 'SCAN_QR_CODE', 
      instanceName: data.instanceName,
      qrcode: responseData.qrcode, 
    };
  } catch (error) {
    console.error('Erro ao chamar o n8n para conexão do WhatsApp:', error);
    throw new Error('Falha de comunicação com o n8n. O servidor de automação está online e o Webhook configurado?');
  }
}

/**
 * Busca o status atual de uma instância existente (chamando um endpoint do n8n).
 */
export async function getInstanceStatus(instanceName: string): Promise<InstanceStatus> {
  if (!N8N_BASE_URL) {
    throw new Error('Configuração de URL do n8n ausente.');
  }

  // A URL completa será N8N_BASE_URL + /webhook/whatsapp-status/ + instanceName
  const N8N_STATUS_URL = N8N_BASE_URL + N8N_STATUS_PATH_PREFIX + instanceName;
  
  try {
    const response = await axios.get(N8N_STATUS_URL);
    const statusData = response.data;

    return {
      state: statusData.state || 'LOADING', 
      qrcode: statusData.qrcode, 
      instanceName: instanceName,
    };
  } catch (error) {
    console.error('Erro ao buscar o status da instância no n8n:', error);
    return {
        state: 'DISCONNECTED',
        instanceName: instanceName,
    };
  }
}