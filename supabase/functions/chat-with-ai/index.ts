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
    IMPORTANT: Return ONLY a raw JSON object, do not wrap it in markdown code blocks or any other formatting.
    Your response must be a valid JSON object with exactly these three fields:
    {
      "frontend": "// React component code with proper imports and TypeScript types",
      "backend": "// Any necessary backend code or API endpoints",
      "database": "// Required database schema or modifications"
    }
    Make sure all code is properly formatted, includes necessary imports, and follows best practices.
    If a component is not needed, use an empty string for that field.
    DO NOT include any markdown formatting, code blocks, or additional text - ONLY the JSON object.`

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

    // Log the actual content for debugging
    const content = data.choices[0].message.content
    console.log('Raw AI response content:', content)

    try {
      // Clean the content by removing any markdown formatting
      const cleanContent = content
        .replace(/```json\n?/g, '') // Remove ```json
        .replace(/```\n?/g, '')     // Remove closing ```
        .trim()                     // Remove any extra whitespace

      console.log('Cleaned content:', cleanContent)

      // Try to parse the cleaned content as JSON
      const parsedContent = JSON.parse(cleanContent)
      console.log('Parsed content:', parsedContent)
      
      // Validate the response format
      if (typeof parsedContent !== 'object' || parsedContent === null) {
        throw new Error('AI response is not a JSON object')
      }

      if (!('frontend' in parsedContent) || !('backend' in parsedContent) || !('database' in parsedContent)) {
        throw new Error('AI response is missing required fields')
      }

      // If validation passes, return the original response
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError)
      console.error('Failed to parse content:', content)
      throw new Error(`Failed to parse AI response as JSON: ${parseError.message}`)
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