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
  // Remove spaces and dashes
  const cleaned = phone.replace(/[\s-]/g, '')
  return phoneRegex.test(cleaned)
}

function cleanPhone(phone: string): string {
  return phone.replace(/[\s-]/g, '')
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const timestamps = rateLimitMap.get(ip) || []
  
  // Remove old timestamps
  const recentTimestamps = timestamps.filter(t => now - t < RATE_LIMIT_WINDOW)
  
  if (recentTimestamps.length >= MAX_REQUESTS) {
    return false
  }
  
  recentTimestamps.push(now)
  rateLimitMap.set(ip, recentTimestamps)
  return true
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Get client IP for rate limiting
    const clientIP = req.headers.get('x-forwarded-for') || 
                     req.headers.get('x-real-ip') || 
                     'unknown'
    
    console.log(`Order request from IP: ${clientIP}`)

    // Check rate limit
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

    // Validate required fields
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

    // Validate order items
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

    // Validate payment type
    const validPaymentTypes = ['cash', 'card', 'payme', 'click']
    if (body.payment_type && !validPaymentTypes.includes(body.payment_type)) {
      errors.push('To\'lov turi noto\'g\'ri')
    }

    // Validate notes length
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

    // Create Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Calculate total price
    const totalPrice = body.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)

    // Create order
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

    // Create order items
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
      // Rollback - delete the order
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
