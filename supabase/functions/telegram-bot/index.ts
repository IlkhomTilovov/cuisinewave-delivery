import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN');
const SITE_URL = "https://wpvhlrsehnxwetjwolhd.lovable.app";

async function sendTelegramMessage(chatId: number, text: string, options: any = {}) {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
  
  const body: any = {
    chat_id: chatId,
    text: text,
    parse_mode: 'HTML',
    ...options
  };

  console.log('Sending message to Telegram:', JSON.stringify(body));

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  const result = await response.json();
  console.log('Telegram response:', JSON.stringify(result));
  return result;
}

async function handleStart(chatId: number, firstName: string) {
  const welcomeText = `🍽️ <b>Bella Vista Restaurant</b>ga xush kelibsiz, ${firstName}!

Bizning mazali taomlarimizni sinab ko'ring!

📱 Quyidagi tugmalardan foydalaning:`;

  const keyboard = {
    reply_markup: {
      inline_keyboard: [
        [
          { text: "🌐 Saytga o'tish", web_app: { url: SITE_URL } }
        ]
      ]
    }
  };

  await sendTelegramMessage(chatId, welcomeText, keyboard);
}

serve(async (req) => {
  console.log('Telegram bot function called');
  
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    console.log('Received webhook:', JSON.stringify(body));

    // Handle callback queries (button clicks)
    if (body.callback_query) {
      const chatId = body.callback_query.message.chat.id;
      const firstName = body.callback_query.from.first_name || 'Mehmon';
      
      // Just show start for any callback
      await handleStart(chatId, firstName);
      
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Handle regular messages
    if (body.message) {
      const chatId = body.message.chat.id;
      const firstName = body.message.from?.first_name || 'Mehmon';
      
      // Always show start menu
      await handleStart(chatId, firstName);
      
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: unknown) {
    console.error('Error in telegram-bot function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
