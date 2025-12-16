import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';

const app = express();

// --- CONFIGURAÇÕES DO SISTEMA ---
const supabaseUrl = 'https://lhhasjzlsbmhaxhvaipw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxoaGFzanpsc2JtaGF4aHZhaXB3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUwNzQwMTEsImV4cCI6MjA4MDY1MDAxMX0.xtfP1Sz_LeoRfimOKAAeFd8DNu_rUBYF1lpGdgDVVac';
const supabase = createClient(supabaseUrl, supabaseKey);

const EVOLUTION_API_URL = 'https://cantinhodabere-evolution-api.3xdxtv.easypanel.host';
const EVOLUTION_API_KEY = '429683C4C977415CAAFCCE10F7D57E11';
const INSTANCE_NAME = 'cantinho';
const GEMINI_API_KEY = 'AIzaSyC7yhHU_kZvYIODWYnVpu83BeYUtKXgW3c'; 
const RESTAURANT_ID = '00000000-0000-0000-0000-000000000001';

// 🚨 CONSTANTES DE MANUTENÇÃO
const COMMAND_RESET = '#NEYREVISAO'; 
const PASSWORD_RESET = 'Diney2594'; 
const STATE_WAITING_PASS = 'WAITING_FOR_PASSWORD_NEYREVISAO';
const STATE_IDLE = 'IDLE';

// 🤖 MODELOS GEMINI (Usando v1beta - Suportam texto E áudio!)
const GEMINI_MODELS = [
  'gemini-2.0-flash-exp',
  'gemini-2.5-flash',
  'gemini-2.5-pro',
  'gemini-2.0-flash',
];

app.use(cors());
app.use(express.json({ limit: '50mb' })); 
app.use((req, res, next) => {
  res.setHeader('ngrok-skip-browser-warning', 'true');
  next();
});

// ========================================
// 🔧 FUNÇÕES AUXILIARES
// ========================================

async function buscarCardapio() {
  try {
    const { data: produtos, error } = await supabase
      .from('products')
      .select('*')
      .eq('restaurant_id', RESTAURANT_ID)
      .eq('is_active', true)
      .order('category', { ascending: true });

    if (error || !produtos || produtos.length === 0) {
      return { cardapioVisivel: '⚠️ Não há produtos cadastrados no momento.', cardapioInterno: '' };
    }

    const categorias = {};
    produtos.forEach(produto => {
      if (!categorias[produto.category]) categorias[produto.category] = [];
      categorias[produto.category].push(produto);
    });

    let cardapioVisivel = '## 📋 CARDÁPIO DISPONÍVEL:\n\n';
    let cardapioInterno = '\n## 🆔 MAPA DE PRODUTOS (NÃO MOSTRAR AO CLIENTE):\n';
    
    Object.keys(categorias).forEach(categoria => {
      cardapioVisivel += `### ${categoria}\n`;
      cardapioInterno += `\n### ${categoria} (IDs)\n`;
      
      categorias[categoria].forEach(p => {
        cardapioVisivel += `- **${p.name}** - R$ ${p.price.toFixed(2)}\n`;
        if (p.description) cardapioVisivel += `  _${p.description}_\n`;
        
        cardapioInterno += `- Nome: ${p.name} | ID: ${p.id} | Preço: ${p.price.toFixed(2)}\n`;
      });
      cardapioVisivel += '\n';
    });

    return { cardapioVisivel, cardapioInterno };
  } catch (error) {
    console.error('❌ Erro ao buscar cardápio:', error);
    return { cardapioVisivel: '⚠️ Erro ao carregar cardápio.', cardapioInterno: '' };
  }
}

async function buscarConfiguracoes() {
  try {
    const { data: restaurant, error } = await supabase
      .from('restaurants')
      .select('*')
      .eq('id', RESTAURANT_ID)
      .single();

    if (error) {
        console.error('❌ Erro Supabase:', error.message);
        return null;
    }

    if (!restaurant) {
      return null;
    }

    return restaurant;
  } catch (error) {
    console.error('❌ Erro ao buscar configurações:', error);
    return null;
  }
}

