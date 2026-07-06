import Groq from 'groq-sdk';
import { HfInference } from '@huggingface/inference';

// Initialize with fallback
const GROQ_KEY = process.env.GROQ_API_KEY || '';
const HF_KEY = process.env.HUGGINGFACE_API_KEY || '';

console.log('🔑 Groq API Key:', GROQ_KEY ? '✅ Loaded' : '❌ Missing');

const groq = new Groq({
  apiKey: GROQ_KEY
});

const hf = new HfInference(HF_KEY);

// In-memory vector store
let knowledgeBase = [];

// Initialize knowledge base
export const initializeRAG = async () => {
  try {
    console.log('🔍 Initializing EXPANDED RAG Knowledge Base (50+ Topics)...');
    
    if (knowledgeBase.length > 0) {
      console.log(`✅ Knowledge base ready with ${knowledgeBase.length} documents`);
      return;
    }

    const documents = [
      // ===== FINANCIAL RATIOS (10) =====
      {
        id: "fin-ratio-1",
        text: "Current Ratio measures liquidity. Formula: Current Assets / Current Liabilities. Healthy range: 1.5-3.0. Below 1.0 indicates potential liquidity crisis. Above 3.0 may indicate inefficient use of assets.",
        category: "financial_ratios"
      },
      {
        id: "fin-ratio-2",
        text: "Debt-to-Equity Ratio measures financial leverage. Formula: Total Debt / Total Equity. Below 1.0 is conservative, 1.0-2.0 is moderate risk, above 2.0 is high risk. Industry-dependent benchmark.",
        category: "financial_ratios"
      },
      {
        id: "fin-ratio-3",
        text: "Quick Ratio (Acid Test) measures immediate liquidity. Formula: (Current Assets - Inventory) / Current Liabilities. Healthy: >1.0. More stringent than current ratio, excludes inventory.",
        category: "financial_ratios"
      },
      {
        id: "fin-ratio-4",
        text: "Return on Assets (ROA) measures profitability. Formula: Net Income / Total Assets. Above 5% is good, above 10% is excellent. Shows how efficiently assets generate profit.",
        category: "financial_ratios"
      },
      {
        id: "fin-ratio-5",
        text: "Return on Equity (ROE) measures shareholder returns. Formula: Net Income / Shareholder Equity. Above 15% is strong. Warren Buffett's key metric. DuPont analysis breaks it down.",
        category: "financial_ratios"
      },
      {
        id: "fin-ratio-6",
        text: "Profit Margin measures operational efficiency. Formula: Net Income / Revenue * 100. >10% is good for most industries. Varies widely by sector. Tech: 15-25%, Retail: 2-5%.",
        category: "financial_ratios"
      },
      {
        id: "fin-ratio-7",
        text: "Asset Turnover measures efficiency. Formula: Revenue / Total Assets. Higher is better. Shows how effectively company uses assets to generate sales. Industry-specific benchmarks.",
        category: "financial_ratios"
      },
      {
        id: "fin-ratio-8",
        text: "Interest Coverage Ratio measures debt servicing ability. Formula: EBIT / Interest Expense. Above 2.5 is safe, below 1.5 is risky. Shows ability to pay interest from operating income.",
        category: "financial_ratios"
      },
      {
        id: "fin-ratio-9",
        text: "Price-to-Earnings (P/E) Ratio for valuation. Formula: Stock Price / Earnings Per Share. Average market P/E: 15-20. Growth stocks: 25+. Value stocks: 10-15. Compare to industry peers.",
        category: "financial_ratios"
      },
      {
        id: "fin-ratio-10",
        text: "Working Capital measures short-term financial health. Formula: Current Assets - Current Liabilities. Positive working capital indicates company can meet obligations. Negative signals distress.",
        category: "financial_ratios"
      },

      // ===== BANKRUPTCY & RISK (8) =====
      {
        id: "bankruptcy-1",
        text: "Altman Z-Score predicts bankruptcy. Z > 2.99 = safe zone, 1.81-2.99 = gray zone, < 1.81 = distress zone. Uses multiple financial ratios: working capital, retained earnings, EBIT, market value, sales.",
        category: "bankruptcy"
      },
      {
        id: "bankruptcy-2",
        text: "Warning signs of bankruptcy: Negative cash flow for 2+ years, declining revenue trends, high debt load, inability to pay suppliers on time, management turnover, loss of major customers, deteriorating ratios.",
        category: "bankruptcy"
      },
      {
        id: "bankruptcy-3",
        text: "Cash flow analysis critical for bankruptcy prediction. Operating cash flow must be positive. Free cash flow = Operating CF - Capital Expenditures. Negative FCF for multiple quarters is red flag.",
        category: "bankruptcy"
      },
      {
        id: "bankruptcy-4",
        text: "Beneish M-Score detects earnings manipulation. M > -1.78 suggests manipulation. Uses 8 variables: DSRI, GMI, AQI, SGI, DEPI, SGAI, LVGI, TATA. Helps identify accounting fraud.",
        category: "bankruptcy"
      },
      {
        id: "bankruptcy-5",
        text: "Credit risk assessment: FICO scores, Moody's ratings (Aaa-C), S&P ratings (AAA-D). Investment grade: BBB- or higher. Below BBB- is junk status. Default probability correlates with rating.",
        category: "bankruptcy"
      },
      {
        id: "bankruptcy-6",
        text: "Liquidity crisis indicators: Inability to refinance debt, credit line withdrawal, supplier payment delays, asset fire sales, emergency capital raises, covenant breaches, auditor going concern warnings.",
        category: "bankruptcy"
      },
      {
        id: "bankruptcy-7",
        text: "Solvency ratios: Debt-to-Assets (< 0.4 conservative), Equity Ratio (> 0.5 healthy), Debt Service Coverage (> 1.25 safe). Measures long-term financial stability and debt burden.",
        category: "bankruptcy"
      },
      {
        id: "bankruptcy-8",
        text: "Chapter 7 vs Chapter 11 bankruptcy: Chapter 7 = liquidation (company closes), Chapter 11 = reorganization (company continues operating, restructures debt). Chapter 11 gives survival chance.",
        category: "bankruptcy"
      },

      // ===== CYBERSECURITY (10) =====
      {
        id: "cyber-1",
        text: "Phishing red flags: Suspicious sender, urgency tactics, spelling/grammar errors, unexpected attachments, requests for credentials, mismatched URLs, generic greetings, suspicious links.",
        category: "cybersecurity"
      },
      {
        id: "cyber-2",
        text: "URL security checklist: HTTPS encryption required, legitimate domain spelling, no suspicious subdomains, valid SSL certificate, no URL shorteners, check certificate details, verify domain age.",
        category: "cybersecurity"
      },
      {
        id: "cyber-3",
        text: "Malicious URL patterns: Homograph attacks (look-alike characters), typosquatting (micr0soft.com), suspicious TLDs (.tk, .ml, .ga), IP addresses instead of domains, excessive redirects.",
        category: "cybersecurity"
      },
      {
        id: "cyber-4",
        text: "Ransomware protection: Regular backups (3-2-1 rule), patch management, email filtering, endpoint protection, network segmentation, employee training, incident response plan, offline backup copies.",
        category: "cybersecurity"
      },
      {
        id: "cyber-5",
        text: "Data breach response: Contain breach immediately, assess damage, notify affected parties within 72 hours, investigate root cause, implement fixes, document everything, legal compliance (GDPR, CCPA).",
        category: "cybersecurity"
      },
      {
        id: "cyber-6",
        text: "SQL Injection prevention: Parameterized queries, input validation, least privilege database accounts, WAF deployment, regular security audits, prepared statements, ORM frameworks, input sanitization.",
        category: "cybersecurity"
      },
      {
        id: "cyber-7",
        text: "XSS (Cross-Site Scripting) prevention: Output encoding, Content Security Policy (CSP), input validation, HTTPOnly cookies, X-XSS-Protection header, escape user input, sanitize HTML content.",
        category: "cybersecurity"
      },
      {
        id: "cyber-8",
        text: "Authentication best practices: Multi-factor authentication (MFA), strong password policies (12+ characters, complexity), password hashing (bcrypt, Argon2), session management, rate limiting, account lockout.",
        category: "cybersecurity"
      },
      {
        id: "cyber-9",
        text: "API security: OAuth 2.0 / JWT authentication, rate limiting, input validation, HTTPS only, API keys rotation, logging/monitoring, CORS configuration, version control, deprecation policies.",
        category: "cybersecurity"
      },
      {
        id: "cyber-10",
        text: "Zero Trust Architecture: Never trust, always verify. Micro-segmentation, least privilege access, continuous authentication, device verification, encrypted communications, monitoring all traffic.",
        category: "cybersecurity"
      },

      // ===== DOCUMENT FRAUD (8) =====
      {
        id: "doc-fraud-1",
        text: "Invoice fraud indicators: Round numbers, duplicate invoices, rush payment requests, new vendors without verification, missing purchase orders, unusual payment terms, sequential invoice numbers from different vendors.",
        category: "document_fraud"
      },
      {
        id: "doc-fraud-2",
        text: "Document tampering signs: Inconsistent fonts, pixelation around text, metadata mismatches, compression artifacts, altered dates, copy-paste regions visible, inconsistent print quality, layering anomalies.",
        category: "document_fraud"
      },
      {
        id: "doc-fraud-3",
        text: "Business document verification: Check watermarks, verify signatures, cross-reference dates, validate logos, examine metadata (creation/modification dates), compare with originals, UV light inspection.",
        category: "document_fraud"
      },
      {
        id: "doc-fraud-4",
        text: "Check fraud detection: MICR line verification, signature analysis, paper stock examination, microprinting inspection, watermark verification, UV security features, sequential numbering validation.",
        category: "document_fraud"
      },
      {
        id: "doc-fraud-5",
        text: "Contract fraud indicators: Missing signatures, incorrect dates, modified clauses, inconsistent formatting, unauthorized amendments, missing appendices, forged notary stamps, altered party names.",
        category: "document_fraud"
      },
      {
        id: "doc-fraud-6",
        text: "Identity document verification: Hologram inspection, microtext examination, photo matching, date consistency, security features, chip authentication (ePassports), blacklist checking, biometric verification.",
        category: "document_fraud"
      },
      {
        id: "doc-fraud-7",
        text: "Financial statement manipulation: Revenue recognition tricks, expense capitalization, reserves manipulation, off-balance sheet items, related party transactions, non-GAAP metrics abuse, footnote obscuration.",
        category: "document_fraud"
      },
      {
        id: "doc-fraud-8",
        text: "OCR verification: Cross-check extracted data, validate formats, check logical consistency, compare with supporting documents, flag unusual patterns, manual review for high-value transactions.",
        category: "document_fraud"
      },

      // ===== COMPLIANCE & REGULATIONS (10) =====
      {
        id: "compliance-1",
        text: "SOX (Sarbanes-Oxley) compliance: Internal controls documentation, financial reporting accuracy, CEO/CFO certifications, independent audits, whistleblower protections, audit committee independence, IT controls.",
        category: "compliance"
      },
      {
        id: "compliance-2",
        text: "GDPR (EU) requirements: Data protection by design, user consent, breach notification (72 hours), right to deletion, data portability, privacy policies, DPO appointment, cross-border data transfer rules.",
        category: "compliance"
      },
      {
        id: "compliance-3",
        text: "PCI DSS (Payment Card) compliance: Encrypt cardholder data, secure networks, access controls, monitoring, vulnerability management, security policies, regular testing, quarterly scans, annual audits.",
        category: "compliance"
      },
      {
        id: "compliance-4",
        text: "HIPAA (Healthcare) requirements: PHI protection, access controls, encryption (at rest and transit), audit trails, business associate agreements, breach notification, minimum necessary rule, patient rights.",
        category: "compliance"
      },
      {
        id: "compliance-5",
        text: "KYC (Know Your Customer): Identity verification, address proof, beneficial ownership, PEP screening, sanctions lists, risk assessment, ongoing monitoring, enhanced due diligence for high-risk customers.",
        category: "compliance"
      },
      {
        id: "compliance-6",
        text: "AML (Anti-Money Laundering): Transaction monitoring, suspicious activity reporting (SAR), customer due diligence, record keeping (5 years), employee training, compliance officer, risk-based approach.",
        category: "compliance"
      },
      {
        id: "compliance-7",
        text: "FCPA (Foreign Corrupt Practices): Prohibition on bribing foreign officials, accurate books and records, internal controls, due diligence on third parties, compliance programs, voluntary disclosure benefits.",
        category: "compliance"
      },
      {
        id: "compliance-8",
        text: "Basel III banking standards: Capital adequacy (8% minimum), liquidity coverage ratio (LCR > 100%), net stable funding ratio, leverage ratio (3% minimum), stress testing, countercyclical buffers.",
        category: "compliance"
      },
      {
        id: "compliance-9",
        text: "OFAC sanctions compliance: Screen against SDN list, blocked persons, embargoed countries, 50% rule (indirect ownership), real-time screening, transaction filtering, annual audits, voluntary disclosure.",
        category: "compliance"
      },
      {
        id: "compliance-10",
        text: "SEC regulations: 10-K annual reports, 10-Q quarterly reports, 8-K current reports, Regulation FD (fair disclosure), insider trading rules, proxy statements, beneficial ownership (13D/13G), Form 4 filings.",
        category: "compliance"
      },

      // ===== RISK MANAGEMENT (6) =====
      {
        id: "risk-1",
        text: "Enterprise Risk Management (ERM) framework: Risk identification, assessment (likelihood + impact), mitigation strategies, monitoring, reporting, continuous improvement, ISO 31000 standard, COSO framework.",
        category: "risk_management"
      },
      {
        id: "risk-2",
        text: "Financial risk mitigation: Diversification, hedging strategies, insurance coverage, cash reserves (3-6 months operating expenses), stress testing, scenario analysis, risk transfer, contingency planning.",
        category: "risk_management"
      },
      {
        id: "risk-3",
        text: "Operational risk: Process failures, system outages, human errors, fraud, compliance violations. Mitigation: Standard operating procedures, business continuity plans, backup systems, employee training.",
        category: "risk_management"
      },
      {
        id: "risk-4",
        text: "Market risk (price volatility): Interest rate risk, currency risk, commodity risk, equity risk. Tools: Value at Risk (VaR), stress testing, sensitivity analysis, hedging with derivatives (options, futures).",
        category: "risk_management"
      },
      {
        id: "risk-5",
        text: "Credit risk management: Credit scoring models, collateral requirements, covenants, diversification, credit insurance, netting agreements, credit derivatives (CDS), continuous monitoring, early warning systems.",
        category: "risk_management"
      },
      {
        id: "risk-6",
        text: "Reputational risk: Media monitoring, crisis communication plans, stakeholder engagement, ethics programs, social media governance, transparency, rapid response teams, executive visibility, brand protection.",
        category: "risk_management"
      },

      // ===== FRAUD DETECTION & FORENSICS (8) =====
      {
        id: "forensics-1",
        text: "Benford's Law in fraud detection: First digit distribution follows logarithmic pattern. 1 appears ~30%, 9 appears ~4.6%. Deviations suggest manipulation. Applies to naturally occurring data sets.",
        category: "fraud_detection"
      },
      {
        id: "forensics-2",
        text: "Red flags in expense reports: Round amounts, repeated amounts, just-below-approval-threshold, missing receipts, weekend/holiday submissions, non-business expenses, duplicate claims, inflated mileage.",
        category: "fraud_detection"
      },
      {
        id: "forensics-3",
        text: "Procurement fraud indicators: Split orders to avoid approvals, sole-source justifications, change orders exceeding original contract, favored vendors, conflicts of interest, inflated pricing, ghost vendors.",
        category: "fraud_detection"
      },
      {
        id: "forensics-4",
        text: "Payroll fraud schemes: Ghost employees, time theft, rate manipulation, commission fraud, workers' comp fraud, expense reimbursement abuse. Detection: Analytics, access controls, segregation of duties.",
        category: "fraud_detection"
      },
      {
        id: "forensics-5",
        text: "Financial statement fraud: Channel stuffing (premature revenue), cookie jar reserves, big bath charges, materiality manipulation, related party transactions, off-balance sheet financing, earnings smoothing.",
        category: "fraud_detection"
      },
      {
        id: "forensics-6",
        text: "Digital forensics chain of custody: Documentation of evidence collection, preservation, analysis, reporting. Hash verification, write-blocking, imaging, metadata preservation, court admissibility requirements.",
        category: "fraud_detection"
      },
      {
        id: "forensics-7",
        text: "Interview techniques for fraud investigations: Build rapport, open-ended questions, observe body language, allow silence, confirm facts, document responses, Miranda rights (criminal cases), follow-up interviews.",
        category: "fraud_detection"
      },
      {
        id: "forensics-8",
        text: "Data analytics for fraud detection: Anomaly detection, pattern recognition, predictive modeling, network analysis, text mining, visualization, continuous monitoring, machine learning models, exception reporting.",
        category: "fraud_detection"
      }
    ];

    console.log(`📚 Generating embeddings for ${documents.length} documents...`);

    for (const doc of documents) {
      try {
        const embedding = await generateEmbedding(doc.text);
        knowledgeBase.push({
          ...doc,
          embedding: embedding
        });
      } catch (error) {
        console.error(`Error embedding doc ${doc.id}:`, error);
      }
    }

    console.log(`✅ Knowledge base initialized with ${knowledgeBase.length} documents`);
    console.log(`📊 Categories: ${[...new Set(documents.map(d => d.category))].join(', ')}`);

  } catch (error) {
    console.error('❌ RAG initialization error:', error);
  }
};


