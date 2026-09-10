import type { DocumentType, ExtractedData } from './types';

/**
 * Detects document type from OCR-extracted text using keyword heuristics.
 */
export function detectDocumentType(text: string): DocumentType {
  const lower = text.toLowerCase();

  if (lower.includes('aadhaar') || lower.includes('आधार') || lower.includes('aadhar')) {
    return 'Aadhaar Card';
  }
  if (lower.includes('income tax') || lower.includes('pan') || /\b[A-Z]{5}[0-9]{4}[A-Z]\b/.test(text)) {
    return 'PAN Card';
  }
  if (lower.includes('passport') || lower.includes('republic of india') && lower.includes('passport no')) {
    return 'Passport';
  }
  if (lower.includes('driving') || lower.includes('licence') || lower.includes('license') || lower.includes('dl no')) {
    return 'Driving License';
  }
  if (lower.includes('voter') || lower.includes('election') || lower.includes('epic')) {
    return 'Voter ID (EPIC)';
  }
  if (lower.includes('certificate') || lower.includes('issued') || lower.includes('authorized')) {
    return 'Generic Certificate';
  }

  return 'Unknown';
}

/**
 * Parses key fields from OCR text using regex patterns and heuristics
 * tailored for Indian identity documents.
 */
export function parseFields(text: string, docType: DocumentType): ExtractedData {
  const cleanText = text.replace(/\n{3,}/g, '\n\n').trim();
  const lower = cleanText.toLowerCase();

  const result: ExtractedData = {
    id_number: '',
    name: '',
    date: '',
  };

  // --- ID Number extraction ---
  result.id_number = extractIdNumber(cleanText, docType);

  // --- Name extraction ---
  result.name = extractName(cleanText, docType);

  // --- Date extraction ---
  result.date = extractDate(cleanText, docType);

  // --- Father/Parent name ---
  const fatherMatch = cleanText.match(/(?:father|parent|s\/o|d\/o|w\/o|so|do|wo)\s*[:\-]?\s*([A-Z][A-Za-z\s]{2,40})/i);
  if (fatherMatch) {
    result.father_name = fatherMatch[1].trim().split('\n')[0].trim();
  }

  // --- Address ---
  const addrMatch = cleanText.match(/(?:address|addr|residence)\s*[:\-]?\s*([A-Za-z0-9\s,.\-\/#]{10,120})/i);
  if (addrMatch) {
    result.address = addrMatch[1].trim().split('\n')[0].trim();
  }

  // --- Gender ---
  const genderMatch = lower.match(/\b(male|female|transgender|m|f)\b/i);
  if (genderMatch) {
    const g = genderMatch[0].toLowerCase();
    if (g === 'm') result.gender = 'Male';
    else if (g === 'f') result.gender = 'Female';
    else result.gender = genderMatch[0];
  }

  // --- Issuer ---
  if (lower.includes('government of india') || lower.includes('govt of india')) {
    result.issuer = 'Government of India';
  } else if (lower.includes('government of') || lower.includes('govt of')) {
    const issuerMatch = cleanText.match(/(?:government of|govt of)\s+([A-Za-z\s]+)/i);
    if (issuerMatch) result.issuer = `Government of ${issuerMatch[1].trim()}`;
  }

  return result;
}

function extractIdNumber(text: string, docType: DocumentType): string {
  // Aadhaar: 12-digit number with spaces (XXXX XXXX XXXX)
  if (docType === 'Aadhaar Card') {
    const aadhaarMatch = text.match(/\b(\d{4}\s?\d{4}\s?\d{4})\b/);
    if (aadhaarMatch) return aadhaarMatch[1].replace(/\s/g, ' ').trim();
  }

  // PAN: 5 letters + 4 digits + 1 letter (ABCDE1234F)
  if (docType === 'PAN Card') {
    const panMatch = text.match(/\b([A-Z]{5}\d{4}[A-Z])\b/);
    if (panMatch) return panMatch[1];
  }

  // Passport: 1 letter + 7 digits (A1234567)
  if (docType === 'Passport') {
    const passportMatch = text.match(/\b([A-Z]\d{7})\b/);
    if (passportMatch) return passportMatch[1];
  }

  // Driving License: varies by state, typically alphanumeric
  if (docType === 'Driving License') {
    const dlMatch = text.match(/\b([A-Z]{2}[-\s]?\d{2}[-\s]?\d{4,})\b/) || text.match(/\b([A-Z]{2}\d{2}\s?\d{4,})\b/);
    if (dlMatch) return dlMatch[1].replace(/[-\s]/g, ' ').trim();
  }

  // Voter ID: 3 letters + 7 digits (ABC1234567)
  if (docType === 'Voter ID (EPIC)') {
    const epicMatch = text.match(/\b([A-Z]{3}\d{7})\b/);
    if (epicMatch) return epicMatch[1];
  }

  // Generic: try common ID patterns
  const genericPatterns = [
    /\b([A-Z]{5}\d{4}[A-Z])\b/, // PAN
    /\b(\d{4}\s?\d{4}\s?\d{4})\b/, // Aadhaar
    /\b([A-Z]\d{7})\b/, // Passport
    /\b([A-Z]{3}\d{7})\b/, // EPIC
    /\b([A-Z]{2}\d{2}\s?\d{4,})\b/, // DL
    /\b([A-Z0-9]{8,15})\b/, // Generic alphanumeric
  ];

  for (const pattern of genericPatterns) {
    const match = text.match(pattern);
    if (match) return match[1];
  }

  return '';
}

function extractName(text: string, docType: DocumentType): string {
  // Strategy: look for "Name" label followed by the name
  const namePatterns = [
    /(?:name|namo|naam)\s*[:\-]?\s*([A-Z][A-Za-z\s]{2,40})/i,
    /(?:name of|holder|bearer)\s*[:\-]?\s*([A-Z][A-Za-z\s]{2,40})/i,
  ];

  for (const pattern of namePatterns) {
    const match = text.match(pattern);
    if (match) {
      const name = match[1].trim().split('\n')[0].trim();
      if (name.length >= 3 && !/^\d+$/.test(name)) {
        return cleanName(name);
      }
    }
  }

  // For Aadhaar: name is usually on its own line after the Aadhaar number
  // or near "Name" keyword
  if (docType === 'Aadhaar Card') {
    const lines = text.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // Name lines typically contain only letters and spaces, no numbers
      if (/^[A-Z][A-Za-z\s]{3,40}$/.test(line) && !line.toLowerCase().includes('government')) {
        return cleanName(line);
      }
    }
  }

  // For PAN: name appears after "Name" or "Permanent Account Number"
  if (docType === 'PAN Card') {
    const lines = text.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (/^[A-Z][A-Za-z\s]{3,40}$/.test(line) &&
          !line.toLowerCase().includes('income') &&
          !line.toLowerCase().includes('government') &&
          !line.toLowerCase().includes('tax')) {
        return cleanName(line);
      }
    }
  }

  // Fallback: find a line that looks like a name (all caps, 2+ words)
  const lines = text.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
  for (const line of lines) {
    if (/^[A-Z][A-Za-z\s]{3,40}$/.test(line) && line.split(/\s+/).length >= 2) {
      return cleanName(line);
    }
  }

  return '';
}

function extractDate(text: string, _docType: DocumentType): string {
  // Common date formats in Indian documents
  const datePatterns = [
    // DD/MM/YYYY
    /\b(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})\b/,
    // DD-MM-YYYY
    /\b(\d{1,2}\s*[\/\-\.]\s*\d{1,2}\s*[\/\-\.]\s*\d{4})\b/,
    // DD MMM YYYY
    /\b(\d{1,2}\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{4})\b/i,
    // YYYY-MM-DD
    /\b(\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2})\b/,
  ];

  for (const pattern of datePatterns) {
    const match = text.match(pattern);
    if (match) return match[1];
  }

  return '';
}

function cleanName(name: string): string {
  return name
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}
