import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
let genAI = null;

if (apiKey && apiKey !== 'YOUR_GEMINI_API_KEY' && apiKey.trim() !== '') {
  genAI = new GoogleGenerativeAI(apiKey);
  console.log("Gemini Generative AI client initialized successfully.");
} else {
  console.warn("WARNING: GEMINI_API_KEY is not configured! Gemini service will operate in local simulation mode.");
}

// Helper: Call Gemini with multi-model fallback chain
const callWithFallback = async (prompt, generationConfig = {}) => {
  const models = ["gemini-1.5-flash", "gemini-2.0-flash", "gemini-2.5-flash"];
  let lastError = null;

  for (const modelName of models) {
    try {
      console.log(`[Gemini Chain] Attempting request using model: ${modelName}`);
      const model = genAI.getGenerativeModel({ model: modelName, generationConfig });
      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      console.log(`[Gemini Chain] SUCCESS with model: ${modelName}`);
      return { responseText, modelUsed: modelName };
    } catch (err) {
      console.warn(`[Gemini Chain] FAILED with model ${modelName}: ${err.message}`);
      lastError = err;
    }
  }
  throw lastError || new Error("All models in the fallback chain failed.");
};

// Helper: Call Gemini or fallback to simulator
const callGeminiJson = async (prompt, schema, mockFallback) => {
  if (!genAI) {
    console.log("Simulating Gemini response (API key missing)...");
    return mockFallback();
  }

  try {
    // Append JSON instruction to the prompt for robust parsing
    const jsonPrompt = prompt + "\n\nIMPORTANT: Return your response as a valid JSON object. Do not wrap it in markdown code fences.";

    const { responseText } = await callWithFallback(jsonPrompt);
    const trimmedText = responseText.trim();

    // Robust regex-based JSON extraction
    const match = trimmedText.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch (parseErr) {
        console.warn("JSON parse failed from Gemini response:", parseErr.message, "Raw:", trimmedText.substring(0, 200));
      }
    }

    // If we couldn't parse JSON, fall back to mock
    console.warn("Gemini returned non-JSON response, using mock fallback. Raw:", trimmedText.substring(0, 200));
    return mockFallback();
  } catch (error) {
    console.error("Gemini API calling error! Falling back to local simulation:", error.message);
    return mockFallback();
  }
};

/**
 * Generate vector embeddings for text chunks
 */
export const generateEmbeddings = async (text) => {
  if (!genAI) {
    console.warn("Simulating embedding generation (API key missing)...");
    return Array(768).fill(0.01);
  }
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-embedding-001" });
    const result = await model.embedContent(text);
    return result.embedding.values.slice(0, 768);
  } catch (error) {
    console.error("Gemini embedding error:", error.message);
    return Array(768).fill(0.01);
  }
};

/**
 * 1. Maps onboarding statement/voice transcript to interest tags
 */
export const mapTextToInterests = async (text, availableInterests) => {
  const prompt = `You are a student advisor at Saranathan College of Engineering.
Analyze the following freshman student background statement:
"${text}"

Map the statement to zero or more of these interests:
${JSON.stringify(availableInterests)}

Return the matched interest IDs in a structured JSON list.`;

  const schema = {
    type: "OBJECT",
    properties: {
      interestIds: {
        type: "ARRAY",
        items: { type: "INTEGER" },
        description: "List of matched interest database IDs"
      }
    },
    required: ["interestIds"]
  };

  const mockFallback = () => {
    // Simple mock logic: search keywords
    const matchedIds = [];
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('code') || lowerText.includes('program') || lowerText.includes('software') || lowerText.includes('web')) {
      matchedIds.push(1); // Coding
    }
    if (lowerText.includes('robot') || lowerText.includes('hardware') || lowerText.includes('circuit')) {
      matchedIds.push(2); // Robotics & Hardware
    }
    if (lowerText.includes('art') || lowerText.includes('paint') || lowerText.includes('photo') || lowerText.includes('music')) {
      matchedIds.push(3); // Arts & Crafts
    }
    if (lowerText.includes('speak') || lowerText.includes('debate') || lowerText.includes('english')) {
      matchedIds.push(4); // Debate & Public Speaking
    }
    if (lowerText.includes('sports') || lowerText.includes('cricket') || lowerText.includes('play') || lowerText.includes('fitness')) {
      matchedIds.push(5); // Sports & Athletics
    }
    if (lowerText.includes('volunteer') || lowerText.includes('service') || lowerText.includes('nss')) {
      matchedIds.push(6); // Volunteering
    }
    if (lowerText.includes('tamil') || lowerText.includes('culture') || lowerText.includes('தமிழ்')) {
      matchedIds.push(7); // Tamil Culture
    }

    // Default if empty
    if (matchedIds.length === 0) {
      matchedIds.push(1); // Default to coding
    }
    return { interestIds: matchedIds };
  };

  return callGeminiJson(prompt, schema, mockFallback);
};