async function generateEmbedding(text) {
  try {
    const response = await hf.featureExtraction({
      model: 'sentence-transformers/all-MiniLM-L6-v2',
      inputs: text
    });
    return response;
  } catch (error) {
    console.error('Embedding error:', error);
    return simpleEmbedding(text);
  }
}

function simpleEmbedding(text) {
  const words = text.toLowerCase().split(/\s+/);
  const embedding = new Array(384).fill(0);
  
  words.forEach((word, idx) => {
    const hash = word.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    embedding[Math.abs(hash) % 384] += 1;
  });
  
  return embedding;
}

function cosineSimilarity(vecA, vecB) {
  const dotProduct = vecA.reduce((sum, a, idx) => sum + a * vecB[idx], 0);
  const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
  const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
  return dotProduct / (magnitudeA * magnitudeB);
}

async function queryKnowledgeBase(query, topK = 3) {
  try {
    if (knowledgeBase.length === 0) {
      await initializeRAG();
    }

    const queryEmbedding = await generateEmbedding(query);

    const similarities = knowledgeBase.map(doc => ({
      ...doc,
      similarity: cosineSimilarity(queryEmbedding, doc.embedding)
    }));

    const topDocs = similarities
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK);

    return topDocs;

  } catch (error) {
    console.error('Knowledge base query error:', error);
    return [];
  }
}

