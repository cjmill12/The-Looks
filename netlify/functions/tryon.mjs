// netlify/functions/tryon.mjs

// 1. Use ES Module syntax for reliable import/export
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
  
  // 2. FIX: Explicitly pass the API key from the environment to the constructor.
  const ai = new GoogleGenAI({ 
    apiKey: process.env.GEMINI_API_KEY 
  }); 

  // Basic method check
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    // We now extract negativePrompt as well, which is sent from the frontend
    const { baseImage, prompt, negativePrompt } = JSON.parse(event.body);

    if (!baseImage || !prompt) {
      return { statusCode: 400, body: 'Missing baseImage or prompt in request body.' };
    }

    // Prepare the image part (Gemini 2.5 Flash supports inline Base64)
    const imagePart = base64ToGenerativePart(baseImage, "image/jpeg");

    // CRITICAL FIX: Use the correct Imagen model for image-to-image editing
    const response = await ai.models.generateContent({
      model: 'imagen-3.0-generate-002', // The correct model ID for high-quality image generation/editing
      contents: [
        imagePart,
        { text: prompt }, // The instruction for the AI (apply new hairstyle)
      ],
      config: {
        // Pass negative prompt for quality control
        negativePrompt: negativePrompt, 
        // Request a specific aspect ratio or size
        aspectRatio: '1:1',
        numberOfImages: 1
      }
    });
    
    // Extract the generated image (Base64 data)
    // The response structure for Imagen is slightly different, checking for safety filtered candidates is important
    const candidate = response.candidates[0];
    
    if (candidate.safetyRatings && candidate.safetyRatings.some(rating => rating.probability !== 'NEGLIGIBLE')) {
         console.warn("Generated image was filtered for safety.");
         return {
            statusCode: 403,
            body: JSON.stringify({ error: "Generation failed: The image was filtered due to safety policies. Please try a different pose or style." }),
         };
    }

    // Extract the Base64 data from the first part of the first candidate
    const generatedImageBase64 = candidate.image.imageBytes;

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
      body: JSON.stringify({ error: 'Internal Server Error during AI processing. Check Netlify logs.' }),
    };
  }
}
