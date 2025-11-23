/// <reference types="vite/client" />

import { GoogleGenAI, Schema, Type, FunctionCallingConfigMode } from "@google/genai";
import { AnalysisResult, GeminiAnalysisSchema } from '../types';

// Check for API Key and log specific error if missing to help with deployment debugging
const apiKey = import.meta.env?.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.warn("WARNING: GEMINI_API_KEY is missing. AI features will not work. Please add 'VITE_GEMINI_API_KEY' to your .env file.");
}

// Initialize the Gemini client only if API key is available
let ai = null;
if (apiKey) {
  try {
    ai = new GoogleGenAI({ apiKey });
  } catch (error) {
    console.error("Failed to initialize AI client:", error);
    ai = null;
  }
}

const analysisSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING, description: "A short title of the identified object or situation." },
    category: { type: Type.STRING, description: "The category (e.g., Perishable, Recyclable, Healthy)." },
    status: { type: Type.STRING, description: "Status indicator: 'Good', 'Warning', 'Critical', 'Safe', 'Hazard'." },
    confidence: { type: Type.NUMBER, description: "Confidence score between 0 and 1." },
    description: { type: Type.STRING, description: "A brief 1-2 sentence description of what is seen." },
    recommendations: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "List of 3 actionable suggestions or disposal methods."
    },
    metricLabel1: { type: Type.STRING, description: "Optional label for a key metric (e.g., 'Estimated Days Left')." },
    metricValue1: { type: Type.STRING, description: "Value for the first metric." },
    metricLabel2: { type: Type.STRING, description: "Optional label for a second metric." },
    metricValue2: { type: Type.STRING, description: "Value for the second metric." },
  },
  required: ["title", "category", "status", "description", "recommendations"],
};

export const analyzeImageWithGemini = async (
  base64Image: string,
  prompt: string
): Promise<AnalysisResult> => {
  // Check if AI is initialized
  if (!ai) {
    throw new Error("AI service not available. Please configure your API key.");
  }

  try {
    // Clean base64 string if it contains headers
    const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");

    console.log("Sending request to Gemini API..."); // Debug log
    // Try different models if the first one fails
    const modelsToTry = ['gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-pro'];
    let response;
    let lastError;
    
    for (const model of modelsToTry) {
      try {
        console.log(`Trying model: ${model}`);
        response = await ai.models.generateContent({
          model: model,
          contents: {
            role: 'user',
            parts: [
              {
                inlineData: {
                  mimeType: 'image/jpeg',
                  data: cleanBase64
                }
              },
              { text: prompt }
            ]
          },
          config: {
            responseMimeType: "application/json",
            responseSchema: analysisSchema,
            systemInstruction: "You are an expert environmental and agricultural scientist. Analyze the image and provide structured JSON output."
          }
        });
        console.log(`Successfully used model: ${model}`);
        break; // If successful, break out of the loop
      } catch (error) {
        console.log(`Failed to use model ${model}:`, error.message);
        lastError = error;
      }
    }
    
    if (!response) {
      throw new Error(`Failed to use any available model. Last error: ${lastError?.message || 'Unknown error'}`);
    }
    
    console.log("Received response from Gemini API"); // Debug log

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");

    const data: GeminiAnalysisSchema = JSON.parse(text);

    // Map to internal type
    return {
      title: data.title,
      category: data.category,
      status: data.status,
      confidence: data.confidence,
      description: data.description,
      recommendations: data.recommendations,
      metrics: [
        ...(data.metricLabel1 && data.metricValue1 ? [{ label: data.metricLabel1, value: data.metricValue1 }] : []),
        ...(data.metricLabel2 && data.metricValue2 ? [{ label: data.metricLabel2, value: data.metricValue2 }] : [])
      ]
    };

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    // Provide more detailed error information
    if (error instanceof Error) {
      throw new Error(`Failed to analyze image: ${error.message}`);
    } else {
      throw new Error(`Failed to analyze image: ${String(error)}`);
    }
  }
};

// Helper function to try different models
const tryModels = async (requestFn: (model: string) => Promise<any>) => {
  const modelsToTry = ['gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-pro'];
  let response;
  let lastError;
  
  for (const model of modelsToTry) {
    try {
      console.log(`Trying model: ${model}`);
      response = await requestFn(model);
      console.log(`Successfully used model: ${model}`);
      return response; // If successful, return the response
    } catch (error) {
      console.log(`Failed to use model ${model}:`, error.message);
      lastError = error;
    }
  }
  
  throw new Error(`Failed to use any available model. Last error: ${lastError?.message || 'Unknown error'}`);
};

