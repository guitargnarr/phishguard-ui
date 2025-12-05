# PhishGuard

**Security Domain: Threat Pattern Synthesis**

Real-time email threat detection powered by machine learning pattern extraction.

[![Live Demo](https://img.shields.io/badge/Live-Demo-teal)](https://phishguard-ui.vercel.app)
[![Detection Accuracy](https://img.shields.io/badge/Accuracy-87%25-green)](https://phishguard-ui.vercel.app)
[![Response Time](https://img.shields.io/badge/Response-%3C15ms-blue)](https://phishguard-ui.vercel.app)

---

## The Problem

**Enterprise security teams are drowning.**

- 3.4 billion phishing emails sent daily worldwide
- Average employee receives 14 malicious emails per year that bypass filters
- 91% of cyberattacks start with a phishing email
- Human review doesn't scale

Traditional filters catch obvious threats. Sophisticated attacks slip through because they mimic legitimate patterns.

---

## The Synthesis Approach

Instead of rule-based filtering, I mapped the structural patterns that distinguish threats from legitimate communication:

1. **Domain Analysis** - Studied 10,000+ email samples (phishing + legitimate)
2. **Pattern Extraction** - Identified 2,039 features that correlate with threat behavior
3. **Model Training** - Built classification system using NLP and ML
4. **Operator Interface** - Created dashboard security teams can use for validation

**Result:** 87% detection accuracy with <15ms response time.

---

## How It Works

```
Email Input → Feature Extraction → ML Classification → Risk Score → Operator Decision
                    ↓
           2,039 structural signals:
           - Header anomalies
           - URL pattern analysis
           - Linguistic markers
           - Sender reputation signals
           - Content structure analysis
```

**The operator (security analyst) validates and executes.** The system provides the map; humans make the call.

---

## Features

- **Real-time Analysis** - Paste email content, get instant risk assessment
- **Confidence Scoring** - Not just "phishing/safe" but probability with explanation
- **Feature Breakdown** - See which signals triggered the classification
- **Batch Processing** - Analyze multiple emails for pattern detection
- **API Ready** - Integrate with existing security workflows

---

## Tech Stack

- **Frontend:** Next.js, Radix UI, Tailwind CSS
- **ML Backend:** Python, scikit-learn, spaCy NLP
- **Feature Engineering:** 2,039 extracted signals
- **Deployment:** Vercel (UI), Python API

---

## Metrics

| Metric | Value |
|--------|-------|
| Detection Accuracy | 87% |
| False Positive Rate | 8% |
| Response Time | <15ms |
| Features Analyzed | 2,039 |
| Training Samples | 10,000+ |

---

## Quick Start

```bash
git clone https://github.com/guitargnarr/phishguard-ui
cd phishguard-ui
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## The Method

This project demonstrates a repeatable synthesis approach:

1. **Enter unfamiliar domain** (email security)
2. **Map patterns and structures** (2,039 threat signals)
3. **Build validation system** (ML classification + confidence scores)
4. **Deliver operator-ready artifact** (dashboard for security teams)

The same method applies to any domain where humans are overwhelmed by pattern recognition at scale.

---

## Author

**Matthew Scott** - AI-Enabled Strategist & Synthesist

- [Portfolio](https://resume.projectlavos.com)
- [GitHub](https://github.com/guitargnarr)
- [LinkedIn](https://linkedin.com/in/mscott77)

---

## License

MIT