/**
 * 2. Ranks and writes explanations for matched clubs
 */
export const rankAndExplainMatches = async (userInterests, clubs) => {
  const prompt = `You are a student advisor at Saranathan College of Engineering.
We have a freshman student with the following interests: ${JSON.stringify(userInterests)}.

We have the following college clubs available:
${JSON.stringify(clubs)}

Please rank these clubs based on relevance to the student's profile.
For each club, write a customized, supportive one-line reason (under 20 words, active voice) explaining why it matches them.
Format the output as a JSON object matching the requested schema.`;

  const schema = {
    type: "OBJECT",
    properties: {
      matches: {
        type: "ARRAY",
        items: {
          type: "OBJECT",
          properties: {
            clubId: { type: "INTEGER" },
            rank: { type: "INTEGER" },
            reason: { type: "STRING" }
          },
          required: ["clubId", "rank", "reason"]
        }
      }
    },
    required: ["matches"]
  };

  const mockFallback = () => {
    // Simple heuristic matcher
    const matches = clubs.map((club, idx) => {
      let reason = `SCE ${club.name} matches your engineering growth objectives.`;
      
      if (club.id === 1) reason = "Perfect for sharpening your software development skills and joining programming hackathons.";
      if (club.id === 2) reason = "Great for learning micro-controllers and embedded systems coding side-by-side with peers.";
      if (club.id === 3) reason = "Connects you to creative cultural design and annual performance events.";
      if (club.id === 4) reason = "Highly recommended for developing placement group discussion and corporate speaking confidence.";
      if (club.id === 5) reason = "Engage in Tamil literary research, debate councils, and regional poetry festivals.";
      if (club.id === 6) reason = "Develop key civic leadership traits by volunteer camps around Trichy region.";
      if (club.id === 7) reason = "Aligns with sports routines, fitness track facilities, and trials registration.";

      return {
        clubId: club.id,
        rank: idx + 1,
        reason
      };
    });

    return { matches };
  };

  return callGeminiJson(prompt, schema, mockFallback);
};

/**
 * 3. Generates checklist steps from raw unedited process text
 */
export const generateChecklistFromProcess = async (rawProcessText) => {
  const prompt = `You are an administrative coordinator at Saranathan College of Engineering.
Convert this raw, unedited registration process description into sequential, actionable, step-by-step checklist items for a freshman:
"${rawProcessText}"

Each step must be actionable, clear, and refer to specific counters or blocks if mentioned. Keep steps concise.`;

  const schema = {
    type: "OBJECT",
    properties: {
      steps: {
        type: "ARRAY",
        items: {
          type: "OBJECT",
          properties: {
            order: { type: "INTEGER", description: "Step sequence order (1-indexed)" },
            text: { type: "STRING", description: "Actionable instruction for the freshman" }
          },
          required: ["order", "text"]
        }
      }
    },
    required: ["steps"]
  };

  const mockFallback = () => {
    // Simple fallback checklist generator splitting by sentences
    const sentences = rawProcessText.split('.').map(s => s.trim()).filter(s => s.length > 5);
    const steps = sentences.map((sentence, idx) => ({
      order: idx + 1,
      text: sentence
    }));
    return { steps };
  };

  return callGeminiJson(prompt, schema, mockFallback);
};

/**
 * 4. Grounded Chatbot assistant
 */