export const getTextAdvice = async (prompt: string): Promise<string> => {
  // Check if AI is initialized
  if (!ai) {
    return "AI service not available. Please configure your API key in the .env file.";
  }

  try {
    const response = await tryModels((model) => 
      ai.models.generateContent({
        model: model,
        contents: {
          role: 'user',
          parts: [{ text: prompt }]
        },
        config: {
          systemInstruction: "You are a helpful eco-friendly assistant providing brief, actionable advice."
        }
      })
    );
    return response.text || "No advice generated.";
  } catch (error) {
    console.error("Gemini Text Error:", error);
    return "Unable to retrieve advice at this moment. Please try again later.";
  }
};

export const getCityAirQuality = async (city: string): Promise<string> => {
  // Check if AI is initialized
  if (!ai) {
    return "AI service not available. Please configure your API key in the .env file.";
  }

  try {
    const response = await tryModels((model) => 
      ai.models.generateContent({
        model: model,
        contents: {
          role: 'user',
          parts: [{ text: `Find the real-time Air Quality Index (AQI) for ${city}. 
          Provide the response in this structure:
          **AQI:** [Value]
          **Status:** [e.g. Good, Moderate, Unhealthy]
          **Main Pollutant:** [e.g. PM2.5]
          **Health Advice:** [Brief recommendation]
          
          Keep it concise and formatted like a report.` }]
        },
        config: {
          tools: [{ googleSearch: {} }],
          systemInstruction: "You are a real-time environmental monitor. Retrieve the latest AQI data using Google Search. Return a concise, well-formatted summary."
        }
      })
    );
    return response.text || "Could not fetch air quality data.";
  } catch (error) {
    console.error("Gemini City AQI Error:", error);
    return "Service unavailable. Please try again later.";
  }
};

export const getAirQualityByCoordinates = async (lat: number, lon: number): Promise<string> => {
  // Check if AI is initialized
  if (!ai) {
    return "AI service not available. Please configure your API key in the .env file.";
  }

  try {
    const response = await tryModels((model) => 
      ai.models.generateContent({
        model: model,
        contents: {
          role: 'user',
          parts: [{ text: `Find the real-time Air Quality Index (AQI) for the location at Latitude ${lat}, Longitude ${lon}. Identify the nearest city/area.
          Provide the response in this structure:
          **Location:** [City/Area Name]
          **AQI:** [Value]
          **Status:** [e.g. Good, Moderate, Unhealthy]
          **Health Advice:** [Brief recommendation]` }]
        },
        config: {
          tools: [{ googleSearch: {} }],
          systemInstruction: "You are a real-time environmental monitor. Retrieve the latest AQI data for the specific location coordinates using Google Search."
        }
      })
    );
    return response.text || "Could not fetch air quality data for your location.";
  } catch (error) {
    console.error("Gemini Location AQI Error:", error);
    return "Service unavailable. Please try again later.";
  }
};

export const getContextualAdvice = async (context: string, question: string): Promise<string> => {
  // Check if AI is initialized
  if (!ai) {
    return "AI service not available. Please configure your API key in the .env file.";
  }

  try {
    const response = await tryModels((model) => 
      ai.models.generateContent({
        model: model,
        contents: {
          role: 'user',
          parts: [{ text: `Context: ${context}

User Question: ${question}

Answer the user's question based on the context provided. Keep it helpful, concise, and related to sustainability or health.` }]
        },
      })
    );
    return response.text || "I couldn't generate an answer.";
  } catch (error) {
    console.error("Gemini Contextual Help Error:", error);
    return "Service unavailable.";
  }
};

export const createChatSession = () => {
  // Check if AI is initialized
  if (!ai) {
    return null;
  }

  // Try to create chat session with different models
  const modelsToTry = ['gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-pro'];
  for (const model of modelsToTry) {
    try {
      console.log(`Creating chat session with model: ${model}`);
      const session = ai.chats.create({
        model: model,
        config: {
          systemInstruction: "You are 'EcoBot', the AI assistant for Ecosphere Guardian. You help users with food waste reduction, plant health, pollution control, and general sustainability tips. Keep answers concise, friendly, and encouraging.",
        }
      });
      console.log(`Successfully created chat session with model: ${model}`);
      return session;
    } catch (error) {
      console.log(`Failed to create chat session with model ${model}:`, error.message);
    }
  }
  
  // If all models fail, try with default model
  try {
    console.log("Creating chat session with default model");
    return ai.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: "You are 'EcoBot', the AI assistant for Ecosphere Guardian. You help users with food waste reduction, plant health, pollution control, and general sustainability tips. Keep answers concise, friendly, and encouraging.",
      }
    });
  } catch (error) {
    console.error("Failed to create chat session with any model:", error);
    return null;
  }
};
