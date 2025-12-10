import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const SITE_URL = "https://wpvhlrsehnxwetjwolhd.lovable.app";

const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

// Temporary storage for order process
const orderStates: Map<number, { step: string; data: any }> = new Map();

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

async function editTelegramMessage(chatId: number, messageId: number, text: string, options: any = {}) {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/editMessageText`;
  
  const body: any = {
    chat_id: chatId,
    message_id: messageId,
    text: text,
    parse_mode: 'HTML',
    ...options
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  return await response.json();
}

async function getCategories() {
  const { data, error } = await supabase
    .from('categories')
    .select('id, name, slug')
    .eq('is_active', true)
    .order('sort_order');
  
  if (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
  return data || [];
}

async function getProducts(categoryId?: string) {
  let query = supabase
    .from('products')
    .select('id, name, price, description, image_url, discount_price')
    .eq('is_active', true)
    .order('name');

  if (categoryId) {
    query = query.eq('category_id', categoryId);
  }

  const { data, error } = await query.limit(20);
  
  if (error) {
    console.error('Error fetching products:', error);
    return [];
  }
  return data || [];
}

async function getProduct(productId: string) {
  const { data, error } = await supabase
    .from('products')
    .select('id, name, price, description, image_url, discount_price')
    .eq('id', productId)
    .maybeSingle();
  
  if (error) {
    console.error('Error fetching product:', error);
    return null;
  }
  return data;
}

async function getCartItems(chatId: number) {
  const { data, error } = await supabase
    .from('telegram_cart_items')
    .select(`
      id,
      quantity,
      product_id,
      products (
        id,
        name,
        price,
        discount_price,
        image_url
      )
    `)
    .eq('telegram_chat_id', chatId);
  
  if (error) {
    console.error('Error fetching cart:', error);
    return [];
  }
  return data || [];
}

async function addToCart(chatId: number, productId: string, quantity: number = 1) {
  // Check if item already exists
  const { data: existing } = await supabase
    .from('telegram_cart_items')
    .select('id, quantity')
    .eq('telegram_chat_id', chatId)
    .eq('product_id', productId)
    .maybeSingle();

  if (existing) {
    // Update quantity
    const { error } = await supabase
      .from('telegram_cart_items')
      .update({ quantity: existing.quantity + quantity })
      .eq('id', existing.id);
    return !error;
  } else {
    // Insert new item
    const { error } = await supabase
      .from('telegram_cart_items')
      .insert({
        telegram_chat_id: chatId,
        product_id: productId,
        quantity: quantity
      });
    return !error;
  }
}

async function updateCartItemQuantity(chatId: number, productId: string, change: number) {
  const { data: existing } = await supabase
    .from('telegram_cart_items')
    .select('id, quantity')
    .eq('telegram_chat_id', chatId)
    .eq('product_id', productId)
    .maybeSingle();

  if (!existing) return false;

  const newQuantity = existing.quantity + change;
  
  if (newQuantity <= 0) {
    // Remove item
    await supabase
      .from('telegram_cart_items')
      .delete()
      .eq('id', existing.id);
  } else {
    // Update quantity
    await supabase
      .from('telegram_cart_items')
      .update({ quantity: newQuantity })
      .eq('id', existing.id);
  }
  
  return true;
}

async function clearCart(chatId: number) {
  const { error } = await supabase
    .from('telegram_cart_items')
    .delete()
    .eq('telegram_chat_id', chatId);
  return !error;
}

async function createOrder(chatId: number, orderData: any) {
  const cartItems = await getCartItems(chatId);
  
  if (cartItems.length === 0) {
    return { success: false, message: "Savat bo'sh" };
  }

  let totalPrice = 0;
  const orderItems: any[] = [];

  for (const item of cartItems) {
    const product = item.products as any;
    const price = product.discount_price || product.price;
    const itemTotal = price * item.quantity;
    totalPrice += itemTotal;
    
    orderItems.push({
      product_id: product.id,
      product_name: product.name,
      quantity: item.quantity,
      price: price
    });
  }

  // Create order
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      user_fullname: orderData.name,
      phone: orderData.phone,
      address: orderData.address,
      total_price: totalPrice,
      notes: `Telegram orqali buyurtma (Chat ID: ${chatId})`,
      status: 'new',
      payment_type: orderData.payment_type || 'cash'
    })
    .select()
    .single();

  if (orderError) {
    console.error('Error creating order:', orderError);
    return { success: false, message: "Buyurtma yaratishda xatolik" };
  }

  // Create order items
  const orderItemsWithOrderId = orderItems.map(item => ({
    ...item,
    order_id: order.id
  }));

  const { error: itemsError } = await supabase
    .from('order_items')
    .insert(orderItemsWithOrderId);

  if (itemsError) {
    console.error('Error creating order items:', itemsError);
  }

  // Clear cart
  await clearCart(chatId);

  return { success: true, order, totalPrice };
}

// ============ HANDLERS ============

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
          { text: "🛒 Savat", callback_data: "cart" }
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
        [{ text: "🛒 Savatni ko'rish", callback_data: "cart" }],
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

  // Create keyboard with products
  const productButtons = products.map(product => {
    const price = product.discount_price || product.price;
    return [{ 
      text: `${product.name} - ${price?.toLocaleString()} so'm`, 
      callback_data: `product_${product.id}` 
    }];
  });

  const keyboard = {
    reply_markup: {
      inline_keyboard: [
        ...productButtons,
        [{ text: "🛒 Savatni ko'rish", callback_data: "cart" }],
        [{ text: "🔙 Kategoriyalar", callback_data: "menu" }]
      ]
    }
  };

  await sendTelegramMessage(chatId, "🍽️ <b>Mahsulotni tanlang:</b>", keyboard);
}

