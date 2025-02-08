
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import "https://deno.land/x/xhr@0.1.0/mod.ts"

const DEEPSEEK_API_KEY = Deno.env.get('DEEPSEEK_API_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
}

serve(async (req) => {
  console.log('Received request:', {
    method: req.method,
    url: req.url,
    headers: Object.fromEntries(req.headers.entries())
  })

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 204, 
      headers: corsHeaders 
    })
  }

  try {
    if (!DEEPSEEK_API_KEY) {
      console.error('DEEPSEEK_API_KEY is not set')
      throw new Error('DeepSeek API key is not configured')
    }

    // Validate content type
    const contentType = req.headers.get('content-type')
    if (!contentType?.includes('application/json')) {
      throw new Error('Content-Type must be application/json')
    }

    // Get and validate request body
    let requestData
    try {
      const rawBody = await req.text()
      console.log('Raw request body:', rawBody)

      if (!rawBody) {
        throw new Error('Request body is empty')
      }

      requestData = JSON.parse(rawBody)
      console.log('Parsed request data:', requestData)
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError)
      throw new Error(`Invalid JSON in request body: ${parseError.message}`)
    }

    if (!requestData.message || typeof requestData.message !== 'string') {
      throw new Error('Invalid message format. Expected a string.')
    }

    console.log('Making request to DeepSeek API with message:', requestData.message)

    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          { role: "system", content: "You are an AI that generates full-stack web applications using React, Vite, TypeScript, and Tailwind CSS." },
          { role: "user", content: requestData.message }
        ],
        model: "deepseek-chat",
        temperature: 0.7,
        max_tokens: 4000,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('DeepSeek API error:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      })
      throw new Error(`DeepSeek API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    console.log('DeepSeek API response:', data)

    return new Response(JSON.stringify(data), {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json'
      }
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
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    )
  }
})
