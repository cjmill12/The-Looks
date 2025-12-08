// netlify/functions/tryon.js

// Import the SDK at the top level
const { GoogleGenAI } = require('@google/genai');

// Helper function to create the Part object for image input (Stays outside the handler)
function base64ToGenerativePart(base64Data, mimeType) {
  return {
    inlineData: {
      data: base64Data,
      mimeType
    },
  };
}

exports.handler = async (event) => {
  // 🚨 FIX: Initialize the AI client INSIDE the handler.
  // This ensures 'ai' is scoped locally for each function invocation.
  const ai = new GoogleGenAI({}); 

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { baseImage, prompt } = JSON.parse(event.body);

    // ... (rest of your validation and logic) ...

    const imagePart = base64ToGenerativePart(baseImage, "image/jpeg");

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: [
        imagePart,
        { text: prompt },
      ],
    });
    
    // ... (return response) ...

  } catch (error) {
    // ... (error handling) ...
  }
};
