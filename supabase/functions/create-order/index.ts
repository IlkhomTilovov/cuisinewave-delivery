import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Rate limiting: store IP -> timestamp mapping
const rateLimitMap = new Map<string, number[]>()
const RATE_LIMIT_WINDOW = 60000 // 1 minute
const MAX_REQUESTS = 5 // 5 orders per minute per IP

// Uzbekistan phone validation
const phoneRegex = /^\+998[0-9]{9}$/

const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN')
const TELEGRAM_GROUP_CHAT_ID = Deno.env.get('TELEGRAM_GROUP_CHAT_ID')

interface OrderItem {
  product_id: string
  product_name: string
  price: number
  quantity: number
}

interface OrderRequest {
  user_fullname: string
  phone: string
  address: string
  delivery_zone?: string
  payment_type?: string
  notes?: string
  items: OrderItem[]
}

function validatePhone(phone: string): boolean {
  const cleaned = phone.replace(/[\s-]/g, '')
  return phoneRegex.test(cleaned)
}

function cleanPhone(phone: string): string {
  return phone.replace(/[\s-]/g, '')
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const timestamps = rateLimitMap.get(ip) || []
  const recentTimestamps = timestamps.filter(t => now - t < RATE_LIMIT_WINDOW)
  
  if (recentTimestamps.length >= MAX_REQUESTS) {
    return false
  }
  
  recentTimestamps.push(now)
  rateLimitMap.set(ip, recentTimestamps)
  return true
}

function formatPrice(price: number): string {
  return price.toLocaleString('uz-UZ') + ' so\'m'
}

function getPaymentTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    'cash': '💵 Naqd',
    'card': '💳 Karta',
    'payme': '📱 Payme',
    'click': '📱 Click'
  }
  return labels[type] || type
}

async function sendTelegramNotification(order: any, items: OrderItem[]) {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_GROUP_CHAT_ID) {
    console.log('Telegram credentials not configured, skipping notification')
    return
  }

  try {
    const itemsList = items.map((item, i) => 
      `   ${i + 1}. ${item.product_name} x${item.quantity} = ${formatPrice(item.price * item.quantity)}`
    ).join('\n')

    const message = `🆕 <b>YANGI BUYURTMA #${order.id.slice(0, 8)}</b>

👤 <b>Mijoz:</b> ${order.user_fullname}
📞 <b>Telefon:</b> ${order.phone}
📍 <b>Manzil:</b> ${order.address}
${order.delivery_zone ? `🗺 <b>Hudud:</b> ${order.delivery_zone}` : ''}

📦 <b>Mahsulotlar:</b>
${itemsList}

💰 <b>Jami:</b> ${formatPrice(order.total_price)}
💳 <b>To'lov:</b> ${getPaymentTypeLabel(order.payment_type)}
${order.notes ? `📝 <b>Izoh:</b> ${order.notes}` : ''}

⏰ <b>Vaqt:</b> ${new Date().toLocaleString('uz-UZ', { timeZone: 'Asia/Tashkent' })}`

    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_GROUP_CHAT_ID,
        text: message,
        parse_mode: 'HTML',
      }),
    })

    const result = await response.json()
    console.log('Telegram notification result:', result)
  } catch (error) {
    console.error('Error sending Telegram notification:', error)
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const clientIP = req.headers.get('x-forwarded-for') || 
                     req.headers.get('x-real-ip') || 
                     'unknown'
    
    console.log(`Order request from IP: ${clientIP}`)

    if (!checkRateLimit(clientIP)) {
      console.log(`Rate limit exceeded for IP: ${clientIP}`)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Juda ko\'p so\'rov. Iltimos, 1 daqiqa kutib turing.' 
        }),
        { 
          status: 429, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const body: OrderRequest = await req.json()
    console.log('Order request body:', JSON.stringify(body, null, 2))

    const errors: string[] = []

    if (!body.user_fullname || body.user_fullname.trim().length < 2) {
      errors.push('Ism kamida 2 ta belgidan iborat bo\'lishi kerak')
    }

    if (!body.user_fullname || body.user_fullname.trim().length > 100) {
      errors.push('Ism 100 ta belgidan oshmasligi kerak')
    }

    if (!body.phone) {
      errors.push('Telefon raqam majburiy')
    } else if (!validatePhone(body.phone)) {
      errors.push('Telefon raqam formati noto\'g\'ri. Format: +998XXXXXXXXX')
    }

    if (!body.address || body.address.trim().length < 10) {
      errors.push('Manzil kamida 10 ta belgidan iborat bo\'lishi kerak')
    }

    if (!body.address || body.address.trim().length > 500) {
      errors.push('Manzil 500 ta belgidan oshmasligi kerak')
    }

    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
      errors.push('Buyurtma bo\'sh bo\'lmasligi kerak')
    }

    if (body.items && Array.isArray(body.items)) {
      for (let i = 0; i < body.items.length; i++) {
        const item = body.items[i]
        if (!item.product_name || item.product_name.trim().length === 0) {
          errors.push(`Mahsulot #${i + 1} nomi bo'sh`)
        }
        if (!item.price || item.price <= 0) {
          errors.push(`Mahsulot #${i + 1} narxi noto'g'ri`)
        }
        if (!item.quantity || item.quantity <= 0 || item.quantity > 100) {
          errors.push(`Mahsulot #${i + 1} soni noto'g'ri (1-100 oralig'ida bo'lishi kerak)`)
        }
      }
    }

    const validPaymentTypes = ['cash', 'card', 'payme', 'click']
    if (body.payment_type && !validPaymentTypes.includes(body.payment_type)) {
      errors.push('To\'lov turi noto\'g\'ri')
    }

    if (body.notes && body.notes.length > 500) {
      errors.push('Izoh 500 ta belgidan oshmasligi kerak')
    }

    if (errors.length > 0) {
      console.log('Validation errors:', errors)
      return new Response(
        JSON.stringify({ success: false, errors }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const totalPrice = body.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_fullname: body.user_fullname.trim(),
        phone: cleanPhone(body.phone),
        address: body.address.trim(),
        delivery_zone: body.delivery_zone?.trim() || null,
        payment_type: body.payment_type || 'cash',
        notes: body.notes?.trim() || null,
        total_price: totalPrice,
        status: 'new'
      })
      .select()
      .single()

    if (orderError) {
      console.error('Order creation error:', orderError)
      return new Response(
        JSON.stringify({ success: false, error: 'Buyurtma yaratishda xatolik' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('Order created:', order.id)

    const orderItems = body.items.map(item => ({
      order_id: order.id,
      product_id: item.product_id || null,
      product_name: item.product_name.trim(),
      price: item.price,
      quantity: item.quantity
    }))

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems)

    if (itemsError) {
      console.error('Order items creation error:', itemsError)
      await supabase.from('orders').delete().eq('id', order.id)
      return new Response(
        JSON.stringify({ success: false, error: 'Buyurtma mahsulotlarini saqlashda xatolik' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('Order items created successfully')

    // Send Telegram notification in background
    sendTelegramNotification(order, body.items).catch(err => 
      console.error('Failed to send Telegram notification:', err)
    )

    return new Response(
      JSON.stringify({ 
        success: true, 
        order_id: order.id,
        message: 'Buyurtmangiz qabul qilindi!' 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ success: false, error: 'Kutilmagan xatolik yuz berdi' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
