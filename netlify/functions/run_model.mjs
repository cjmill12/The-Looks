// netlify/functions/run_model.mjs
import { GoogleGenAI } from '@google/genai';

function base64ToGenerativePart(base64Data, mimeType) {
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

export async function handler(event) {

  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
  });

  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

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

    console.log('Processing image with Gemini 3 Pro Image...');

    const imagePart = base64ToGenerativePart(baseImage, "image/jpeg");

    // Gemini 3 Pro Image uses advanced reasoning to follow complex
    // multi-rule prompts more precisely — ideal for targeted hair editing
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: [
        {
          role: 'user',
          parts: [
            imagePart,
            { text: prompt }
          ]
        }
      ],
      generationConfig: {
        // Request highest quality output
        responseModalities: ['image'],
        // Temperature 1 = balanced creativity vs precision (0 = robotic, 2 = chaotic)
        temperature: 1,
      }
    });

    // Robustly find the image part in the response
    // (Gemini 3 Pro may return text reasoning alongside the image)
    let generatedImageBase64 = null;
    const parts = response.candidates?.[0]?.content?.parts ?? [];

    for (const part of parts) {
      if (part.inlineData?.data) {
        generatedImageBase64 = part.inlineData.data;
        break;
      }
    }

    if (!generatedImageBase64) {
      // Log what we got for debugging
      console.error('Response parts received:', JSON.stringify(parts.map(p => ({
        hasText: !!p.text,
        hasImage: !!p.inlineData,
        mimeType: p.inlineData?.mimeType
      }))));
      throw new Error("Model responded but did not return a generated image.");
    }

    console.log('Image generation successful with Gemini 3 Pro Image');

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        generatedImageBase64,
        success: true
      }),
    };

  } catch (error) {
    console.error('AI Processing Error:', error);

    // If Gemini 3 Pro is unavailable, surface a clear message
    const isModelError = error.message?.includes('model') || error.message?.includes('404');

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: isModelError
          ? 'Image model unavailable. Please try again shortly.'
          : 'Failed to generate image',
        details: error.message
      }),
    };
  }
}
