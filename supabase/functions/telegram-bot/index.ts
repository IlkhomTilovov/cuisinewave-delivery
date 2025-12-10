import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

// Get site URL for Web App
const SITE_URL = "https://wpvhlrsehnxwetjwolhd.lovable.app";

const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

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

async function getCategories() {
  const { data, error } = await supabase
    .from('categories')
    .select('id, name, slug')
    .eq('is_active', true)
    .order('display_order');
  
  if (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
  return data || [];
}

async function getProducts(categoryId?: string) {
  let query = supabase
    .from('products')
    .select('id, name, price, description, image_url')
    .eq('is_active', true)
    .order('name');

  if (categoryId) {
    query = query.eq('category_id', categoryId);
  }

  const { data, error } = await query.limit(10);
  
  if (error) {
    console.error('Error fetching products:', error);
    return [];
  }
  return data || [];
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
        ],
        [
          { text: "📋 Menyu", callback_data: "menu" },
          { text: "🛒 Buyurtma berish", web_app: { url: `${SITE_URL}/menu` } }
        ],
        [
          { text: "📞 Bog'lanish", callback_data: "contact" },
          { text: "🚚 Yetkazib berish", callback_data: "delivery" }
        ],
        [
          { text: "📍 Manzil", callback_data: "location" },
          { text: "ℹ️ Biz haqimizda", callback_data: "about" }
        ]
      ]
    }
  };

  await sendTelegramMessage(chatId, welcomeText, keyboard);
}

async function handleMenu(chatId: number) {
  const categories = await getCategories();
  
  if (categories.length === 0) {
    await sendTelegramMessage(chatId, "Hozircha kategoriyalar mavjud emas.");
    return;
  }

  const keyboard = {
    reply_markup: {
      inline_keyboard: [
        ...categories.map(cat => ([
          { text: `📂 ${cat.name}`, callback_data: `category_${cat.id}` }
        ])),
        [{ text: "🌐 To'liq menyu (Web)", web_app: { url: `${SITE_URL}/menu` } }],
        [{ text: "🔙 Orqaga", callback_data: "back_to_main" }]
      ]
    }
  };

  await sendTelegramMessage(chatId, "📋 <b>Kategoriyalar</b>\n\nQaysi kategoriyani ko'rishni xohlaysiz?", keyboard);
}

async function handleCategory(chatId: number, categoryId: string) {
  const products = await getProducts(categoryId);
  
  if (products.length === 0) {
    const keyboard = {
      reply_markup: {
        inline_keyboard: [
          [{ text: "🔙 Orqaga", callback_data: "menu" }]
        ]
      }
    };
    await sendTelegramMessage(chatId, "Bu kategoriyada hozircha mahsulotlar mavjud emas.", keyboard);
    return;
  }

  let text = "🍽️ <b>Mahsulotlar:</b>\n\n";
  
  products.forEach((product, index) => {
    text += `${index + 1}. <b>${product.name}</b>\n`;
    text += `   💰 ${product.price?.toLocaleString()} so'm\n`;
    if (product.description) {
      text += `   📝 ${product.description.substring(0, 50)}...\n`;
    }
    text += '\n';
  });

  const keyboard = {
    reply_markup: {
      inline_keyboard: [
        [{ text: "🛒 Buyurtma berish", web_app: { url: `${SITE_URL}/menu` } }],
        [{ text: "🔙 Kategoriyalar", callback_data: "menu" }]
      ]
    }
  };

  await sendTelegramMessage(chatId, text, keyboard);
}

async function handleContact(chatId: number) {
  const { data: settings } = await supabase
    .from('site_settings')
    .select('setting_key, setting_value')
    .in('setting_key', ['contact_phone', 'contact_email', 'contact_address', 'working_hours']);

  const settingsMap: Record<string, string> = {};
  settings?.forEach(s => {
    settingsMap[s.setting_key] = s.setting_value;
  });

  const text = `📞 <b>Bog'lanish</b>

📱 Telefon: ${settingsMap.contact_phone || '+998 90 123 45 67'}
📧 Email: ${settingsMap.contact_email || 'info@bellavista.uz'}
📍 Manzil: ${settingsMap.contact_address || 'Toshkent shahri'}
🕐 Ish vaqti: ${settingsMap.working_hours || '10:00 - 22:00'}`;

  const keyboard = {
    reply_markup: {
      inline_keyboard: [
        [{ text: "📞 Qo'ng'iroq qilish", url: `tel:${settingsMap.contact_phone || '+998901234567'}` }],
        [{ text: "🌐 Kontakt sahifasi", web_app: { url: `${SITE_URL}/contact` } }],
        [{ text: "🔙 Orqaga", callback_data: "back_to_main" }]
      ]
    }
  };

  await sendTelegramMessage(chatId, text, keyboard);
}

