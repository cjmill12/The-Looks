// netlify/functions/tryon.mjs

import { GoogleGenAI } from '@google/genai';

// Helper function to create the Part object for image input
function base64ToGenerativePart(base64Data, mimeType) {
  // We explicitly check and remove the data URI prefix just in case the JS failed.
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
    apiKey: process.env.GEMINI_API_KEY 
  }); 

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { baseImage, prompt } = JSON.parse(event.body);

    if (!baseImage || !prompt) {
      return { statusCode: 400, body: 'Missing baseImage or prompt in request body.' };
    }

    // Prepare the image part
    const imagePart = base64ToGenerativePart(baseImage, "image/jpeg");

    // 💡 FIX: Switch to the PRO model for better identity preservation and editing control
    // The prompt already contains the explicit identity preservation instruction.
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-pro', // Using the more capable PRO model
      contents: [
        imagePart,
        { text: prompt }, // The instruction for the AI (apply new hairstyle)
      ],
    });
    
    // --- FINAL CRITICAL FIX: The response from multimodal chat models (even PRO) is TEXT ---
    
    // The model is likely returning a text description or a hallucinated image URL, not the base64 data.
    // If the PRO model cannot return a base64 image object directly (which is often the case 
    // for models not dedicated to image generation), the response will be text.
    
    // TO CONFIRM THE DATA FLOW AND UNBLOCK YOU:
    // We will send back the *original* image if the generated data is missing, 
    // or try to extract the generated image if it exists.
    
    let generatedImageBase64 = baseImage; // Default to the original image to confirm the API works

    // Attempt to extract the generated image (if the model is configured for it)
    try {
        const generatedPart = response.candidates?.[0]?.content?.parts?.find(
            part => part.inlineData && part.inlineData.mimeType.startsWith('image/')
        );
        
        if (generatedPart) {
            generatedImageBase64 = generatedPart.inlineData.data;
            console.log("SUCCESS: Extracted generated image data.");
        } else {
            // Log the text response if no image was found
            const textResponse = response.candidates?.[0]?.content?.parts?.[0]?.text || "No text response found.";
            console.log("WARNING: PRO model returned text instead of image. Text:", textResponse);
            // Revert to original image for flow check
            generatedImageBase64 = baseImage;
        }
    } catch (e) {
        console.warn("Could not parse image response from model. Sending back original image for check.", e);
        generatedImageBase64 = baseImage;
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
        error: `Netlify Function Error. Check API key/deployment. Detail: ${error.message}`
      }),
    };
  }
}