function verificarHorarioFuncionamento(openingHours) {
  if (!openingHours || openingHours.length === 0) return true;

  const now = new Date();
  const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' }); 
  const currentTime = now.toTimeString().slice(0, 5);

  const dayMap = {
    'Sunday': 'Domingo',
    'Monday': 'Segunda',
    'Tuesday': 'Terça',
    'Wednesday': 'Quarta',
    'Thursday': 'Quinta',
    'Friday': 'Sexta',
    'Saturday': 'Sábado',
  };

  const dayName = dayMap[currentDay]; 
  const todaySchedule = openingHours.find(h => h.day === dayName);

  if (!todaySchedule || !todaySchedule.is_open) {
    return false;
  }

  return currentTime >= todaySchedule.open_time && currentTime <= todaySchedule.close_time;
}

async function logBotMessage(conversationId, phone, messageText) {
    await supabase
        .from('whatsapp_messages')
        .insert({
            conversation_id: conversationId,
            phone: phone,
            message_text: messageText,
            is_from_me: true,
        });
}

async function resetConversation(conversationId, phone) {
    try {
        await supabase
            .from('whatsapp_messages')
            .delete()
            .eq('conversation_id', conversationId);

        await supabase
            .from('whatsapp_conversations')
            .update({
                internal_state: STATE_IDLE,
                last_message: '[Conversa Reiniciada]',
                unread_count: 0,
            })
            .eq('id', conversationId);

        console.log(`✅ Conversa ${conversationId} de ${phone} reiniciada com sucesso.`);
        return true;
    } catch (error) {
        console.error('❌ Erro ao reiniciar conversa:', error);
        return false;
    }
}

async function baixarAudioWhatsApp(messageId) {
  try {
    console.log('🎤 Baixando áudio da Evolution API...');
    console.log('🆔 Message ID:', messageId);

    const response = await fetch(
      `${EVOLUTION_API_URL}/chat/getBase64FromMediaMessage/${INSTANCE_NAME}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': EVOLUTION_API_KEY,
        },
        body: JSON.stringify({
          message: {
            key: {
              id: messageId
            }
          },
          convertToMp4: false
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Erro ao baixar mídia:', errorText);
      return null;
    }

    const data = await response.json();
    
    if (data.base64) {
      console.log('✅ Áudio baixado com sucesso!');
      return data.base64;
    }

    console.error('❌ Resposta sem base64:', data);
    return null;

  } catch (error) {
    console.error('❌ Erro ao baixar áudio:', error);
    return null;
  }
}

async function transcreverAudio(base64Audio, mimeType = 'audio/ogg') {
  try {
    console.log('🎤 Transcrevendo áudio com Gemini...');
    console.log('🎵 Tipo MIME original:', mimeType);

    let ultimoErro = null;

    for (const modelo of GEMINI_MODELS) {
      try {
        console.log(`🧪 Tentando transcrição com modelo: ${modelo}`);
        
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent?key=${GEMINI_API_KEY}`;

        const requestBody = {
          contents: [
            {
              parts: [
                {
                  inline_data: {
                    mime_type: mimeType,
                    data: base64Audio
                  }
                },
                {
                  text: 'Transcreva este áudio em português brasileiro. Retorne APENAS o texto falado, sem comentários, análises ou observações adicionais.'
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 2048,
          }
        };

        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`❌ Erro com ${modelo}:`, response.status, errorText);
          
          if (response.status === 429) {
            ultimoErro = new Error(`Quota excedida: ${modelo}`);
            continue;
          }
          
          ultimoErro = new Error(`HTTP ${response.status}: ${errorText}`);
          continue;
        }

        const data = await response.json();

        if (data.candidates && data.candidates[0] && data.candidates[0].content) {
          const transcricao = data.candidates[0].content.parts[0].text;
          console.log(`✅ Áudio transcrito com sucesso usando: ${modelo}`);
          console.log('📝 Transcrição:', transcricao);
          return transcricao.trim();
        }

        throw new Error('Resposta inválida do Gemini');

      } catch (erro) {
        console.error(`❌ Falha com ${modelo}:`, erro.message);
        ultimoErro = erro;
        continue;
      }
    }

    console.error('❌ TODOS OS MODELOS DE ÁUDIO FALHARAM!');
    throw ultimoErro || new Error('Nenhum modelo de áudio disponível');

  } catch (error) {
    console.error('❌ Erro ao transcrever áudio:', error);
    return null;
  }
}

