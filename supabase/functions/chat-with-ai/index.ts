import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import "https://deno.land/x/xhr@0.1.0/mod.ts"

const DEEPSEEK_API_KEY = Deno.env.get('DEEPSEEK_API_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
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
    When a user requests a feature or application, analyze their request and generate the necessary code components.
    Always return your response in this exact JSON format:
    {
      "frontend": "// React component code with proper imports and TypeScript types",
      "backend": "// Any necessary backend code or API endpoints",
      "database": "// Required database schema or modifications"
    }
    Make sure all code is properly formatted, includes necessary imports, and follows best practices.
    If the user's request doesn't require one of these components, include an empty string for that field.`

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

    // Try to parse the response content as JSON
    try {
      const content = data.choices[0].message.content
      const parsedContent = JSON.parse(content)
      
      // Validate the response format
      if (!parsedContent.frontend && !parsedContent.backend && !parsedContent.database) {
        throw new Error('Invalid response format from AI')
      }

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError)
      throw new Error('Failed to parse AI response as JSON')
    }
  } catch (error) {
    console.error('Error in chat-with-ai function:', error)
    
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