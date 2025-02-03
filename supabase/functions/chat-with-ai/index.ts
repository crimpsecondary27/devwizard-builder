import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import "https://deno.land/x/xhr@0.1.0/mod.ts"

const DEEPSEEK_API_KEY = Deno.env.get('DEEPSEEK_API_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  console.log('Received request:', {
    method: req.method,
    url: req.url,
    headers: Object.fromEntries(req.headers.entries())
  })

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    if (!DEEPSEEK_API_KEY) {
      console.error('DEEPSEEK_API_KEY is not set')
      throw new Error('DeepSeek API key is not configured')
    }

    // Validate request body
    const rawBody = await req.text()
    console.log('Raw request body:', rawBody)

    if (!rawBody) {
      throw new Error('Request body is empty')
    }

    let requestData
    try {
      requestData = JSON.parse(rawBody)
      console.log('Parsed request data:', requestData)
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError)
      throw new Error('Invalid JSON in request body')
    }

    const { message } = requestData
    if (!message || typeof message !== 'string') {
      throw new Error('Invalid message format. Expected a string.')
    }

    const systemPrompt = `You are an AI that generates full-stack web applications using React, Vite, TypeScript, and Tailwind CSS. 
When a user requests a project setup or feature, analyze their request and generate the necessary code components.
For project setup requests, generate a complete project structure with:
- Vite + React + TypeScript configuration
- Tailwind CSS setup
- shadcn-ui components
- Proper TypeScript types
- Basic folder structure (src/components, src/pages, etc.)

IMPORTANT: Return ONLY a raw JSON object, do not wrap it in markdown code blocks or any other formatting.
Your response must be a valid JSON object with exactly these three fields:
{
  "frontend": "// Complete frontend code including project structure",
  "backend": "// Any necessary backend code or API endpoints",
  "database": "// Required database schema or modifications"
}
Make sure all code is properly formatted, includes necessary imports, and follows best practices.
If a component is not needed, use an empty string for that field.
DO NOT include any markdown formatting, code blocks, or additional text - ONLY the JSON object.`

    console.log('Making request to DeepSeek API')

    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message }
        ],
        model: "deepseek-chat",
        temperature: 0.7,
        max_tokens: 4000,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0
      })
    })

    console.log('DeepSeek API response status:', response.status)

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
    console.log('DeepSeek API response:', JSON.stringify(data, null, 2))

    if (!data.choices?.[0]?.message?.content) {
      console.error('Invalid response format from DeepSeek API:', data)
      throw new Error('Invalid response format from DeepSeek API')
    }

    let content = data.choices[0].message.content.trim()
    console.log('Raw AI response content:', content)

    // Clean and normalize the content
    content = content
      .replace(/```json\s*/g, '')
      .replace(/```\s*$/g, '')
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
      .replace(/\\/g, '\\\\')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(/\t/g, '\\t')
      .trim()

    console.log('Cleaned content:', content)

    try {
      // First parsing attempt
      const parsedContent = JSON.parse(content)
      console.log('Successfully parsed content:', parsedContent)

      if (!parsedContent || typeof parsedContent !== 'object') {
        throw new Error('AI response is not a JSON object')
      }

      if (!('frontend' in parsedContent) || !('backend' in parsedContent) || !('database' in parsedContent)) {
        throw new Error('AI response is missing required fields')
      }

      return new Response(
        JSON.stringify({
          choices: [{
            message: {
              content: JSON.stringify(parsedContent)
            }
          }]
        }),
        {
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json'
          }
        }
      )
    } catch (firstParseError) {
      console.error('First parse attempt failed:', firstParseError)
      
      try {
        // Additional cleaning for second attempt
        content = content
          .replace(/^[^{]*{/, '{')  // Remove any text before first {
          .replace(/}[^}]*$/, '}')  // Remove any text after last }
          .replace(/([{,]\s*)([a-zA-Z0-9_]+)(?=\s*:)/g, '$1"$2"') // Add quotes to property names
          .replace(/:\s*'([^']*)'(?=[,}])/g, ':"$1"')  // Replace single quotes with double quotes
          .replace(/,\s*}/g, '}')  // Remove trailing commas
          
        console.log('Content after additional cleaning:', content)
        
        const parsedContent = JSON.parse(content)
        console.log('Successfully parsed after additional cleaning:', parsedContent)

        return new Response(
          JSON.stringify({
            choices: [{
              message: {
                content: JSON.stringify(parsedContent)
              }
            }]
          }),
          {
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json'
            }
          }
        )
      } catch (secondParseError) {
        console.error('Second parse attempt failed:', secondParseError)
        throw new Error('Failed to parse AI response after multiple attempts')
      }
    }
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