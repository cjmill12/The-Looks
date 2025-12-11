// netlify/functions/tryon.mjs

import { GoogleGenAI } from '@google/genai';

// Helper function to create the Part object for image input
function base64ToGenerativePart(base64Data, mimeType) {
  // CRITICAL FIX: Ensure only the pure base64 string is sent to the API
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

// Handler must be exported as a named 'handler' function for Netlify
export async function handler(event) {
  
  const ai = new GoogleGenAI({ 
    // Ensure the Netlify environment variable is used
    apiKey: process.env.GEMINI_API_KEY 
  }); 

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    // We already fixed the frontend to send 'baseImage'
    const { baseImage, prompt } = JSON.parse(event.body);

    if (!baseImage || !prompt) {
      return { statusCode: 400, body: 'Missing baseImage or prompt in request body.' };
    }

    // Prepare the image part
    const imagePart = base64ToGenerativePart(baseImage, "image/jpeg");

    // 💡 FIX: Reverting to the high-capability image model you mentioned
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image', // Targeting the image editing model
      contents: [
        imagePart,
        { text: prompt }, // The explicit identity-preserving prompt from the last HTML fix
      ],
    });
    
    // 💡 CRITICAL FIX: The response structure that this specific image model uses
    // This is the structure that reliably holds the generated base64 image data.
    const generatedImageBase64 = response.candidates[0].content.parts[0].inlineData.data;

    if (!generatedImageBase64) {
        throw new Error("API responded successfully but did not return a generated image base64 string.");
    }
    
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        generatedImageBase64: generatedImageBase64,
      }),
    };

  } catch (error) {
    console.error('AI Processing Error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: `Netlify Function Error. Check API Key/Model response. Detail: ${error.message}`
      }),
    };
  }
}