async function handleProduct(chatId: number, productId: string) {
  const product = await getProduct(productId);
  
  if (!product) {
    await sendTelegramMessage(chatId, "Mahsulot topilmadi.");
    return;
  }

  const price = product.discount_price || product.price;
  let text = `🍽️ <b>${product.name}</b>\n\n`;
  
  if (product.description) {
    text += `📝 ${product.description}\n\n`;
  }
  
  text += `💰 Narxi: <b>${price?.toLocaleString()} so'm</b>`;
  
  if (product.discount_price && product.price > product.discount_price) {
    text += ` <s>${product.price?.toLocaleString()}</s>`;
  }

  const keyboard = {
    reply_markup: {
      inline_keyboard: [
        [
          { text: "➖", callback_data: `qty_minus_${productId}` },
          { text: "1", callback_data: `qty_1_${productId}` },
          { text: "➕", callback_data: `qty_plus_${productId}` }
        ],
        [{ text: "🛒 Savatga qo'shish", callback_data: `add_${productId}_1` }],
        [{ text: "🔙 Orqaga", callback_data: "menu" }]
      ]
    }
  };

  await sendTelegramMessage(chatId, text, keyboard);
}

async function handleAddToCart(chatId: number, productId: string, quantity: number) {
  const success = await addToCart(chatId, productId, quantity);
  
  if (success) {
    const product = await getProduct(productId);
    const keyboard = {
      reply_markup: {
        inline_keyboard: [
          [{ text: "🛒 Savatni ko'rish", callback_data: "cart" }],
          [{ text: "📋 Xarid davom ettirish", callback_data: "menu" }]
        ]
      }
    };
    await sendTelegramMessage(chatId, 
      `✅ <b>${product?.name}</b> (${quantity} dona) savatga qo'shildi!`, 
      keyboard
    );
  } else {
    await sendTelegramMessage(chatId, "❌ Xatolik yuz berdi. Qaytadan urinib ko'ring.");
  }
}

async function handleCart(chatId: number) {
  const cartItems = await getCartItems(chatId);
  
  if (cartItems.length === 0) {
    const keyboard = {
      reply_markup: {
        inline_keyboard: [
          [{ text: "📋 Menyu", callback_data: "menu" }],
          [{ text: "🔙 Bosh sahifa", callback_data: "back_to_main" }]
        ]
      }
    };
    await sendTelegramMessage(chatId, "🛒 Savatingiz bo'sh\n\nMenyudan mahsulotlarni qo'shing!", keyboard);
    return;
  }

  let text = "🛒 <b>Sizning savatingiz:</b>\n\n";
  let totalPrice = 0;

  const itemButtons: any[] = [];

  for (const item of cartItems) {
    const product = item.products as any;
    const price = product.discount_price || product.price;
    const itemTotal = price * item.quantity;
    totalPrice += itemTotal;
    
    text += `📦 <b>${product.name}</b>\n`;
    text += `   ${item.quantity} x ${price?.toLocaleString()} = ${itemTotal?.toLocaleString()} so'm\n\n`;
    
    itemButtons.push([
      { text: `➖ ${product.name}`, callback_data: `cart_minus_${product.id}` },
      { text: `${item.quantity}`, callback_data: `cart_qty_${product.id}` },
      { text: `➕`, callback_data: `cart_plus_${product.id}` }
    ]);
  }

  text += `━━━━━━━━━━━━━━━\n`;
  text += `💰 <b>Jami: ${totalPrice?.toLocaleString()} so'm</b>`;

  const keyboard = {
    reply_markup: {
      inline_keyboard: [
        ...itemButtons,
        [{ text: "🗑️ Savatni tozalash", callback_data: "clear_cart" }],
        [{ text: "✅ Buyurtma berish", callback_data: "checkout" }],
        [{ text: "📋 Xarid davom ettirish", callback_data: "menu" }]
      ]
    }
  };

  await sendTelegramMessage(chatId, text, keyboard);
}

