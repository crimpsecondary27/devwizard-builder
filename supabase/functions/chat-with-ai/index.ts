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
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          {
            role: "system",
            content: `You are an AI that generates full-stack web applications using React, Vite, TypeScript, and Tailwind CSS. 
            When generating code, always return a JSON response with the following structure:
            {
              "frontend": "// React component code here",
              "backend": "// Backend code here if needed",
              "database": "// Database schema if needed"
            }`
          },
          { 
            role: "user", 
            content: message 
          }
        ],
        model: "deepseek-coder-33b-instruct",
        temperature: 0.7,
        max_tokens: 4000,
        stream: false
      }),
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
      
      if (response.status === 401) {
        throw new Error('Invalid DeepSeek API key. Please check your configuration.')
      }
      
      throw new Error(`DeepSeek API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    console.log('DeepSeek API response data:', data)

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error in chat-with-ai function:', error)
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