async function gerarRespostaIA(mensagemCliente, telefone, config) {
  try {
    console.log('🤖 Gerando resposta com IA...');

    const { data: conversationData } = await supabase
      .from('whatsapp_conversations')
      .select('id')
      .eq('phone', telefone)
      .eq('restaurant_id', RESTAURANT_ID)
      .single();

    let historicoMensagens = [];
    if (conversationData) {
      const { data: messages } = await supabase
        .from('whatsapp_messages')
        .select('*')
        .eq('conversation_id', conversationData.id)
        .order('timestamp', { ascending: true })
        .limit(50);

      historicoMensagens = (messages || []).map(msg => ({
        role: msg.is_from_me ? 'model' : 'user',
        parts: [{ text: msg.message_text }]
      }));
    }

    const { cardapioVisivel, cardapioInterno } = await buscarCardapio();

    const dataAtual = new Date().toLocaleDateString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const horarioTexto = config.opening_hours && config.opening_hours.length > 0
      ? config.opening_hours.map(h => `${h.day}: ${h.is_open ? `${h.open_time} às ${h.close_time}` : 'FECHADO'}`).join('\n')
      : 'Não configurado';
      
    const systemInstructionText = `Você é ${config.bot_name || 'a Assistente Virtual'} do restaurante ${config.name}. Seu papel é atender o cliente, conduzir a venda e processar o pedido.

📅 DATA E HORA ATUAL: ${dataAtual}

## ℹ️ INFORMAÇÕES DO RESTAURANTE:
- Nome: ${config.name}
- Endereço: ${config.address || 'Não configurado'}
- Telefone: ${config.phone || 'Não configurado'}
- Taxa de entrega: R$ ${(config.delivery_fee || 0).toFixed(2)}
- Tempo médio de entrega: ${config.delivery_time || '30-40 minutos'}

${cardapioVisivel}

${cardapioInterno}

## 🕐 HORÁRIO DE FUNCIONAMENTO:
${horarioTexto}

## 🎯 SUAS RESPONSABILIDADES:
1. 🛑 **NOME CRÍTICO (PRIORIDADE MÁXIMA)**: O nome do restaurante é **${config.name}**. **IGNORE QUALQUER OUTRO NOME DE RESTAURANTE**. Você deve se apresentar e se referir APENAS como ${config.name}.
2. 🛑 **FLUXO DE CONVERSA (PRIORIDADE MÁXIMA)**:
    * **Saudação Única**: Use a saudação completa ("Olá! Bem-vindo(a) ao ${config.name}!") SOMENTE se a conversa for iniciada (primeira mensagem do cliente).
    * **Mantenha Contexto**: NUNCA perca o contexto, NUNCA repita a saudação e NUNCA repita perguntas que já foram respondidas. Se o cliente responder com SIM/OK, continue o fluxo da venda.
    * **Resposta Direta**: Responda diretamente às informações do cliente para manter o fluxo de venda ativo.
3. ✅ **Atendimento e Venda**: Seja sempre amigável, educado, e conduza a venda.
4. ✅ **Consultar cardápio**: Mostre o cardápio visível ao cliente (sem IDs). Use o "MAPA DE PRODUTOS" APENAS INTERNAMENTE para obter o ID e o preço correto ao montar o JSON de finalização.
5. ✅ **Anotar pedido**: Pergunte quantidade e observações.
6. ✅ **Coletar dados**: Nome, Endereço completo, Forma de Pagamento.
7. ✅ **Calcular total**: Somar itens + taxa de entrega de R$ ${(config.delivery_fee || 0).toFixed(2)}.
8. ✅ **Confirmar pedido**: Mostrar resumo completo antes de finalizar.

## ⚠️ IMPORTANTE - FORMATO DE FINALIZAÇÃO:
Quando o cliente CONFIRMAR O PEDIDO COMPLETO, responda em duas partes (Texto + JSON).
O JSON deve ser estritamente assim:
\`\`\`json
{
  "action": "create_order",
  "data": {
    "customer_name": "Nome",
    "customer_phone": "${telefone}",
    "delivery_address": "Endereço",
    "payment_method": "pix",
    "items": [
      { "product_id": "id", "name": "Produto", "quantity": 1, "price": 10.00, "notes": "" }
    ],
    "notes": ""
  }
}
\`\`\`

${config.bot_instructions ? `\n## 📝 INSTRUÇÕES ADICIONAIS:\n${config.bot_instructions}\n` : ''}

🗣️ Responda sempre em português brasileiro!`;

    const requestBody = {
      systemInstruction: {
        parts: [
          { text: systemInstructionText }
        ]
      },
      contents: [
        ...historicoMensagens,
        { role: 'user', parts: [{ text: mensagemCliente }] }
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2048,
        topP: 0.95,
        topK: 40
      }
    };

    let ultimoErro = null;
    
    for (const modelo of GEMINI_MODELS) {
      try {
        console.log(`🧪 Tentando modelo: ${modelo}`);
        
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent?key=${GEMINI_API_KEY}`; 

        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`❌ Erro com ${modelo}:`, response.status, errorText);
          
          if (response.status === 429) {
            ultimoErro = new Error(`Quota excedida: ${modelo}`);
            continue;
          }
          ultimoErro = new Error(`HTTP ${response.status}: ${errorText}`);
          continue;
        }

        const data = await response.json();

        if (data.candidates && data.candidates[0] && data.candidates[0].content) {
          const resposta = data.candidates[0].content.parts[0].text;
          console.log(`✅ Resposta gerada com sucesso usando: ${modelo}`);
          return resposta;
        }
        throw new Error('Resposta inválida do Gemini');
      } catch (erro) {
        console.error(`❌ Falha com ${modelo}:`, erro.message);
        ultimoErro = erro;
        continue;
      }
    }

    console.error('❌ TODOS OS MODELOS FALHARAM!');
    throw ultimoErro || new Error('Nenhum modelo disponível');

  } catch (error) {
    console.error('❌ Erro ao gerar resposta:', error);
    const fallbackName = config?.name || 'nossa lanchonete';
    return `Olá! 👋 Bem-vindo ao ${fallbackName}! 😊\n\nEstou com uma dificuldade técnica no momento, mas já vou te atender!`;
  }
}

