import { GoogleGenAI, Type } from "@google/genai";
import { Lead } from "../types";
import { GeminiApiCaller } from "../types";

// As per guidelines, initialize GoogleGenAI with API key from environment variables.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const scoreLead = async (callApi: GeminiApiCaller, lead: Lead): Promise<number> => {
  const prompt = `
    Analyze the following real estate lead and provide a lead score from 0 to 100.
    A score of 0 means the lead is completely cold and not worth pursuing.
    A score of 100 means the lead is extremely hot and should be contacted immediately.

    Consider these factors:
    - Lead Status: 'Site Visit', 'Negotiation', 'Approved' are very positive. 'New' is neutral. 'Rejected', 'Lost' are negative.
    - Lead Tag: 'Hot' is very positive. 'Warm' is positive. 'Cold' is neutral/negative.
    - Activities: A higher number of activities, especially recent ones like calls and emails, is positive. Look for positive outcomes. Check activity notes for sentiment.
    - Source: Some sources might be better than others (e.g., 'Referral' is very good).
    - Description/Products/Services: Look for specific interests and high-value products.
    - Recency: How long ago was the last contact? Recent contact is positive.

    Here is the lead data in JSON format:
    ${JSON.stringify(lead, null, 2)}

    Provide only a single integer score as a JSON object with a "score" key. Example: {"score": 85}
  `;

  try {
    const response = await callApi(() =>
      ai.models.generateContent({
        model: 'gemini-2.5-flash', // Suitable for this kind of structured analysis.
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              score: {
                type: Type.NUMBER,
                description: 'The lead score from 0 to 100.'
              }
            }
          }
        }
      })
    );

    const jsonString = response.text.trim();
    const result = JSON.parse(jsonString);

    if (typeof result.score === 'number' && result.score >= 0 && result.score <= 100) {
      return Math.round(result.score);
    } else {
      console.error("Invalid score format from Gemini API:", result);
      throw new Error("Received invalid score format from API.");
    }
  } catch (error) {
    console.error("Error scoring lead with Gemini:", error);
    throw new Error("Failed to score lead using Gemini API.");
  }
};

export const geminiService = {
  scoreLead,
};
