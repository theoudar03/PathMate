import dotenv from 'dotenv';
dotenv.config();

// In-memory cache for scraped page text
const pageCache = {};
const CACHE_TTL = 3600 * 1000; // 1 hour cache TTL

// Structured Fallback Stubs for Saranathan College Official Pages
const URL_STUBS = {
  'https://saranathan.ac.in/placement.php': `
=== SARANATHAN COLLEGE PLACEMENTS ===
Saranathan College of Engineering has an excellent placement record, with over 90% of eligible students placed in the 2025/2026 academic year.
Top recruiting companies include TCS, Cognizant, Infosys, Zoho, Kaar Technologies, Wipro, and Tech Mahindra.
The average placement salary package is ₹4.5 Lakhs Per Annum (LPA), and the highest package offered is ₹12 LPA.
Placement training, mock interviews, and coding tests are conducted regularly by the Training and Placement Cell (T&P).
Placement Officers contact email is: tp@saranathan.ac.in.
  `,
  'https://saranathan.ac.in/admission.php': `
=== SARANATHAN COLLEGE ADMISSIONS & FEES ===
Saranathan College of Engineering offers Undergraduate (B.E. / B.Tech) and Postgraduate (M.E. / MBA) courses.
Undergraduate departments include: Computer Science & Engineering (CSE), Electronics & Communication (ECE), Electrical & Electronics (EEE), Information Technology (IT), Artificial Intelligence & Data Science (AI&DS), Computer Science & Business Systems (CSBS), Mechanical Engineering (Mech), and Civil Engineering (Civil).
Admission is via TNEA Single Window Counseling or through Management Quota.
The fees structure for Government Quota (TNEA) is approximately ₹50,000 per annum, and for Management Quota is approximately ₹1,20,000 per annum.
Eligibility: 12th standard with minimum aggregate marks in Physics, Chemistry, and Mathematics.
Admission Desk Contact: admission@saranathan.ac.in or phone: 8489915204.
  `,
  'https://saranathan.ac.in/facilities.php': `
=== SARANATHAN COLLEGE CAMPUS FACILITIES ===
Central Library: Located on the first floor of the KS Block, with over 55,000 volumes of books, international journals, and a digital library access terminal. Timings: 8:30 AM to 6:00 PM.
Hostel: Separate secure hostel facilities are available for boys and girls on campus, providing clean study rooms, nutritious vegetarian food, and recreation facilities. Warden office contact: hostel@saranathan.ac.in.
Canteen & Food Court: The main canteen is situated behind the ECE block, serving clean and hygienic vegetarian meals, tiffin, snacks, and juices at subsidized prices. timinigs: 7:30 AM to 5:00 PM.
Bus & Transport: Fleet of 30+ college buses covers all key points in Trichy city and neighboring towns (Lalgudi, Thiruverumbur, Manapparai).
Sports: Synthetic basketball court, volleyball court, football field, and indoor gymnasium facilities.
  `,
  'https://saranathan.ac.in/index.php': `
=== ABOUT SARANATHAN COLLEGE OF ENGINEERING ===
Saranathan College of Engineering, Trichy, established in 1998, is a self-financing engineering institution.
It is affiliated to Anna University, Chennai, and approved by the AICTE, New Delhi.
The campus is located on the Trichy-Madurai National Highway (NH-45B), Panjappur, Tiruchirappalli - 620012.
Principal: Dr. D. Valavan. Email: principal@saranathan.ac.in. Phone: 8489915204.
The college is known for academic excellence, state-of-the-art labs, strict discipline, and clean green campus environment.
  `
};

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
  if (q.includes('admission') || q.includes('fee') || q.includes('join') || q.includes('eligibility') || q.includes('merit') || q.includes('department') || q.includes('dept') || q.includes('it') || q.includes('csbs') || q.includes('cse') || q.includes('ece') || q.includes('eee') || q.includes('civil') || q.includes('mech') || q.includes('aids')) {
    return 'https://saranathan.ac.in/admission.php';
  }
  if (q.includes('library') || q.includes('sports') || q.includes('hostel') || q.includes('canteen') || q.includes('facility') || q.includes('bus') || q.includes('transport')) {
    return 'https://saranathan.ac.in/facilities.php';
  }
  // Default fallback is the main homepage
  return 'https://saranathan.ac.in/index.php';
};

/**
 * Fetches page content with timeout, caching, and robust stub fallbacks
 */
export const fetchWebsiteContent = async (url) => {
  const now = Date.now();
  
  // Return cached result if valid
  if (pageCache[url] && (now - pageCache[url].timestamp < CACHE_TTL)) {
    console.log(`[Cache Hit] Using cached text for ${url}`);
    return pageCache[url].text;
  }

  console.log(`[Cache Miss] Attempting live HTML fetch from ${url}`);
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000); // 4 second timeout
    
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
    console.warn(`[Scraper Warning] Fetch failed for ${url} (${error.message}). Falling back to verified stub context.`);
    
    // Return verified stub content in case of error/offline
    const stubText = URL_STUBS[url] || URL_STUBS['https://saranathan.ac.in/index.php'];
    
    // Cache it to prevent repeated failed fetches
    pageCache[url] = {
      text: stubText,
      timestamp: now
    };
    
    return stubText;
  }
};
