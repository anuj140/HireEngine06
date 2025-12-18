// Smart search parser utility
// Analyzes user input to detect keywords, experience, location, etc.

export interface ParsedSearch {
  keywords: string;
  location: string;
  experience: string;
  rawInput: string;
}

// Common location keywords
const locationKeywords = [
  'mumbai', 'delhi', 'bangalore', 'hyderabad', 'chennai', 'pune', 'kolkata',
  'ahmedabad', 'jaipur', 'surat', 'lucknow', 'kanpur', 'nagpur', 'indore',
  'thane', 'bhopal', 'visakhapatnam', 'patna', 'vadodara', 'ghaziabad',
  'ludhiana', 'agra', 'nashik', 'faridabad', 'meerut', 'rajkot', 'varanasi',
  'remote', 'work from home', 'wfh', 'hybrid', 'onsite', 'on-site', 'in-office'
];

// Experience patterns
const experiencePatterns = [
  { pattern: /(\d+)\s*(?:to|-)?\s*(\d+)\s*years?/i, extract: (match: RegExpMatchArray) => {
    const min = parseInt(match[1]);
    const max = parseInt(match[2]);
    return min <= 2 ? '0' : min <= 3 ? '3' : min <= 5 ? '5' : '10';
  }},
  { pattern: /(\d+)\s*years?/i, extract: (match: RegExpMatchArray) => {
    const years = parseInt(match[1]);
    return years === 0 ? '0' : years <= 1 ? '1' : years <= 3 ? '3' : years <= 5 ? '5' : '10';
  }},
  { pattern: /(\d+)\+?\s*years?/i, extract: (match: RegExpMatchArray) => {
    const years = parseInt(match[1]);
    return years <= 1 ? '1' : years <= 3 ? '3' : years <= 5 ? '5' : '10';
  }},
  { pattern: /fresher|entry\s*level|0\s*years?/i, extract: () => '0' },
  { pattern: /senior|lead|principal|10\+/i, extract: () => '10' },
  { pattern: /mid\s*level|mid\s*senior|3-5/i, extract: () => '3' },
  { pattern: /junior|associate|1-2/i, extract: () => '1' }
];

// Common job title/position keywords
const positionKeywords = [
  'developer', 'engineer', 'manager', 'analyst', 'designer', 'executive',
  'specialist', 'consultant', 'director', 'lead', 'senior', 'junior',
  'associate', 'intern', 'internship', 'fresher', 'trainee'
];

/**
 * Parses a search query string to extract keywords, location, and experience
 */
export function parseSearchQuery(query: string): ParsedSearch {
  const result: ParsedSearch = {
    keywords: '',
    location: '',
    experience: '',
    rawInput: query.trim()
  };

  if (!query || !query.trim()) {
    return result;
  }

  let remainingQuery = query.trim();
  const words = remainingQuery.toLowerCase().split(/\s+/);

  // Step 1: Extract experience
  for (const expPattern of experiencePatterns) {
    const match = remainingQuery.match(expPattern.pattern);
    if (match) {
      result.experience = expPattern.extract(match);
      // Remove the experience part from query
      remainingQuery = remainingQuery.replace(expPattern.pattern, '').trim();
      break;
    }
  }

  // Step 2: Extract location
  for (const loc of locationKeywords) {
    const locRegex = new RegExp(`\\b${loc}\\b`, 'i');
    if (locRegex.test(remainingQuery)) {
      result.location = remainingQuery.match(locRegex)?.[0] || loc;
      // Remove location from query
      remainingQuery = remainingQuery.replace(locRegex, '').trim();
      break;
    }
  }

  // Step 3: Remaining text is keywords (position, skills, etc.)
  result.keywords = remainingQuery
    .replace(/\s+/g, ' ')
    .trim();

  return result;
}

/**
 * Formats search results display string
 */
export function formatSearchDisplay(filters: {
  keywords?: string;
  location?: string;
  experience?: string;
}): string {
  const parts: string[] = [];
  
  if (filters.keywords) {
    parts.push(filters.keywords);
  }
  
  if (filters.location) {
    parts.push(`in ${filters.location}`);
  }
  
  if (filters.experience) {
    const expLabels: Record<string, string> = {
      '0': 'Fresher',
      '1': '1 Year',
      '3': '3 Years',
      '5': '5 Years',
      '10': '10+ Years'
    };
    parts.push(`${expLabels[filters.experience] || filters.experience} exp`);
  }
  
  return parts.length > 0 ? parts.join(' • ') : 'Search jobs';
}

/**
 * Detects if input contains a location
 */
export function detectLocation(input: string): string | null {
  const lowerInput = input.toLowerCase();
  for (const loc of locationKeywords) {
    if (lowerInput.includes(loc)) {
      return loc;
    }
  }
  return null;
}

/**
 * Detects if input contains experience requirement
 */
export function detectExperience(input: string): string | null {
  for (const expPattern of experiencePatterns) {
    const match = input.match(expPattern.pattern);
    if (match) {
      return expPattern.extract(match);
    }
  }
  return null;
}