async function handleClearCart(chatId: number) {
  await clearCart(chatId);
  
  const keyboard = {
    reply_markup: {
      inline_keyboard: [
        [{ text: "📋 Menyu", callback_data: "menu" }],
        [{ text: "🔙 Bosh sahifa", callback_data: "back_to_main" }]
      ]
    }
  };
  
  await sendTelegramMessage(chatId, "🗑️ Savat tozalandi!", keyboard);
}

async function handleCheckout(chatId: number) {
  const cartItems = await getCartItems(chatId);
  
  if (cartItems.length === 0) {
    await handleCart(chatId);
    return;
  }

  orderStates.set(chatId, { step: 'name', data: {} });
  
  const keyboard = {
    reply_markup: {
      inline_keyboard: [
        [{ text: "❌ Bekor qilish", callback_data: "cart" }]
      ]
    }
  };
  
  await sendTelegramMessage(chatId, 
    "📝 <b>Buyurtma berish</b>\n\nIsmingizni kiriting:", 
    keyboard
  );
}

async function handleOrderStep(chatId: number, text: string) {
  const state = orderStates.get(chatId);
  
  if (!state) return false;

  if (state.step === 'name') {
    state.data.name = text;
    state.step = 'phone';
    orderStates.set(chatId, state);
    
    await sendTelegramMessage(chatId, "📱 Telefon raqamingizni kiriting:\n\nMasalan: +998901234567");
    return true;
  }
  
  if (state.step === 'phone') {
    // Simple phone validation
    const phone = text.replace(/\s/g, '');
    if (phone.length < 9) {
      await sendTelegramMessage(chatId, "❌ Telefon raqami noto'g'ri. Qaytadan kiriting:");
      return true;
    }
    
    state.data.phone = phone;
    state.step = 'address';
    orderStates.set(chatId, state);
    
    await sendTelegramMessage(chatId, "📍 Manzilingizni kiriting:\n\nTo'liq manzilni yozing");
    return true;
  }
  
  if (state.step === 'address') {
    state.data.address = text;
    state.step = 'payment';
    orderStates.set(chatId, state);
    
    const keyboard = {
      reply_markup: {
        inline_keyboard: [
          [{ text: "💵 Naqd pul", callback_data: "pay_cash" }],
          [{ text: "💳 Payme", callback_data: "pay_payme" }],
          [{ text: "💳 Click", callback_data: "pay_click" }],
          [{ text: "❌ Bekor qilish", callback_data: "cart" }]
        ]
      }
    };
    
    await sendTelegramMessage(chatId, "💳 To'lov usulini tanlang:", keyboard);
    return true;
  }
  
  return false;
}

async function handlePaymentSelection(chatId: number, paymentType: string) {
  const state = orderStates.get(chatId);
  
  if (!state || state.step !== 'payment') {
    await handleCart(chatId);
    return;
  }

  state.data.payment_type = paymentType;
  
  // Create order
  const result = await createOrder(chatId, state.data);
  
  orderStates.delete(chatId);
  
  if (result.success) {
    const paymentText = paymentType === 'cash' ? 'Naqd pul' : 
                        paymentType === 'payme' ? 'Payme' : 'Click';
    
    let text = `✅ <b>Buyurtma qabul qilindi!</b>\n\n`;
    text += `👤 Ism: ${state.data.name}\n`;
    text += `📱 Telefon: ${state.data.phone}\n`;
    text += `📍 Manzil: ${state.data.address}\n`;
    text += `💳 To'lov: ${paymentText}\n`;
    text += `💰 Summa: <b>${result.totalPrice?.toLocaleString()} so'm</b>\n\n`;
    text += `⏰ Yetkazib berish vaqti: 30-60 daqiqa\n\n`;
    text += `Tez orada siz bilan bog'lanamiz! 📞`;

    const keyboard = {
      reply_markup: {
        inline_keyboard: [
          [{ text: "📋 Yangi buyurtma", callback_data: "menu" }],
          [{ text: "🔙 Bosh sahifa", callback_data: "back_to_main" }]
        ]
      }
    };
    
    await sendTelegramMessage(chatId, text, keyboard);
  } else {
    await sendTelegramMessage(chatId, `❌ Xatolik: ${result.message}`);
  }
}

