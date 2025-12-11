// netlify/functions/tryon.mjs

// Use ES Module syntax
import { GoogleGenAI } from '@google/genai';

// Handler must be exported as a named 'handler' function for Netlify
export async function handler(event) {
  
  // Initialize the client with the API key from environment variables
  const ai = new GoogleGenAI({ 
    apiKey: process.env.GEMINI_API_KEY 
  }); 

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { baseImage, prompt, negativePrompt } = JSON.parse(event.body);

    if (!baseImage || !prompt) {
      return { statusCode: 400, body: 'Missing baseImage or prompt in request body.' };
    }
    
    // --- FINAL FIX: Using the generateImages method for inpainting/editing ---
    
    // The model used here, 'imagen-3.0-generate-002', is the one designed 
    // for this task, and it IS accessible via generateImages when structured 
    // this way for API key users.
    const response = await ai.models.generateImages({
      model: 'imagen-3.0-generate-002', 
      
      // The prompt now includes instruction to perform the edit
      prompt: prompt,
      
      config: {
        // Pass the original image as the base for editing/inpainting
        baseImage: baseImage, 
        
        // Negative prompt
        negativePrompt: negativePrompt, 
        
        // The hairstyle try-on is an image manipulation task (inpainting)
        outputMimeType: 'image/jpeg',
        aspectRatio: '1:1',
        numberOfImages: 1
      }
    });

    // --- Response Parsing for generateImages ---
    // The response structure for generateImages is response.generatedImages[0].image.imageBytes
    const generatedImageBase64 = response.generatedImages[0].image.imageBytes;

    if (!generatedImageBase64) {
         console.warn("Image Generation failed to return image bytes.");
         return {
            statusCode: 500,
            body: JSON.stringify({ error: "Generation failed: The image could not be edited by the AI model." }),
         };
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
      body: JSON.stringify({ error: `Internal Server Error during AI processing. Please check your API key and Netlify logs. Error details: ${error.message}` }),
    };
  }
}
