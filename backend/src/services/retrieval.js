import dotenv from 'dotenv';
dotenv.config();

// In-memory cache for scraped page text
const pageCache = {};
const CACHE_TTL = 3600 * 1000; // 1 hour cache TTL

// Helper to strip script, style tags and other markup from HTML
const cleanHtmlToText = (html) => {
  if (!html) return '';
  // Strip head, scripts, styles
  let cleanText = html.replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, '');
  cleanText = cleanText.replace(/<style[^>]*>([\s\S]*?)<\/style>/gi, '');
  cleanText = cleanText.replace(/<head[^>]*>([\s\S]*?)<\/head>/gi, '');
  // Strip remaining HTML tags
  cleanText = cleanText.replace(/<[^>]+>/g, ' ');
  // Compress whitespace
  cleanText = cleanText.replace(/\s+/g, ' ').trim();
  // Limit text to avoid overloading prompt limits
  return cleanText.slice(0, 6000);
};

/**
 * Maps query keywords to the official website URLs
 */
export const getRelevantUrl = (query) => {
  const q = query.toLowerCase();
  
  if (q.includes('placement') || q.includes('recruit') || q.includes('job') || q.includes('career') || q.includes('tp@saranathan')) {
    return 'https://saranathan.ac.in/placement.php';
  }
  if (q.includes('admission') || q.includes('fee') || q.includes('join') || q.includes('eligibility') || q.includes('merit')) {
    return 'https://saranathan.ac.in/admission.php';
  }
  if (q.includes('library') || q.includes('sports') || q.includes('hostel') || q.includes('canteen') || q.includes('facility') || q.includes('bus') || q.includes('transport')) {
    return 'https://saranathan.ac.in/facilities.php';
  }
  // Default fallback is the main homepage
  return 'https://saranathan.ac.in/index.php';
};

/**
 * Fetches page content with timeout and caching
 */
export const fetchWebsiteContent = async (url) => {
  const now = Date.now();
  
  // Return cached result if valid
  if (pageCache[url] && (now - pageCache[url].timestamp < CACHE_TTL)) {
    console.log(`[Cache Hit] Using cached text for ${url}`);
    return pageCache[url].text;
  }

  console.log(`[Cache Miss] Fetching live HTML from ${url}`);
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000); // 6 second timeout
    
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) PathMate orienter crawler'
      }
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`Failed HTTP status: ${response.status}`);
    }
    
    const html = await response.text();
    const textContent = cleanHtmlToText(html);
    
    // Store in cache
    pageCache[url] = {
      text: textContent,
      timestamp: now
    };
    
    return textContent;
  } catch (error) {
    console.error(`Scraping error for ${url}:`, error.message);
    // If we have an expired cache entry, fall back to it rather than crashing
    if (pageCache[url]) {
      console.log(`[Graceful Fallback] Returning expired cache entry for ${url}`);
      return pageCache[url].text;
    }
    throw error;
  }
};
