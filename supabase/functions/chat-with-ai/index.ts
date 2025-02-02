import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import "https://deno.land/x/xhr@0.1.0/mod.ts"

const DEEPSEEK_API_KEY = Deno.env.get('DEEPSEEK_API_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Validate API key exists
    if (!DEEPSEEK_API_KEY) {
      console.error('DEEPSEEK_API_KEY is not set')
      throw new Error('DeepSeek API key is not configured')
    }

    const { message } = await req.json()
    console.log('Received message:', message)

    if (!message || typeof message !== 'string') {
      throw new Error('Invalid message format. Expected a string.')
    }

    console.log('Making request to DeepSeek API...')
    
    const systemPrompt = `You are an AI that generates full-stack web applications using React, Vite, TypeScript, and Tailwind CSS. 
    When generating code, always return a JSON response with the following structure:
    {
      "frontend": "// React component code here",
      "backend": "// Backend code here if needed",
      "database": "// Database schema if needed"
    }`

    const requestBody = {
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        { 
          role: "user", 
          content: message 
        }
      ],
      model: "deepseek-chat",
      temperature: 0.7,
      max_tokens: 4000,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0
    }

    console.log('Request body:', JSON.stringify(requestBody, null, 2))

    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })

    console.log('DeepSeek API response status:', response.status)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('DeepSeek API error details:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
        headers: Object.fromEntries(response.headers.entries())
      })
      
      throw new Error(`DeepSeek API error: ${response.status} ${response.statusText}\nResponse: ${errorText}`)
    }

    const data = await response.json()
    console.log('DeepSeek API response data:', data)

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error in chat-with-ai function:', error)
    
    // Log the full error details
    if (error instanceof Error) {
      console.error('Error name:', error.name)
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
    }
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.stack,
        timestamp: new Date().toISOString()
      }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})