export const explainAnalysis = async (req, res) => {
  try {
    const { analysisType, result, context } = req.body;
    
    if (!analysisType || !result) {
      return res.status(400).json({
        success: false,
        error: 'analysisType and result are required'
      });
    }

    console.log(`🤖 AI Mentor explaining ${analysisType}...`);

    const ragQuery = generateRAGQuery(analysisType, result);
    const relevantDocs = await queryKnowledgeBase(ragQuery, 3);
    
    console.log(`📚 Retrieved ${relevantDocs.length} relevant documents`);

    const prompt = generatePromptWithRAG(analysisType, result, context, relevantDocs);

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `You are an expert financial AI analyst with comprehensive knowledge of finance, risk management, and compliance. Provide clear, actionable explanations.`
        },
        {
          role: "user",
          content: prompt
        }
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.7,
      max_tokens: 2000
    });

    const explanation = completion.choices[0]?.message?.content;

    res.json({
      success: true,
      explanation,
      analysisType,
      sourcesUsed: relevantDocs.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ AI Mentor error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate explanation',
      details: error.message
    });
  }
};

export const chatWithMentor = async (req, res) => {
  try {
    const { message, conversationHistory, analysisContext } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'message is required'
      });
    }

    console.log('💬 AI Mentor chat:', message);

    let relevantDocs = [];
    try {
      relevantDocs = await queryKnowledgeBase(message, 2);
    } catch (error) {
      console.error('Knowledge base query error:', error);
    }

    const messages = [
      {
        role: "system",
        content: `You are an AI financial mentor. Answer questions clearly and concisely in a friendly, professional tone.
        
${analysisContext && Object.keys(analysisContext).length > 0 ? `Analysis Context:\n${JSON.stringify(analysisContext, null, 2)}\n` : ''}
${relevantDocs.length > 0 ? `Relevant Knowledge:\n${relevantDocs.map(d => d.text).join('\n\n')}` : ''}`
      }
    ];

    if (conversationHistory && conversationHistory.length > 0) {
      messages.push(...conversationHistory.slice(-6));
    }

    messages.push({
      role: "user",
      content: message
    });

    console.log('🤖 Calling Groq API...');
    
    const completion = await groq.chat.completions.create({
      messages,
      model: "llama-3.3-70b-versatile",
      temperature: 0.8,
      max_tokens: 800
    });

    const reply = completion.choices[0]?.message?.content;

    res.json({
      success: true,
      reply,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Chat error:', error);
    console.error('Error details:', error.message);
    console.error('Stack:', error.stack);
    
    res.status(500).json({
      success: false,
      error: 'Chat failed',
      details: error.message
    });
  }
};