export const answerGroundedQuestion = async (userQuery, sqlContext, history = []) => {
  const formattedHistory = history.map(h => `${h.role === 'user' ? 'User' : 'Assistant'}: ${h.text}`).join('\n');
  const historyPrompt = history.length > 0 ? `\n=== RECENT CONVERSATION HISTORY ===\n${formattedHistory}\n============================\n` : '';

  const prompt = `You are PathMate, a freshman orientation chatbot for Saranathan College of Engineering (SCE).${historyPrompt}
The user is asking the following question:
"${userQuery}"

You must answer this question using ONLY the retrieved SQL database records below. Do not use external or fabricated knowledge:
=== SQL DATABASE RESULTS ===
${sqlContext}
============================

Strictly follow these rules:
1. If the SQL database records contain the answer, set isGrounded = true and answer the question. Quote the location block and details. Identify the source_table from which this was found (e.g. 'timetable', 'faculty', 'clubs', 'events', 'emergency_contacts').
2. If the SQL database records DO NOT contain the answer, or are insufficient, set isGrounded = false, write a polite notification answer that the information is missing from the orientation files, and set sourceTable = null.

Format your response as a JSON object matching the requested schema.`;

  const schema = {
    type: "OBJECT",
    properties: {
      answer: { type: "STRING", description: "Clear, grounded answer to the user query" },
      isGrounded: { type: "BOOLEAN", description: "True if answered from SQL data, false otherwise" },
      sourceTable: { type: "STRING", description: "The table name from which the answer was retrieved (e.g. 'timetable', 'faculty'), or null" }
    },
    required: ["answer", "isGrounded", "sourceTable"]
  };

  const mockFallback = () => {
    const lowerQuery = userQuery.toLowerCase();
    
    // Heuristic grounded mock answering
    if (lowerQuery.includes('timetable') || lowerQuery.includes('python') || lowerQuery.includes('schedule')) {
      return {
        answer: "According to the SCE First-Year Timetable: CSE Section A has 'Problem Solving and Python Programming' on Mondays from 09:00 AM to 09:50 AM, taught by Dr. S. M. Giriraj.",
        isGrounded: true,
        sourceTable: "timetable"
      };
    }
    
    if (lowerQuery.includes('hostel') || lowerQuery.includes('warden')) {
      return {
        answer: "Hostel Wardens list: Chief Warden for Boys Hostel is Prof. Hostel Welfare Warden (Block B). Chief Warden for Girls is Dr. Hostel Welfare Warden (Block A).",
        isGrounded: true,
        sourceTable: "emergency_contacts"
      };
    }

    if (lowerQuery.includes('ragging') || lowerQuery.includes('safety') || lowerQuery.includes('emergency')) {
      return {
        answer: "SCE maintains a zero-tolerance policy. You can contact the SCE Anti-Ragging Committee at the emergency cell hotline: [ADD REAL ANTI-RAGGING HOTLINE].",
        isGrounded: true,
        sourceTable: "emergency_contacts"
      };
    }

    if (lowerQuery.includes('canteen') || lowerQuery.includes('food')) {
      return {
        answer: "The Main Canteen is located behind the ECE department building, serving vegetarian food from 8:00 AM to 6:00 PM.",
        isGrounded: true,
        sourceTable: "clubs" // location mapped through clubs
      };
    }

    return {
      answer: "I am unable to answer this question because it is not covered by the current orientation reference database.",
      isGrounded: false,
      sourceTable: null
    };
  };

  return callGeminiJson(prompt, schema, mockFallback);
};

/**
 * 5. Generates the Weekly Digest summary
 */
export const generateDigest = async (events, clubs) => {
  const prompt = `You are the student affairs dean at Saranathan College of Engineering.
Synthesize a concise "New this week" freshman greeting and orientation summary banner based on the current active SCE clubs and events:
Active Clubs: ${JSON.stringify(clubs)}
Upcoming Events: ${JSON.stringify(events)}

Keep it professional, encouraging, and under 50 words. Do not fabricate dates.`;

  const schema = {
    type: "OBJECT",
    properties: {
      summary: { type: "STRING", description: "Weekly greeting summary for the freshers dashboard" }
    },
    required: ["summary"]
  };

  const mockFallback = () => {
    return {
      summary: "First-year orientation is starting this week. Be sure to check details for the Freshers Hackathon 2026 on Aug 20 and the RoboSoccer Workshop assembly on Aug 22 at the Main Lab Block."
    };
  };

  return callGeminiJson(prompt, schema, mockFallback);
};

/**
 * 6. Translates standard or dynamic text into target language
 */
