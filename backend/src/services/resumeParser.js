const fs = require('fs');
const path = require('path');

// Basic PDF text extraction + pattern matching
// Replace parse() body with AI/LLM call for production-grade parsing

const parse = async (filePath) => {
  let text = '';
  
  try {
    if (filePath.endsWith('.pdf')) {
      const pdfParse = require('pdf-parse');
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdfParse(dataBuffer);
      text = data.text;
    } else if (filePath.endsWith('.txt')) {
      text = fs.readFileSync(filePath, 'utf8');
    } else {
      return null; // docx requires separate library
    }
  } catch (err) {
    throw new Error(`Could not read file: ${err.message}`);
  }

  // Basic extraction patterns
  const emailMatch = text.match(/[\w.-]+@[\w.-]+\.\w{2,}/);
  const phoneMatch = text.match(/(\+?1?\s?)?(\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4})/);
  const linkedinMatch = text.match(/linkedin\.com\/in\/[\w-]+/i);

  // Experience years
  const expMatch = text.match(/(\d+)\+?\s*years?\s*(of\s*)?(experience|exp)/i);

  // Skills extraction - common tech keywords
  const techKeywords = [
    'JavaScript','TypeScript','Python','Java','C#','C++','Go','Rust','Ruby','PHP','Swift','Kotlin',
    'React','Angular','Vue','Node.js','Express','Django','FastAPI','Spring','Laravel',
    'PostgreSQL','MySQL','MongoDB','Redis','Elasticsearch','DynamoDB',
    'AWS','Azure','GCP','Docker','Kubernetes','Terraform','Jenkins','GitHub Actions',
    'Salesforce','ServiceNow','SAP','Oracle','Workday',
    'Machine Learning','Data Science','AI','NLP','Deep Learning',
    'REST API','GraphQL','Microservices','Agile','Scrum'
  ];
  const foundSkills = techKeywords.filter(skill =>
    new RegExp(`\\b${skill.replace(/\./g, '\\.')}\\b`, 'i').test(text)
  );

  // Extract name (first two capitalized words near top)
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const nameLine = lines.slice(0, 5).find(l => /^[A-Z][a-z]+ [A-Z][a-z]+/.test(l));

  return {
    extractedText: text.substring(0, 2000),
    email: emailMatch?.[0] || null,
    phone: phoneMatch?.[0] || null,
    linkedin: linkedinMatch?.[0] || null,
    name: nameLine || null,
    yearsOfExperience: expMatch ? parseInt(expMatch[1]) : null,
    skills: foundSkills,
    rawText: text
  };
};

module.exports = { parse };
