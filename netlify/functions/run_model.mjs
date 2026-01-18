// netlify/functions/run_model.js
import { GoogleGenAI } from '@google/genai';

// Helper function to create the Part object for image input
function base64ToGenerativePart(base64Data, mimeType) {
  // Ensure only the pure base64 string is sent to the API
  const cleanBase64 = base64Data.startsWith('data:') 
    ? base64Data.split(',')[1] 
    : base64Data;
  return {
    inlineData: {
      data: cleanBase64,
      mimeType
    },
  };
}

// Handler must be exported as 'handler' for Netlify
export async function handler(event) {
  
  const ai = new GoogleGenAI({ 
    apiKey: process.env.GEMINI_API_KEY 
  }); 

  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  // Handle OPTIONS request for CORS
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }
  
  if (event.httpMethod !== 'POST') {
    return { 
      statusCode: 405, 
      headers,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  try {
    const { baseImage, prompt, negativePrompt } = JSON.parse(event.body);
    
    if (!baseImage || !prompt) {
      return { 
        statusCode: 400, 
        headers,
        body: JSON.stringify({ error: 'Missing baseImage or prompt in request body.' })
      };
    }

    console.log('Processing image with Gemini 2.5 Flash Image...');

    // Prepare the image part
    const imagePart = base64ToGenerativePart(baseImage, "image/jpeg");
    
    // Use the image editing model
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: [
        imagePart,
        { text: prompt },
      ],
    });
    
    // Extract the generated image
    const generatedImageBase64 = response.candidates[0].content.parts[0].inlineData.data;
    
    if (!generatedImageBase64) {
      throw new Error("API responded but did not return a generated image.");
    }
    
    console.log('Image generation successful');
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        generatedImageBase64: generatedImageBase64,
        success: true
      }),
    };

  } catch (error) {
    console.error('AI Processing Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to generate image',
        details: error.message
      }),
    };
  }
}