async function enviarMensagemWhatsApp(telefone, mensagem) {
  try {
    console.log('📤 Enviando mensagem via Evolution...');
    const telefoneFormatado = telefone.includes('@s.whatsapp.net')
      ? telefone
      : `${telefone.replace(/\D/g, '')}@s.whatsapp.net`;

    const response = await fetch(`${EVOLUTION_API_URL}/message/sendText/${INSTANCE_NAME}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': EVOLUTION_API_KEY,
      },
      body: JSON.stringify({
        number: telefoneFormatado,
        text: mensagem,
      }),
    });

    if (!response.ok) {
      throw new Error(`Erro Evolution: ${response.status}`);
    }

    console.log('✅ Mensagem enviada com sucesso!');
    return true;
  } catch (error) {
    console.error('❌ Erro ao enviar mensagem:', error);
    return false;
  }
}

async function criarPedido(telefone, dadosPedido) {
  try {
    console.log('📦 Criando pedido no sistema...');

    let { data: customer } = await supabase
      .from('customers')
      .select('id')
      .eq('phone', telefone)
      .eq('restaurant_id', RESTAURANT_ID)
      .single();

    if (!customer) {
      const { data: newCustomer, error: customerError } = await supabase
        .from('customers')
        .insert({
          restaurant_id: RESTAURANT_ID,
          name: dadosPedido.customer_name,
          phone: telefone,
          address: dadosPedido.delivery_address 
        })
        .select()
        .single();
      
      if (customerError) {
        console.error('❌ Erro ao criar cliente:', customerError);
      }
      customer = newCustomer;
    }

    const itemsTotal = dadosPedido.items.reduce(
      (sum, item) => sum + (item.price * item.quantity),
      0
    );

    const { data: restaurant } = await supabase
      .from('restaurants')
      .select('delivery_fee')
      .eq('id', RESTAURANT_ID)
      .single();

    const total = itemsTotal + (restaurant?.delivery_fee || 0);

    const { data: order, error } = await supabase
      .from('orders')
      .insert({
        restaurant_id: RESTAURANT_ID,
        customer_id: customer?.id,
        customer_name: dadosPedido.customer_name,
        customer_phone: telefone,
        delivery_address: dadosPedido.delivery_address,
        status: 'PENDING',
        total: total,
        payment_method: dadosPedido.payment_method,
        items: dadosPedido.items, 
        origin: 'whatsapp',
        notes: dadosPedido.notes || ''
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Erro ao criar pedido:', error);
      return false;
    }

    console.log('✅ Pedido criado com sucesso:', order.id);
    return true;

  } catch (error) {
    console.error('❌ Erro ao criar pedido:', error);
    return false;
  }
}

function extrairDadosPedido(respostaIA) {
  try {
    const jsonMatch = respostaIA.match(/```json\s*(\{[\s\S]*?\})\s*```/); 
    
    if (jsonMatch) {
      const jsonString = jsonMatch[1];
      const jsonData = JSON.parse(jsonString);

      if (jsonData.action === 'create_order' && jsonData.data) {
        console.log('📦 Dados do pedido extraídos com sucesso!');
        return jsonData.data;
      }
    }
    
    const fallbackMatch = respostaIA.match(/\{[\s\S]*?"action"\s*:\s*"create_order"[\s\S]*?\}/);

    if (fallbackMatch) {
        const jsonString = fallbackMatch[0];
        const jsonData = JSON.parse(jsonString);

        if (jsonData.action === 'create_order' && jsonData.data) {
            console.log('📦 Dados do pedido (Fallback) extraídos com sucesso!');
            return jsonData.data;
        }
    }
    return null;
  } catch (error) {
    console.error('❌ Erro ao extrair dados do pedido:', error);
    return null;
  }
}

// ========================================
// ROTAS DA API
// ========================================

app.post('/api/whatsapp-webhook', async (req, res) => {
  try {
    console.log('\n📱 ====================================');
    console.log('📱 WEBHOOK RECEBIDO DA EVOLUTION');
    console.log('📱 ====================================');

    const { event, data } = req.body;

    if (event === 'messages.upsert') {
      const message = data;

      if (message && message.key && !message.key.fromMe) {
        // ✅ USAR O JID COMPLETO (com @lid ou @s.whatsapp.net)
        const phone = message.key.remoteJid;
        console.log('📞 JID completo recebido:', phone);
        
        let messageText = null;
        let isAudio = false;

        const audioMessage = message.message?.audioMessage || 
                           message.message?.ptt || 
                           message.audioMessage;

        if (audioMessage) {
          isAudio = true;
          console.log('🎤 ÁUDIO DETECTADO!');
          
          const audioBase64 = await baixarAudioWhatsApp(message.key.id);
          
          if (audioBase64) {
            const mimeType = audioMessage.mimetype || 'audio/ogg; codecs=opus';
            console.log('🎵 MIME Type detectado:', mimeType);
            
            const transcricao = await transcreverAudio(audioBase64, mimeType);
            
            if (transcricao) {
              messageText = transcricao;
              console.log('📝 Transcrição bem-sucedida:', transcricao);
            } else {
              messageText = '[Áudio não pôde ser transcrito]';
              console.error('❌ Falha na transcrição');
            }
          } else {
            messageText = '[Erro ao baixar áudio]';
            console.error('❌ Falha ao baixar áudio');
          }
        } else {
          messageText = message.message?.conversation ||
                       message.message?.extendedTextMessage?.text ||
                       '[Mídia não suportada]';
        }

        // ✅ IMPORTANTE: Remover APENAS @s.whatsapp.net para buscar no banco (mas manter @lid)
        const phoneForDb = phone.replace('@s.whatsapp.net', '');
        
        console.log(`📩 Original: ${phone}`);
        console.log(`📩 Para DB: ${phoneForDb}`);
        console.log(`📩 Mensagem: ${messageText}`);

        const config = await buscarConfiguracoes();

        if (!config) {
          console.error('❌ Configurações do restaurante não encontradas');
          res.status(200).json({ success: false, error: 'Configurações não encontradas' });
          
          const fallbackError = 'Olá! Recebemos sua mensagem, mas nosso sistema de pedidos está temporariamente fora do ar. Por favor, tente novamente em alguns minutos!';
          await enviarMensagemWhatsApp(phone, fallbackError);
          return;
        }

        if (!config.bot_is_active) {
          console.log('🤖 Bot desativado');
          res.status(200).json({ success: true, message: 'Bot desativado' });
          return;
        }

        let { data: conversation } = await supabase
          .from('whatsapp_conversations')
          .select('*')
          .eq('phone', phoneForDb)
          .eq('restaurant_id', RESTAURANT_ID)
          .single();

        const updateData = {
          last_message: messageText,
          last_message_at: new Date().toISOString(),
          unread_count: (conversation?.unread_count || 0) + 1,
          internal_state: conversation?.internal_state || STATE_IDLE, 
        };

        if (!conversation) {
          console.log('🆕 Nova conversa criada');
          const { data: newConv } = await supabase
            .from('whatsapp_conversations')
            .insert({
              restaurant_id: RESTAURANT_ID,
              phone: phoneForDb,
              contact_name: message.pushName || phoneForDb,
              ...updateData,
              unread_count: 1, 
              is_bot_paused: false,
              internal_state: STATE_IDLE,
            })
            .select()
            .single();
          conversation = newConv;
        } else {
          await supabase
            .from('whatsapp_conversations')
            .update(updateData)
            .eq('id', conversation.id);
        }

        conversation = { ...conversation, ...updateData };

        if (conversation) {
          await supabase
            .from('whatsapp_messages')
            .insert({
              conversation_id: conversation.id,
              phone: phoneForDb,
              message_text: messageText,
              is_from_me: false,
            });
        }

        const currentInternalState = conversation.internal_state || STATE_IDLE;

        if (messageText.toUpperCase().trim() === COMMAND_RESET) {
            await supabase
                .from('whatsapp_conversations')
                .update({ internal_state: STATE_WAITING_PASS })
                .eq('id', conversation.id);
            
            const responseText = "🤖 **[Modo Manutenção]** Confirme sua identidade para reiniciar. Por favor, digite a senha de acesso:";
            await enviarMensagemWhatsApp(phone, responseText);
            await logBotMessage(conversation.id, phone, responseText);
            
            console.log(`🛠️ Entrou no modo ${COMMAND_RESET}. Aguardando senha.`);
            return res.status(200).json({ success: true, message: 'Waiting for password' });
        }

        if (currentInternalState === STATE_WAITING_PASS) {
            if (messageText.trim() === PASSWORD_RESET) {
                await resetConversation(conversation.id, phone);
                
                const responseText = "✅ **[Modo Manutenção]** Acesso concedido. A conversa foi reiniciada com sucesso. A IA começará do zero na próxima mensagem.";
                await enviarMensagemWhatsApp(phone, responseText);
                await logBotMessage(conversation.id, phone, responseText);
                
                console.log(`✅ Senha correta. Conversa de ${phone} reiniciada.`);
                return res.status(200).json({ success: true, message: 'Conversation reset' });
            } else {
                await supabase
                    .from('whatsapp_conversations')
                    .update({ internal_state: STATE_IDLE })
                    .eq('id', conversation.id);

                const responseText = "❌ **[Modo Manutenção]** Senha incorreta. Acesso negado. O bot foi retomado normalmente.";
                await enviarMensagemWhatsApp(phone, responseText);
                await logBotMessage(conversation.id, phone, responseText);