async function handleDelivery(chatId: number) {
  const text = `🚚 <b>Yetkazib berish</b>

📦 Biz Toshkent bo'ylab yetkazib beramiz!

⏰ Yetkazib berish vaqti: 30-60 daqiqa
💰 Minimal buyurtma: 50,000 so'm
🆓 100,000 so'mdan yuqori buyurtmalarga yetkazib berish bepul!

To'lov usullari:
💵 Naqd pul
💳 Payme, Click, Uzum Bank`;

  const keyboard = {
    reply_markup: {
      inline_keyboard: [
        [{ text: "📋 Batafsil", web_app: { url: `${SITE_URL}/delivery` } }],
        [{ text: "🛒 Buyurtma berish", web_app: { url: `${SITE_URL}/menu` } }],
        [{ text: "🔙 Orqaga", callback_data: "back_to_main" }]
      ]
    }
  };

  await sendTelegramMessage(chatId, text, keyboard);
}

async function handleLocation(chatId: number) {
  const { data: settings } = await supabase
    .from('site_settings')
    .select('setting_key, setting_value')
    .eq('setting_key', 'contact_address');

  const address = settings?.[0]?.setting_value || 'Toshkent shahri, Amir Temur ko\'chasi 1';

  const text = `📍 <b>Bizning manzil</b>

${address}

Bizga tashrif buyuring va mazali taomlarimizdan bahramand bo'ling!`;

  const keyboard = {
    reply_markup: {
      inline_keyboard: [
        [{ text: "🗺️ Xaritada ko'rish", url: `https://maps.google.com/?q=${encodeURIComponent(address)}` }],
        [{ text: "🔙 Orqaga", callback_data: "back_to_main" }]
      ]
    }
  };

  await sendTelegramMessage(chatId, text, keyboard);
}

async function handleAbout(chatId: number) {
  const text = `ℹ️ <b>Bella Vista Restaurant</b>

🍽️ Biz 2010-yildan beri sizga eng sifatli va mazali taomlarni taqdim etib kelmoqdamiz.

⭐ Yuqori sifatli mahsulotlar
👨‍🍳 Tajribali oshpazlar
🏠 Qulay muhit
🚚 Tez yetkazib berish

Bizning maqsadimiz - har bir mijozni mamnun qilish!`;

  const keyboard = {
    reply_markup: {
      inline_keyboard: [
        [{ text: "📖 Batafsil", web_app: { url: `${SITE_URL}/about` } }],
        [{ text: "🔙 Orqaga", callback_data: "back_to_main" }]
      ]
    }
  };

  await sendTelegramMessage(chatId, text, keyboard);
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    console.log('Received webhook:', JSON.stringify(body));

    // Handle callback queries (button clicks)
    if (body.callback_query) {
      const chatId = body.callback_query.message.chat.id;
      const data = body.callback_query.data;
      
      console.log('Callback query:', data);

      if (data === 'menu') {
        await handleMenu(chatId);
      } else if (data.startsWith('category_')) {
        const categoryId = data.replace('category_', '');
        await handleCategory(chatId, categoryId);
      } else if (data === 'contact') {
        await handleContact(chatId);
      } else if (data === 'delivery') {
        await handleDelivery(chatId);
      } else if (data === 'location') {
        await handleLocation(chatId);
      } else if (data === 'about') {
        await handleAbout(chatId);
      } else if (data === 'back_to_main') {
        await handleStart(chatId, body.callback_query.from.first_name || 'Mehmon');
      }

      // Answer callback query
      await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/answerCallbackQuery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ callback_query_id: body.callback_query.id })
      });
    }

    // Handle messages
    if (body.message) {
      const chatId = body.message.chat.id;
      const text = body.message.text;
      const firstName = body.message.from?.first_name || 'Mehmon';

      console.log('Message received:', text);

      if (text === '/start') {
        await handleStart(chatId, firstName);
      } else if (text === '/menu') {
        await handleMenu(chatId);
      } else if (text === '/contact') {
        await handleContact(chatId);
      } else if (text === '/delivery') {
        await handleDelivery(chatId);
      } else if (text === '/about') {
        await handleAbout(chatId);
      } else {
        // Default response
        const keyboard = {
          reply_markup: {
            inline_keyboard: [
              [{ text: "🌐 Saytga o'tish", web_app: { url: SITE_URL } }],
              [{ text: "📋 Menyu", callback_data: "menu" }]
            ]
          }
        };
        await sendTelegramMessage(chatId, 
          "Kechirasiz, bu buyruqni tushunmadim. Quyidagi tugmalardan foydalaning:", 
          keyboard
        );
      }
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: unknown) {
    console.error('Error processing webhook:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
