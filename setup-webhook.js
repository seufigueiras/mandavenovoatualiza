import fetch from 'node-fetch';

const EVOLUTION_API_URL = 'https://cantinhodabere-evolution-api.3xdxtv.easypanel.host';
const API_KEY = '429683C4C977415CAAFCCE10F7D57E11';
const INSTANCE_NAME = 'testa';
const WEBHOOK_URL = 'https://insinuating-kala-prewar.ngrok-free.dev/api/whatsapp-webhook';

async function setupWebhook() {
  try {
    console.log('\n🔧 ====================================');
    console.log('🔧 CONFIGURANDO WEBHOOK NA EVOLUTION API');
    console.log('🔧 ====================================');
    console.log(`📡 API: ${EVOLUTION_API_URL}`);
    console.log(`🏢 Instância: ${INSTANCE_NAME}`);
    console.log(`🎯 Webhook URL: ${WEBHOOK_URL}\n`);
    
    const payload = {
      webhook: {
        enabled: true,
        url: WEBHOOK_URL,
        webhookByEvents: false,
        events: [
          'MESSAGES_UPSERT',
          'MESSAGES_UPDATE',
          'CONNECTION_UPDATE',
          'QRCODE_UPDATED',
          'SEND_MESSAGE'
        ]
      }
    };

    console.log('📦 Payload:', JSON.stringify(payload, null, 2));
    console.log('');
    
    const response = await fetch(`${EVOLUTION_API_URL}/webhook/set/${INSTANCE_NAME}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': API_KEY
      },
      body: JSON.stringify(payload)
    });

    const text = await response.text();
    
    console.log(`📊 Status: ${response.status}`);
    console.log(`📄 Resposta raw: ${text}\n`);

    if (response.ok) {
      try {
        const data = JSON.parse(text);
        console.log('✅ ====================================');
        console.log('✅ WEBHOOK CONFIGURADO COM SUCESSO!');
        console.log('✅ ====================================');
        console.log('🎯 Resposta:', JSON.stringify(data, null, 2));
        console.log('');
        console.log('🚀 Próximos passos:');
        console.log('1. ✅ Ngrok está rodando');
        console.log('2. ✅ Webhook configurado');
        console.log('3. 🔄 Certifique-se que server.js está rodando');
        console.log('4. 📱 Envie uma mensagem no WhatsApp');
        console.log('5. 👀 Observe o terminal do server.js\n');
      } catch (e) {
        console.log('✅ ====================================');
        console.log('✅ WEBHOOK CONFIGURADO!');
        console.log('✅ ====================================\n');
      }
    } else {
      console.error('❌ ====================================');
      console.error('❌ ERRO AO CONFIGURAR WEBHOOK');
      console.error('❌ ====================================');
      console.error('Status:', response.status);
      console.error('Resposta:', text);
      console.error('');
    }
  } catch (error) {
    console.error('❌ ====================================');
    console.error('❌ ERRO NA REQUISIÇÃO');
    console.error('❌ ====================================');
    console.error('💥 Erro:', error.message);
    console.error(error);
    console.error('');
  }
}

setupWebhook();