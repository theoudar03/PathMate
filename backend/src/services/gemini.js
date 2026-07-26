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

  const prompt = `You are PathMate, a friendly, warm, and professional freshman campus assistant for Saranathan College of Engineering (SCE).${historyPrompt}
The user is asking the following question:
"${userQuery}"

You must answer this question using ONLY the retrieved SQL database records below. Do not use external or fabricated knowledge:
=== SQL DATABASE RESULTS ===
${sqlContext}
============================

Strictly follow these rules:
1. If the SQL database records contain the answer, set isGrounded = true and answer the question. Rewrite the database info naturally as if talking directly to the student in a chat. DO NOT dump raw database text, do not paste regulation pages, and do not repeat user questions. Keep it to 1 to 4 sentences, maximum 80 words. Suggest the follow-up prompt: "Would you like more details?".
2. If the SQL database records DO NOT contain the answer, or are insufficient, set isGrounded = false, write a friendly response that the official information could not be found, and set sourceTable = null.
3. Keep the response concise, friendly, and helpful for a new freshman. Do not explain greetings or define common words.

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
        answer: "Hostel Warden contacts: For Boys Hostel: Mr. Senthil Balaji (97866 02444) and Mr. Ganapathy (80563 78804). For Girls Hostel: Dr. M.Santhi (9443247249), Ms.Kalpana (8667861938), and Ms. Sarojini (7708032282).",
        isGrounded: true,
        sourceTable: "emergency_contacts"
      };
    }

    if (lowerQuery.includes('ragging') || lowerQuery.includes('safety') || lowerQuery.includes('emergency')) {
      return {
        answer: "SCE maintains a zero-tolerance anti-ragging policy. Contact the Anti-Ragging Committee: Dr.D.Valavan (8489915201), Dr.L.Muruganandam (9486606545), Dr.M.Padmaa (9894055910), or Mr.P.Nixon (Inspector of Police) at 9498164033.",
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

  const prompt = `You are PathMate, a friendly, professional, warm, and human campus assistant for Saranathan College of Engineering (SCE). You respond naturally as if chatting directly with a college fresher student.
${historyPrompt}${contextPrompt}
The user is asking: "${userQuery}"

