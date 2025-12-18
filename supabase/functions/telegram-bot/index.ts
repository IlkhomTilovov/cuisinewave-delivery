const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN');
const WEBSITE_URL = 'https://burger-plus.uz';

interface TelegramUpdate {
  message?: {
    chat: {
      id: number;
      first_name?: string;
    };
    text?: string;
  };
}

async function sendTelegramMessage(chatId: number, text: string, replyMarkup?: object) {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
  
  const body: Record<string, unknown> = {
    chat_id: chatId,
    text: text,
    parse_mode: 'HTML',
  };
  
  if (replyMarkup) {
    body.reply_markup = replyMarkup;
  }
  
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  
  const result = await response.json();
  console.log('Telegram API response:', result);
  return result;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const update: TelegramUpdate = await req.json();
    console.log('Received update:', JSON.stringify(update));

    if (update.message?.text) {
      const chatId = update.message.chat.id;
      const firstName = update.message.chat.first_name || 'Mehmon';
      const text = update.message.text;

      // Handle /start command
      if (text === '/start') {
        const welcomeMessage = `🍔 <b>Burger Plus</b> ga xush kelibsiz, ${firstName}!

Eng mazali burgerlar va fast food mahsulotlari sizni kutmoqda.

📱 Buyurtma berish uchun saytimizga tashrif buyuring:`;

        const inlineKeyboard = {
          inline_keyboard: [
            [
              {
                text: '🌐 Saytga o\'tish',
                url: WEBSITE_URL,
              },
            ],
          ],
        };

        await sendTelegramMessage(chatId, welcomeMessage, inlineKeyboard);
        console.log(`Welcome message sent to chat ${chatId}`);
      } else {
        // Handle other messages
        const defaultMessage = `Buyurtma berish uchun quyidagi tugmani bosing:`;
        
        const inlineKeyboard = {
          inline_keyboard: [
            [
              {
                text: '🌐 Saytga o\'tish',
                url: WEBSITE_URL,
              },
            ],
          ],
        };

        await sendTelegramMessage(chatId, defaultMessage, inlineKeyboard);
      }
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('Error processing update:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
