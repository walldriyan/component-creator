import { GoogleGenAI, Type } from "@google/genai";
import { ComponentNode } from "../types";

export const generateLayoutWithGemini = async (prompt: string): Promise<ComponentNode | null> => {
  if (!process.env.API_KEY) {
    console.error("API Key missing");
    return null;
  }
  
  // Initialization must use process.env.API_KEY directly
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const systemInstruction = `
    You are an expert UI Engineer specializing in React, Tailwind CSS, and Next.js.
    Your task is to generate a UI component tree based on the user's description.
    
    The output must be a single JSON object representing the root 'container'.
    
    Data Structure Rules:
    - 'id': Generate a unique string (e.g., 'comp-123').
    - 'type': Must be one of ['container', 'text', 'button', 'input', 'card', 'image'].
    - 'library': Default to 'shadcn'.
    - 'style': Use Tailwind-like values but as a generic style object (backgroundColor, color, padding, borderRadius, etc.).
    - 'children': Array of ComponentNode objects.
    
    Use 'container' type with flexDirection: 'row' or 'column' to create layouts.
    Make it look professional and modern.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.OBJECT,
            properties: {
                id: { type: Type.STRING },
                type: { type: Type.STRING },
                name: { type: Type.STRING },
                library: { type: Type.STRING },
                content: { type: Type.STRING },
                style: {
                    type: Type.OBJECT,
                    properties: {
                        backgroundColor: { type: Type.STRING },
                        color: { type: Type.STRING },
                        padding: { type: Type.STRING },
                        borderRadius: { type: Type.STRING },
                        borderWidth: { type: Type.STRING },
                        borderColor: { type: Type.STRING },
                        borderStyle: { type: Type.STRING },
                        flexDirection: { type: Type.STRING },
                        justifyContent: { type: Type.STRING },
                        alignItems: { type: Type.STRING },
                        gap: { type: Type.STRING },
                        width: { type: Type.STRING },
                        height: { type: Type.STRING },
                        minHeight: { type: Type.STRING },
                        fontSize: { type: Type.STRING },
                        fontWeight: { type: Type.STRING },
                        boxShadow: { type: Type.STRING }
                    }
                },
                children: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT, // Recursive definition is tricky in schema, simplified for prompt
                        description: "Child components, same structure as parent"
                    }
                }
            }
        }
      },
    });

    const text = response.text;
    if (!text) return null;
    
    // Parse and post-process to ensure IDs are unique if model duplicated them
    const data = JSON.parse(text) as ComponentNode;
    
    // Helper to ensure structure integrity
    const ensureIds = (node: any): ComponentNode => {
       if(!node.id) node.id = Math.random().toString(36).substr(2, 9);
       if(!node.children) node.children = [];
       node.children = node.children.map(ensureIds);
       return node;
    };

    return ensureIds(data);

  } catch (error) {
    console.error("Error generating layout:", error);
    return null;
  }
};