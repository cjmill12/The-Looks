// netlify/functions/tryon.mjs

// 🚨 FINAL FIX: Use ES Module syntax (import/export) which is the most reliable
// way to get the correct constructor in modern environments.
import { GoogleGenAI } from '@google/genai';

// Helper function to create the Part object for image input
function base64ToGenerativePart(base64Data, mimeType) {
  return {
    inlineData: {
      data: base64Data,
      mimeType
    },
  };
}

// Handler must be exported as a named 'handler' function for Netlify
export async function handler(event) {
  // Initialize the AI client INSIDE the handler.
  const ai = new GoogleGenAI({}); 

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { baseImage, prompt } = JSON.parse(event.body);

    if (!baseImage || !prompt) {
      return { statusCode: 400, body: 'Missing baseImage or prompt in request body.' };
    }

    const imagePart = base64ToGenerativePart(baseImage, "image/jpeg");

    // Call the Nano Banana (Gemini 2.5 Flash Image) model
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: [
        imagePart,
        { text: prompt },
      ],
    });
    
    const generatedImageBase64 = response.candidates[0].content.parts[0].inlineData.data;

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
      body: JSON.stringify({ error: `Failed to process image with AI model: ${error.message}` }),
    };
  }
}