function generateRAGQuery(analysisType, result) {
  const queries = {
    'financial-risk': `financial ratios liquidity solvency bankruptcy risk ${result.risk_category || ''}`,
    'cybersecurity': `phishing URL security malicious ${result.prediction || ''}`,
    'document-validator': `document fraud tampering detection ${result.document_type || ''}`,
    'invoice-fraud': `invoice fraud detection red flags ${result.fraud_type || ''}`
  };
  return queries[analysisType] || analysisType;
}

function generatePromptWithRAG(analysisType, result, context, relevantDocs) {
  const knowledgeContext = relevantDocs.length > 0
    ? `\n\nKNOWLEDGE BASE:\n${relevantDocs.map((d, i) => `[${i + 1}] ${d.text}`).join('\n\n')}`
    : '';

  const prompts = {
    'financial-risk': `Analyze: Risk=${result.risk_score * 100}%, Category=${result.risk_category}${knowledgeContext}`,
    'cybersecurity': `Analyze: ${result.prediction}, Risk=${result.risk_score * 100}%${knowledgeContext}`,
    'document-validator': `Analyze: ${result.verdict}, Type=${result.document_type}${knowledgeContext}`,
    'invoice-fraud': `Analyze: Fraud=${result.is_fraud}${knowledgeContext}`
  };

  return prompts[analysisType] || `Explain: ${JSON.stringify(result)}${knowledgeContext}`;
}