export const translateText = async (text, targetLanguage) => {
  if (!text || text.trim() === '') return text;
  if (!targetLanguage || targetLanguage === 'en') return text;

  const prompt = `You are a professional university content translator.
Translate the following college orientation/educational text from English to ${targetLanguage === 'ta' ? 'Tamil' : 'Hindi'}.

Rules:
1. Translate the meaning accurately and professionally, keeping the tone clean.
2. Keep engineering terms accurate (e.g. "Computer Science" can be translated or kept recognizable).
3. Do not translate usernames, URLs, department codes, email addresses, numbers, or technical identifiers.
4. Return only the translated text. Do not add explanations, intros, or markdown wraps.

Text to translate:
"${text}"`;

  if (!genAI) {
    console.log("Simulating translation (API key missing)...");
    if (targetLanguage === 'ta') {
      return `[தமிழ்] ${text}`;
    } else {
      return `[हिन्दी] ${text}`;
    }
  }

  try {
    const { responseText } = await callWithFallback(prompt);
    return responseText.trim();
  } catch (error) {
    console.error("Gemini translation error in chain:", error.message);
    if (targetLanguage === 'ta') {
      return `[தமிழ்] ${text}`;
    } else {
      return `[हिन्दी] ${text}`;
    }
  }
};

/**
 * 7. Grounded Web summarizer
 */
export const generateWebsiteSummary = async (userQuery, websiteText, history = []) => {
  const formattedHistory = history.map(h => `${h.role === 'user' ? 'User' : 'Assistant'}: ${h.text}`).join('\n');
  const historyPrompt = history.length > 0 ? `\n=== RECENT CONVERSATION HISTORY ===\n${formattedHistory}\n================================\n` : '';

  const prompt = `You are PathMate, the orienter chatbot for Saranathan College of Engineering (SCE).${historyPrompt}
The freshman student is asking the following query:
"${userQuery}"

Analyze the official college website text retrieved below and answer the query accurately:
=== OFFICIAL WEBSITE CONTENT ===
${websiteText}
================================

Rules:
1. Explain clearly in a professional tone under 80 words.
2. Quote details or contacts if present.
3. If not covered, state clearly that details are not available on the official pages.

Return only the summarized answer.`;

  if (!genAI) {
    console.log("Simulating website summarization (API key missing)...");
    return `Here is a summary from the official website regarding your query about "${userQuery}". For full procedures, please visit saranathan.ac.in.`;
  }

  try {
    const { responseText } = await callWithFallback(prompt);
    return responseText.trim();
  } catch (error) {
    console.error("Gemini website summary error in chain:", error.message);
    return `Here is a summary from the official website regarding your query about "${userQuery}". For full procedures, please visit saranathan.ac.in.`;
  }
};

export const parseNavigationQuery = async (text) => {
  const prompt = `You are an AI navigation assistant for Saranathan College of Engineering campus.
Analyze the user's campus navigation query:
"${text}"

Extract the intent, source (if mentioned, otherwise null), destination, and preferred route type (e.g. fastest, shortest).
Allowed intents: "navigate", "find_nearest", "info".
Return the results in structured JSON.`;

  const schema = {
    type: "OBJECT",
    properties: {
      intent: { type: "STRING", description: "navigate, find_nearest, or info" },
      source: { type: "STRING", description: "Starting location or null" },
      destination: { type: "STRING", description: "Target location or building" },
      route: { type: "STRING", description: "Preferred route (e.g., fastest)" }
    },
    required: ["intent", "destination"]
  };

  const mockFallback = () => ({
    intent: "navigate",
    source: null,
    destination: text,
    route: "fastest"
  });

  return callGeminiJson(prompt, schema, mockFallback);
};

export const extractEventPosterDetails = async (imageUrl) => {
  const prompt = `You are an AI Vision assistant for Saranathan College of Engineering.
Extract event details from this poster URL: ${imageUrl}

Return structured JSON.`;

  const schema = {
    type: "OBJECT",
    properties: {
      eventName: { type: "STRING" },
      venue: { type: "STRING" },
      date: { type: "STRING" },
      time: { type: "STRING" },
      organizer: { type: "STRING" },
      description: { type: "STRING" },
      targetAudience: { type: "STRING" }
    },
    required: ["eventName", "venue"]
  };

  const mockFallback = () => ({
    eventName: "Campus Hackathon 2026",
    venue: "RV Block",
    date: "2026-08-15",
    time: "09:00 AM",
    organizer: "Coding Ninjas",
    description: "Annual 24-hour hackathon.",
    targetAudience: "All Students"
  });

  return callGeminiJson(prompt, schema, mockFallback);
};