async function handleContact(chatId: number) {
  const { data: settings } = await supabase
    .from('site_settings')
    .select('key, value')
    .in('key', ['contact_phone', 'contact_email', 'contact_address', 'working_hours']);

  const settingsMap: Record<string, string> = {};
  settings?.forEach(s => {
    settingsMap[s.key] = s.value || '';
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
💳 Payme, Click`;

  const keyboard = {
    reply_markup: {
      inline_keyboard: [
        [{ text: "🛒 Buyurtma berish", callback_data: "menu" }],
        [{ text: "🔙 Orqaga", callback_data: "back_to_main" }]
      ]
    }
  };

  await sendTelegramMessage(chatId, text, keyboard);
}

async function handleLocation(chatId: number) {
  const { data: settings } = await supabase
    .from('site_settings')
    .select('key, value')
    .eq('key', 'contact_address');

  const address = settings?.[0]?.value || 'Toshkent shahri, Amir Temur ko\'chasi 1';

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
        [{ text: "🔙 Orqaga", callback_data: "back_to_main" }]
      ]
    }
  };

  await sendTelegramMessage(chatId, text, keyboard);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    console.log('Received webhook:', JSON.stringify(body));

    // Handle callback queries (button clicks)
    if (body.callback_query) {
      const chatId = body.callback_query.message.chat.id;
      const messageId = body.callback_query.message.message_id;
      const data = body.callback_query.data;
      const firstName = body.callback_query.from?.first_name || 'Mehmon';
      
      console.log('Callback query:', data);

      // Clear order state if user navigates away
      if (!data.startsWith('pay_') && orderStates.has(chatId)) {
        const state = orderStates.get(chatId);
        if (state?.step !== 'payment') {
          orderStates.delete(chatId);
        }
      }

      if (data === 'menu') {
        await handleMenu(chatId);
      } else if (data.startsWith('category_')) {
        const categoryId = data.replace('category_', '');
        await handleCategory(chatId, categoryId);
      } else if (data.startsWith('product_')) {
        const productId = data.replace('product_', '');
        await handleProduct(chatId, productId);
      } else if (data.startsWith('add_')) {
        const parts = data.split('_');
        const productId = parts[1];
        const quantity = parseInt(parts[2]) || 1;
        await handleAddToCart(chatId, productId, quantity);
      } else if (data.startsWith('cart_minus_')) {
        const productId = data.replace('cart_minus_', '');
        await updateCartItemQuantity(chatId, productId, -1);
        await handleCart(chatId);
      } else if (data.startsWith('cart_plus_')) {
        const productId = data.replace('cart_plus_', '');
        await updateCartItemQuantity(chatId, productId, 1);
        await handleCart(chatId);
      } else if (data === 'cart') {
        await handleCart(chatId);
      } else if (data === 'clear_cart') {
        await handleClearCart(chatId);
      } else if (data === 'checkout') {
        await handleCheckout(chatId);
      } else if (data.startsWith('pay_')) {
        const paymentType = data.replace('pay_', '');
        await handlePaymentSelection(chatId, paymentType);
      } else if (data === 'contact') {
        await handleContact(chatId);
      } else if (data === 'delivery') {
        await handleDelivery(chatId);
      } else if (data === 'location') {
        await handleLocation(chatId);
      } else if (data === 'about') {
        await handleAbout(chatId);
      } else if (data === 'back_to_main') {
        await handleStart(chatId, firstName);
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

      // Check if user is in order process
      if (orderStates.has(chatId)) {
        const handled = await handleOrderStep(chatId, text);
        if (handled) {
          return new Response(JSON.stringify({ ok: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      }

      if (text === '/start') {
        await handleStart(chatId, firstName);
      } else if (text === '/menu') {
        await handleMenu(chatId);
      } else if (text === '/cart' || text === '/savat') {
        await handleCart(chatId);
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
              [{ text: "📋 Menyu", callback_data: "menu" }],
              [{ text: "🛒 Savat", callback_data: "cart" }]
            ]
          }
        };
        await sendTelegramMessage(chatId, 
          "Quyidagi tugmalardan foydalaning:", 
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
