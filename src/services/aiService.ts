import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });

export interface StudentReference {
  id: string;
  name: string;
  photoBase64: string; // "data:image/jpeg;base64,..."
}

export async function matchStudent(cameraImageBase64: string, students: StudentReference[]): Promise<{ studentId: string | null; confidence: number }> {
  if (students.length === 0) return { studentId: null, confidence: 0 };

  // Prepare references
  const referencePhotos = students.map(s => ({
    inlineData: {
      mimeType: "image/jpeg",
      data: s.photoBase64.split(',')[1] // Remove prefix
    }
  }));

  const cameraPhoto = {
    inlineData: {
      mimeType: "image/jpeg",
      data: cameraImageBase64.split(',')[1]
    }
  };

  const studentListText = students.map(s => `- ID: ${s.id}, Name: ${s.name}`).join('\n');

  const prompt = `
Task: Identify which student from the provided list is most likely present in the "Camera Image".
Comparison: Compare the "Camera Image" against the provided "Reference Images".

Students List:
${studentListText}

Instructions:
1. Analyze the facial features in the Camera Image.
2. Compare them with each of the Reference Images provided.
3. If a match is found with high confidence (above 0.8), return the student ID.
4. If no clear match is found, return null for studentId.
5. Return ONLY a JSON object.

Response Format:
{
  "studentId": "the-matched-id-or-null",
  "confidence": 0.95,
  "reason": "Brief explanation of the match"
}
`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          { text: "Reference Images of Students:" },
          ...referencePhotos,
          { text: "Camera Image to Identify:" },
          cameraPhoto,
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json"
      }
    });

    const result = JSON.parse(response.text || '{}');
    return {
      studentId: result.studentId === "null" ? null : result.studentId,
      confidence: result.confidence || 0
    };
  } catch (error) {
    console.error("AI Match Error:", error);
    return { studentId: null, confidence: 0 };
  }
}