Your objective is to provide a helpful, natural, easy-to-understand response to ANY question the user asks.
Follow these guidelines:
1. SENSITIVITY CHECK: If the query involves violence, self-harm, illegal activities, harassment, discrimination, personal data, hate speech, explicit content, or dangerous activities, politely decline the query and state that you cannot assist with unsafe topics. Set isSensitive to true.
2. GREETINGS & INTRODUCTIONS: If the query is a greeting (e.g., Hi, hello, hey, hyy, hlo, yo, good morning, what's up, who are you), greet them warmly and introduce yourself naturally:
"Hey! 👋 Welcome to PathMate. I'm your AI campus companion for Saranathan College of Engineering. I can help you with academics, campus navigation, departments, clubs, events, hostel, placements, regulations, and even general questions. What would you like to know today?"
Never explain the meaning of greetings, dictionary definitions, or abbreviations (like "hyy", "hlo"). Treat them simply as casual greetings.
3. CONVERSATIONAL STYLE: Speak naturally like a friendly guide. Avoid academic/textbook jargon. NEVER answer like Google Search, Wikipedia, documentation, or a blog article. Do not use robotic patterns, dictionary-style outlines, or dry definitions. Be warm, reassuring, and guide the student.
4. ANSWER LENGTH & CONCISENESS: Keep responses adapted to the complexity of the question. Answer simple questions with short answers, medium with medium, and complex with detail. Avoid long numbered essays or repeating information. Answer first, explain briefly only if needed.
5. NO SEARCH-ENGINE PHRASES: Do not use phrases like "The term refers to...", "It can have several meanings...", "Depending on the context..." unless explicitly asked.
6. NATURAL FOLLOW-UPS: End helpful responses with natural, conversational follow-up questions to keep the chat flow (e.g., "Would you like me to show the route?", "I can also explain that in simpler words.", "Need more details?", "Would you like the official college info too?").

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

/**
 * 5. Detect Conversational Intent using Gemini Flash
 */
export const detectIntent = async (userQuery, history = []) => {
  if (!genAI) {
    // Basic regex-based intent classification if no API key
    const lower = userQuery.toLowerCase().trim();
    if (/^(hi|hello|hey|heyy|heyyy|hyy|hlo|hy|yo|greetings|good morning|good evening|good afternoon|good night|namaste|vanakkam)\b/i.test(lower)) {
      return "GREETING";
    }
    if (/^(who are you|what are you|introduce yourself|tell me about yourself|your name)\b/i.test(lower)) {
      return "IDENTITY";
    }
    if (/^(how are you|what are you doing|what's up|whats up|sup|are you busy|how is your day|nice to meet you)\b/i.test(lower)) {
      return "CASUAL";
    }
    if (/^(thank you|thanks|awesome|good job|you're amazing|nice|great)\b/i.test(lower)) {
      return "APPRECIATION";
    }
    if (/^(bye|see you|goodbye|take care|see you later)\b/i.test(lower)) {
      return "FAREWELL";
    }
    if (lower.includes("college") || lower.includes("saranathan") || lower.includes("sce") || lower.includes("hostel") || lower.includes("timetable") || lower.includes("faculty")) {
      return "COLLEGE_RELATED";
    }
    if (lower.includes("code") || lower.includes("programming") || lower.includes("python") || lower.includes("javascript") || lower.includes("html") || lower.includes("java")) {
      return "CODING";
    }
    return "UNKNOWN";
  }

  const formattedHistory = history.map(h => `${h.role === 'user' ? 'User' : 'Assistant'}: ${h.text}`).join('\n');
  const historyPrompt = history.length > 0 ? `\n=== RECENT CONVERSATION HISTORY ===\n${formattedHistory}\n============================\n` : '';

  const prompt = `You are a conversational intent classifier. Classify the user's latest query into EXACTLY one of these intent categories.
Categories:
- GREETING: Casual greetings like hi, hello, hey, hyy, hlo, good morning, namaste, etc.
- IDENTITY: Asking who you are, what you do, your name, or asking you to introduce yourself.
- CASUAL: General chit-chat or questions like how are you, what's up, what are you doing, nice to meet you.
- APPRECIATION: Expressions of thanks, praise, appreciation (e.g. thanks, you are amazing, awesome).
- FAREWELL: Goodbye, bye, see you later, take care, etc.
- COLLEGE_RELATED: Specific query about Saranathan College of Engineering (SCE), courses, hostel, timetable, regulations, faculty, clubs, navigation, or circulars.
- CODING: Requests to write code, program, format tech answers, debug, or write scripts.
- SENSITIVE: Inappropriate, explicit, self-harm, harassment, or dangerous content.
- GENERAL_KNOWLEDGE: General facts, world details, history, geography, science (non-college and non-coding).
- UNKNOWN: Anything else that doesn't fit the above categories.

${historyPrompt}
User Query: "${userQuery}"

Respond with ONLY the name of the category (e.g., GREETING, IDENTITY, CASUAL, APPRECIATION, FAREWELL, COLLEGE_RELATED, CODING, SENSITIVE, GENERAL_KNOWLEDGE, UNKNOWN). Do not include any other text or explanation.`;

  try {
    const { responseText } = await callWithFallback(prompt);
    const cleaned = responseText.trim().toUpperCase();
    
    const categories = ["GREETING", "IDENTITY", "CASUAL", "APPRECIATION", "FAREWELL", "COLLEGE_RELATED", "CODING", "SENSITIVE", "GENERAL_KNOWLEDGE", "UNKNOWN"];
    for (const cat of categories) {
      if (cleaned.includes(cat)) {
        return cat;
      }
    }
    return "UNKNOWN";
  } catch (err) {
    console.error("detectIntent failed, falling back to UNKNOWN:", err.message);
    return "UNKNOWN";
  }
};

/**
 * 6. Ask Gemini using dynamic intent-based system instructions
 */
export const askGeminiWithIntent = async (userQuery, history = [], intent = "UNKNOWN", searchContext = "") => {
  if (!genAI) {
    console.log("Simulating askGeminiWithIntent (API key missing)...");
    if (intent === 'GREETING') {
      return { answer: "Hey! 👋 Great to connect. How is your day going?", isSensitive: false };
    }
    if (intent === 'IDENTITY') {
      return { answer: "I'm PathMate, your AI companion for Saranathan College of Engineering! I can help you with campus navigation, departments, events, and academics.", isSensitive: false };
    }
    if (intent === 'CASUAL') {
      return { answer: "I'm doing great, thanks for checking in! 😊 Just here and ready to help you with anything you need.", isSensitive: false };
    }
    if (intent === 'APPRECIATION') {
      return { answer: "You're very welcome! I'm happy to help. Let me know if there's anything else you need.", isSensitive: false };
    }
    if (intent === 'FAREWELL') {
      return { answer: "Goodbye! 👋 Hope you have a wonderful time ahead. Come back whenever you need help!", isSensitive: false };
    }
    return { answer: `This is a simulated response to your question: "${userQuery}". Let me know if you need any other guidance!`, isSensitive: false };
  }

  let systemInstruction = "";
  switch (intent) {
    case "GREETING":
      systemInstruction = "You are PathMate. Welcome the student warmly. Respond naturally as if continuing a real conversation. Keep it short, friendly, and avoid introducing yourself unless the user asks. Respond differently to repeated greetings.";
      break;
    case "IDENTITY":
      systemInstruction = "You are PathMate, the AI campus companion for Saranathan College of Engineering. Introduce yourself warmly, explain what you can help with, and invite the user to ask anything.";
      break;
    case "CASUAL":
      systemInstruction = "You are a friendly conversational AI. Respond naturally, briefly, and warmly. Don't redirect every answer to your features.";
      break;
    case "APPRECIATION":
      systemInstruction = "Thank the user politely. Keep the conversation positive. Optionally ask if they need any more help.";
      break;
    case "FAREWELL":
      systemInstruction = "Say goodbye warmly and encourage the user to return whenever they need help.";
      break;
    case "COLLEGE_RELATED":
      systemInstruction = "If official information exists in the Knowledge Database, use it. Otherwise, answer using Gemini while clearly distinguishing unofficial guidance if necessary.";
      break;
    case "GENERAL_KNOWLEDGE":
      systemInstruction = "Answer conversationally like ChatGPT. Do not sound like a search engine or encyclopedia.";
      break;
    case "CODING":
      systemInstruction = "Answer with concise explanations, markdown formatting, and code blocks where appropriate.";
      break;
    case "SENSITIVE":
      systemInstruction = "Politely decline to assist with unsafe or sensitive topics. Always be helpful and safe.";
      break;
    case "UNKNOWN":
    default:
      systemInstruction = "Answer naturally as a helpful campus assistant. Do not use robotic patterns, dictionary-style outlines, or dry definitions.";
      break;
  }

  const coreRules = `
CONVERSATIONAL RULES:
1. NEVER repeat identical wording or use hardcoded templates.
2. Avoid repetitive introductions. Never say "I'm PathMate..." if the user already knows who you are or if you've already introduced yourself in the conversation history.
3. Remember previous conversation context. Follow-up queries should build on previous messages instead of restarting the conversation.
4. Keep the response natural, warm, and conversational (never look like an encyclopedia or search engine). Answer first, explain concisely only if needed.
`;

  const formattedHistory = history.map(h => `${h.role === 'user' ? 'User' : 'Assistant'}: ${h.text}`).join('\n');
  const historyPrompt = history.length > 0 ? `\n=== RECENT CONVERSATION HISTORY ===\n${formattedHistory}\n================================\n` : '';

  let contextPrompt = "";
  if (searchContext) {
    contextPrompt = `\n=== REAL-TIME WEB SEARCH RESULTS (CURRENT AS OF 2026) ===\n${searchContext}\n=======================================================\nUse the search results above as the single source of truth for current affairs, dynamic information, or latest real-world facts. Always prioritize these search results over your static pre-trained knowledge.\n`;
  }

  const prompt = `System Instruction: ${systemInstruction}
${coreRules}
${historyPrompt}${contextPrompt}
The user is asking: "${userQuery}"

Return the response inside a JSON object:
{
  "answer": "response text...",
  "isSensitive": false
}`;

  try {
    const { responseText } = await callWithFallback(prompt);
    const trimmedText = responseText.trim();
    
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
    
    return {
      answer: trimmedText.replace(/```json|```/g, '').trim(),
      isSensitive: false
    };
  } catch (error) {
    console.error("Gemini askGeminiWithIntent error:", error.message);
    return {
      answer: `I'm here to help with "${userQuery}". Let me know if you'd like to check details or ask another question!`,
      isSensitive: false
    };
  }
};

/**
 * 7. Ask Gemini for Academic questions with strict length limit (100 - 180 words) and token optimization prompts
 */
export const askGeminiAcademic = async (userQuery, history = []) => {
  if (!genAI) {
    console.log("Simulating askGeminiAcademic (API key missing)...");
    return { answer: `This is a simulated academic response for "${userQuery}". Ohm's Law states that the current through a conductor between two points is directly proportional to the voltage across the two points.` };
  }

  const systemInstruction = `
You are a helpful campus and academic assistant. Answer the student's question directly, clearly, and concisely in simple English.
Use bullet points when appropriate. Always use proper markdown formatting for readability.
Avoid essays, unnecessary introductions, repeating the user's question, or verbose conclusions.
Keep your response short, professional, friendly, and easy to read, with a maximum of 120 words unless more detail is requested.
Answer first, explain briefly only if needed.
`;

  const formattedHistory = history.map(h => `${h.role === 'user' ? 'User' : 'Assistant'}: ${h.text}`).join('\n');
  const historyPrompt = history.length > 0 ? `\n=== RECENT CONVERSATION HISTORY ===\n${formattedHistory}\n================================\n` : '';

  const prompt = `System Instruction: ${systemInstruction}
${historyPrompt}
The student asks: "${userQuery}"

Return the response inside a JSON object:
{
  "answer": "response text..."
}`;

  try {
    const { responseText } = await callWithFallback(prompt);
    const trimmedText = responseText.trim();
    
    const match = trimmedText.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        const parsed = JSON.parse(match[0]);
        if (parsed && typeof parsed.answer === 'string') {
          return {
            answer: parsed.answer
          };
        }
      } catch (err) {
        console.warn("JSON parsing of Gemini response failed:", err.message, "Raw text:", trimmedText);
      }
    }
    
    return {
      answer: trimmedText.replace(/```json|```/g, '').trim()
    };
  } catch (error) {
    console.error("Gemini askGeminiAcademic error:", error.message);
    throw error;
  }
};

/**
 * 8. Ask Gemini to answer using only official website context text (Strict Grounding, No Hallucinations)
 */
export const askGeminiWithWebsiteContext = async (userQuery, websiteText, history = []) => {
  if (!genAI) {
    console.log("Simulating askGeminiWithWebsiteContext (API key missing)...");
    return { answer: "I couldn't verify the latest official information." };
  }

  const systemInstruction = `
You are the official Saranathan College of Engineering guide.
Answer the student's question using ONLY the facts provided in the official website text.

=== OFFICIAL WEBSITE TEXT ===
${websiteText}
============================

STRICT COMPLIANCE RULES:
1. Your answer must be derived directly and strictly from the official website text provided above.
2. If the website text does not contain enough information or facts to fully answer the student's question, you MUST reply with exactly: "I couldn't verify the latest official information."
3. Do NOT invent, guess, assume, or extrapolate any names, dates, rules, placements, or contact info. If it is not in the text, you do not know it.
4. Keep the response friendly, professional, clear, and easy to read.
5. Maximum word count is 120 words.
6. Do NOT mention "According to the provided text..." or "Based on the website...". Just answer the question directly.
`;

  const formattedHistory = history.map(h => `${h.role === 'user' ? 'User' : 'Assistant'}: ${h.text}`).join('\n');
  const historyPrompt = history.length > 0 ? `\n=== RECENT CONVERSATION HISTORY ===\n${formattedHistory}\n================================\n` : '';

  const prompt = `System Instruction: ${systemInstruction}
${historyPrompt}
The student asks: "${userQuery}"

Return the response inside a JSON object:
{
  "answer": "response text or 'I couldn\'t verify the latest official information.'"
}`;

  try {
    const { responseText } = await callWithFallback(prompt);
    const trimmedText = responseText.trim();
    
    const match = trimmedText.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        const parsed = JSON.parse(match[0]);
        if (parsed && typeof parsed.answer === 'string') {
          return {
            answer: parsed.answer
          };
        }
      } catch (err) {
        console.warn("JSON parsing of Gemini response failed:", err.message, "Raw text:", trimmedText);
      }
    }
    
    return {
      answer: trimmedText.replace(/```json|```/g, '').trim()
    };
  } catch (error) {
    console.error("Gemini askGeminiWithWebsiteContext error:", error.message);
    return { answer: "I couldn't verify the latest official information." };
  }
};


