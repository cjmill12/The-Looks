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

    // FIX: Using gemini-2.5-flash, which is supported by generateContent 
    // and can handle the multimodal input (image + text prompt).
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash', // The supported multimodal model ID
      contents: [
        imagePart,
        { text: prompt }, // The instruction for the AI (apply new hairstyle)
      ],
      config: {
        // Pass negative prompt for quality control
        // Note: Gemini models typically respond with text, but with the 
        // correct prompting, they can often return a structured image-part 
        // that the following parsing logic expects.
        // We will keep the negativePrompt in the config just in case.
        negativePrompt: negativePrompt, 
      }
    });
    
    // --- Reverting to original parsing logic for Gemini model output ---
    const candidate = response.candidates[0];

    if (!candidate || !candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) {
      // If the model didn't return a structured image part, return an error.
       console.warn("Gemini model did not return a structured image part in the response.");
       return {
          statusCode: 500,
          body: JSON.stringify({ error: "AI response failed to generate an image. Please try again with a simpler image or prompt." }),
       };
    }
    
    // This expects the model to return a part containing an image.
    const generatedImageBase64 = candidate.content.parts[0].inlineData.data;

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