export const askGeminiHybrid = async (userQuery, history = [], isCollegeRelated = false, searchContext = "") => {
  if (!genAI) {
    console.log("Simulating Gemini response (API key missing)...");
    const q = userQuery.toLowerCase();
    if (/hi|hello|hey|greetings|who are you/i.test(q)) {
      return {
        answer: "Hello! 👋 I'm PathMate, your AI campus companion for Saranathan College of Engineering. I can help you with college information, navigation, academics, clubs, events, and even answer general questions. How can I help you today?",
        isSensitive: false
      };
    }
    if (q.includes('programming') || q.includes('python') || q.includes('java') || q.includes('code') || q.includes('c ')) {
      return {
        answer: "Programming is the process of creating a set of instructions that tell a computer how to perform a task. Python is highly readable and great for beginners, whereas languages like C or Java provide stronger control over hardware and memory allocation. Focus on understanding key concepts like variables, loops, and functions first!",
        isSensitive: false
      };
    }
    return {
      answer: `Here is general guidance regarding your query: "${userQuery}". For official regulations, please visit the administrative office or check the central study portal.`,
      isSensitive: false
    };
  }

  const formattedHistory = history.map(h => `${h.role === 'user' ? 'User' : 'Assistant'}: ${h.text}`).join('\n');
  const historyPrompt = history.length > 0 ? `\n=== RECENT CONVERSATION HISTORY ===\n${formattedHistory}\n================================\n` : '';

  let contextPrompt = "";
  if (searchContext) {
    contextPrompt = `\n=== REAL-TIME WEB SEARCH RESULTS (CURRENT AS OF 2026) ===\n${searchContext}\n=======================================================\nUse the search results above as the single source of truth for current affairs, dynamic information, or latest real-world facts. Always prioritize these search results over your static pre-trained knowledge.\n`;
  }

  const prompt = `You are PathMate, a friendly, professional, and encouraging AI assistant for Saranathan College of Engineering (SCE). You are smart and capable of answering ANY question.
${historyPrompt}${contextPrompt}
The user is asking: "${userQuery}"

Your objective is to provide a helpful, accurate, easy-to-understand response to ANY question the user asks.
Follow these guidelines:
1. SENSITIVITY CHECK: If the query involves violence, self-harm, illegal activities, harassment, discrimination, personal data, hate speech, explicit content, or dangerous activities, politely decline the query and state that you cannot assist with unsafe topics. Set isSensitive to true.
2. GREETINGS: If the query is a simple greeting (Hi, hello, hey, who are you, etc.), respond warmly introducing yourself exactly like this:
"Hello! 👋 I'm PathMate, your AI campus companion for Saranathan College of Engineering. I can help you with college information, navigation, academics, clubs, events, and even answer general questions. How can I help you today?"
3. GENERAL KNOWLEDGE: You MUST answer ALL general knowledge questions directly, accurately, and concisely. This includes but is not limited to: current affairs, politics, history, geography, science, mathematics, technology, coding, programming, career advice, interview preparation, motivation, health, sports, entertainment, and any other topic. You are NOT limited to college topics only. Answer like a knowledgeable AI assistant. Use bullet points where appropriate.
4. COLLEGE QUESTIONS: If the query is about Saranathan College or engineering college topics, answer based on general engineering college knowledge. Be professional, clear, and welcoming.
5. NEVER say "I don't have information", "I cannot answer", "this is outside my scope", or "I am limited to college topics". You must ALWAYS provide a helpful answer to any safe question.

Return the response inside a JSON object:
{
  "answer": "response text...",
  "isSensitive": false
}`;

  try {
    const { responseText } = await callWithFallback(prompt);
    const trimmedText = responseText.trim();
    
    // Attempt parsing
    const match = trimmedText.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        const parsed = JSON.parse(match[0]);
        if (parsed && typeof parsed.answer === 'string') {
          return {
            answer: parsed.answer,
            isSensitive: !!parsed.isSensitive
          };
        }
      } catch (err) {
        console.warn("JSON parsing of Gemini response failed:", err.message, "Raw text:", trimmedText);
      }
    }
    
    // Safe text fallback
    return {
      answer: trimmedText.replace(/```json|```/g, '').trim(),
      isSensitive: false
    };
  } catch (error) {
    console.error("Gemini API hybrid assistant error:", error.message);
    return {
      answer: `Here is some general advice regarding "${userQuery}". It is always helpful to double-check with senior guides or your academic class advisor for specific department rules.`,
      isSensitive: false
    };
  }
};

