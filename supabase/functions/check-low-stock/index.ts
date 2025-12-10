import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const telegramToken = Deno.env.get('TELEGRAM_BOT_TOKEN')
    
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get low stock ingredients
    const { data: ingredients, error } = await supabase
      .from('ingredients')
      .select('id, name, current_stock, min_stock, unit')
      .eq('is_active', true)

    if (error) throw error

    const lowStockItems = ingredients?.filter(i => i.current_stock <= i.min_stock) || []
    
    if (lowStockItems.length === 0) {
      console.log('No low stock items found')
      return new Response(
        JSON.stringify({ success: true, message: 'No low stock items', count: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get admin chat IDs from site_settings
    const { data: settings } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'telegram_admin_chat_ids')
      .maybeSingle()

    const chatIds = settings?.value?.split(',').map((id: string) => id.trim()).filter(Boolean) || []

    if (chatIds.length === 0 || !telegramToken) {
      console.log('No Telegram configuration found')
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Low stock detected but no Telegram config', 
          lowStockCount: lowStockItems.length 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Build message
    const message = `⚠️ *KAM QOLGAN MAHSULOTLAR*\n\n${lowStockItems.map(item => 
      `• *${item.name}*: ${item.current_stock} ${item.unit} (min: ${item.min_stock} ${item.unit})`
    ).join('\n')}\n\n📊 Jami: ${lowStockItems.length} ta mahsulot`

    // Send to all admin chats
    const results = await Promise.all(chatIds.map(async (chatId: string) => {
      try {
        const response = await fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: message,
            parse_mode: 'Markdown'
          })
        })
        const result = await response.json()
        return { chatId, success: result.ok }
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error'
        console.error(`Failed to send to ${chatId}:`, err)
        return { chatId, success: false, error: errorMessage }
      }
    }))

    // Log notifications
    for (const item of lowStockItems) {
      await supabase.from('low_stock_notifications').insert({
        ingredient_id: item.id,
        current_stock: item.current_stock,
        min_stock: item.min_stock,
        notification_type: 'telegram'
      })
    }

    console.log('Low stock notifications sent:', results)

    return new Response(
      JSON.stringify({ 
        success: true, 
        lowStockCount: lowStockItems.length,
        notificationsSent: results.filter(r => r.success).length 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})