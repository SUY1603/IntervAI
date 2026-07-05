# IntervAI
> **AI-Powered Technical Interview Strategy & Practice Simulator Dashboard**

IntervAI is a full-stack, enterprise-grade web application designed to help candidates prepare for target job roles. By comparing candidate resumes against specific Job Descriptions (JD), the platform estimates ATS compatibility scores, constructs a structured 3-Pillar motivated-defense strategy, compiles print-ready A4 resumes, and provides an immersive, voice-interactive mock interview simulation environment.

---

## Table of Contents
- [Features](#features)
- [Architecture Overview](#architecture-overview)
- [Folder Structure](#folder-structure)
- [Database Schemas](#database-schemas)
- [API Routes](#api-routes)
- [Third-Party Integrations](#third-party-integrations)
- [Visual Previews](#visual-previews)
- [Environment Variables](#environment-variables)
- [Getting Started](#getting-started)
- [Dependencies](#dependencies)

---

## Features

| Feature | Description |
|---|---|
| **Collapsible Sidebar** | Gemini-inspired navigation drawer displaying past strategy plans and user profile credentials. |
| **Secure Registration / Sign-in** | Full session authentication via custom JSON Web Token (JWT) route guards. |
| **ATS Score Auditing** | Calculates original vs tailored resume match scores against target JDs and highlights critical skill gaps. |
| **Motivated Defense Roadmap** | Generates a 3-pillar prep sheet (Projects, Work History, Behavioral) with opening hooks, STAR defense points, and engineering trade-offs. |
| **Resume Design Preview** | Live layout preview switcher supporting Early Career (LaTeX Serif style) and Experienced Track (Modern Sans-serif style) designs with interactive zoom modals. |
| **Dynamic PDF Compilation** | Generates and exports print-ready A4 tailored resumes using headless Puppeteer browser execution. |
| **Interactive PDF Viewer** | Streams and renders resume PDF files dynamically on responsive `<canvas>` blocks using lazy-loaded PDF.js. |
| **Text-to-Speech (TTS) Reader** | Reads AI interviewer questions aloud using browser-native speech synthesis, matching localized pitch/rate controls. |
| **Speech-to-Text (STT) Dictation** | Dictates candidate responses in real-time using browser speech recognition, with dynamic connection state indicators. |
| **OS Dictation Fallback** | Detects sandbox blocks on Brave/Firefox and guides candidates to press `Win + H` or `Cmd + Space` for system dictation. |
| **Configurable Interview Length** | Lets users select Quick Sessions (5 rounds) or Deep-Dive Sessions (10 rounds) to optimize LLM token consumption. |
| **Grading & Critique Cards** | Audits transcripts to output performance scores, strengths, improvement logs, and detailed question audits. |

---

## Architecture Overview

IntervAI uses a modern client-server architecture split between a React SPA client and a Node/Express server API communicating over stateless endpoints:

```
┌────────────────────────────────────────────────────────┐
│                   CLIENT (React SPA)                   │
│   Renders layouts, handles voice dictation, lazy-loads │
│   PDF.js onto Canvas, and captures user forms.         │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼ POST /api/interview/ (Multipart Form-Data)
┌────────────────────────────────────────────────────────┐
│                  ROUTER & MIDDLEWARES                  │
│   Verifies user session (authUser) and processes      │
│   binary PDF file uploads (Multer).                    │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│          CONTROLLER (interview.controller.js)          │
│   Parses text (pdf-parse), detects fonts/links, and    │
│   triggers concurrent LLM engines in parallel.         │
└──────────────────────────┬─────────────────────────────┘
                           │
             ┌─────────────┴─────────────┐
             ▼                           ▼
┌─────────────────────────┐ ┌────────────────────────────┐
│   DATABASE (MongoDB)    │ │   EXTERNAL ENGINES         │
│  Mongoose model stores  │ │   - OpenAI (Tailor Resume) │
│   stateless prep logs   │ │   - Gemini (Interview Prep)│
└─────────────────────────┘ └────────────────────────────┘
```

### Request Lifecycle (Interview Report Generation)
1. **Submit**: Candidate uploads a PDF resume and inputs a target job description on the frontend.
2. **Authenticate**: Express router applies JWT middleware verification, caching user claims to `req.user`.
3. **Parse & Scrape**: Multer buffers the upload, and `pdf-parse` extracts raw text. Custom scrapers extract embedded fonts and hyperlinks.
4. **AI Tailoring**: The backend fires parallel prompts to compile the strategy roadmaps and tailors the resume to fit the target JD criteria.
5. **Score Verification**: Computes ATS compliance. If the refined ATS score drops below the original resume baseline, the system falls back to using the original resume.
6. **Save & Return**: Persists report details in MongoDB under the `InterviewReport` collection and redirects the client to `/interview/:id`.

---

## Folder Structure

```
IntervAI/
├── Backend/
│   ├── src/
│   │   ├── config/             # Database connection setups
│   │   ├── controllers/        # Controllers handling Auth, Strategy, and Mock Interview logics
│   │   ├── middlewares/        # JWT Authentication and Multer file upload handlers
│   │   ├── models/             # Mongoose Schemas (User, InterviewReport, MockInterview)
│   │   ├── routes/             # API Endpoints (/api/auth, /api/interview)
│   │   └── services/           # Service layers (OpenAI integration, Puppeteer PDF exports)
│   ├── server.js               # Express application server mount
│   └── package.json            # Server-side configuration and dependencies
│
└── Frontend/
    ├── public/
    │   └── templates/          # PNG layout previews for resume styling preset switchers
    ├── src/
    │   ├── assets/             # Brand logos and custom style presets
    │   ├── features/
    │   │   ├── auth/           # Login, Register pages, auth context hooks, API interfaces
    │   │   └── interview/      # Mock practice dashboards, PDF canvas renders, strategy panels
    │   │       ├── components/ # AtsStandardTemplate, MockInterviewPanel, PdfViewer
    │   │       ├── hooks/      # Hooks (useInterview.js) for report actions
    │   │       ├── pages/      # Home, Interview Report dashboard
    │   │       ├── services/   # Axios API configurations
    │   │       └── style/      # SCSS visual styling modules
    │   ├── app.routes.jsx      # React router navigation bindings
    │   ├── App.jsx             # Top level layout wrappers
    │   ├── main.jsx            # DOM loader mount
    │   └── style.scss          # General styles imports
    └── package.json            # Client-side configuration and dependencies
```

---

## Database Schemas

### 1. User Schema (`users`)
```javascript
{
  username:  { type: String, required: true, unique: true },
  email:     { type: String, required: true, unique: true },
  password:  { type: String, required: true }
}
```

### 2. Interview Report Schema (`interviewreports`)
```javascript
{
  jobDescription:           { type: String, required: true },
  resume:                   { type: String }, // Parsed raw text
  originalResumeFile:       { type: Buffer }, // Binary PDF file store
  originalResumeFileType:   { type: String },
  originalResumeFontFamily: { type: String, default: "Arial, Helvetica, sans-serif" },
  extractedUrls:            [{ type: String }],
  selfDescription:          { type: String },
  matchScore:               { type: Number, min: 0, max: 100 },
  matchScoreOriginal:       { type: Number, min: 0, max: 100 },
  matchScoreRefined:        { type: Number, min: 0, max: 100 },
  refinedResumeHtml:        { type: String },
  refinedResumeData:        { type: Object },
  selectedTemplate:         { type: String, default: "early" },
  technicalQuestions:       [technicalQuestionSchema],
  behavioralQuestions:      [Schema.Types.Mixed],
  projectQuestions:         [Schema.Types.Mixed],
  workExperienceQuestions:  [Schema.Types.Mixed],
  metadata:                 { type: Object },
  skillGaps:                [skillGapSchema],
  preparationPlan:          [preparationPlanSchema],
  user:                     { type: Schema.Types.ObjectId, ref: "users" },
  title:                    { type: String, required: true }
}
```

### 3. Mock Interview Schema (`mockinterviews`)
```javascript
{
  report:          { type: Schema.Types.ObjectId, ref: "InterviewReport", required: true },
  user:            { type: Schema.Types.ObjectId, ref: "users", required: true },
  status:          { type: String, enum: ["ongoing", "completed"], default: "ongoing" },
  totalQuestions:  { type: Number, enum: [5, 10], default: 5 },
  messages: [{
    role:          { type: String, enum: ["interviewer", "candidate"], required: true },
    content:       { type: String, required: true },
    timestamp:     { type: Date, default: Date.now }
  }],
  feedback: {
    score:         { type: Number, min: 0, max: 100 },
    strengths:     [{ type: String }],
    improvements:  [{ type: String }],
    detailedReview: [{
      question:    { type: String, required: true },
      answer:      { type: String, required: true },
      score:       { type: Number, min: 0, max: 100, required: true },
      critique:    { type: String, required: true }
    }]
  }
}
```

---

## API Routes

### Authentication API (`/api/auth`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | Public | Registers a new user. |
| `POST` | `/api/auth/login` | Public | Authenticates credentials and issues a cookie-based JWT session. |
| `GET` | `/api/auth/logout` | Public | Clears the session token cookie and blacklists the token. |
| `GET` | `/api/auth/get-me` | Private | Retrieves active profile information from token claims. |

### Interview Prep API (`/api/interview`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/interview/` | Private | Generates a new prep report and tailors the resume based on the JD. |
| `GET` | `/api/interview/` | Private | Fetches all past reports generated by the logged-in user. |
| `GET` | `/api/interview/report/:interviewId` | Private | Retrieves a specific interview report by ID. |
| `GET` | `/api/interview/report/:interviewId/original-resume` | Private | Streams the uploaded resume binary buffer back to the client. |
| `POST` | `/api/interview/resume/pdf/:interviewReportId` | Private | Generates a tailored PDF from the HTML layout using Puppeteer. |
| `POST` | `/api/interview/resume/template/:interviewReportId` | Private | Swaps design template styles and recalculates ATS score metrics. |
| `POST` | `/api/interview/mock/start/:reportId` | Private | Launches a new practice interview session (5 or 10 rounds). |
| `POST` | `/api/interview/mock/message/:sessionId` | Private | Submits candidate answer to chat, returning the next question or grade. |
| `POST` | `/api/interview/mock/end/:sessionId` | Private | Concludes ongoing practice early and processes grading critiques. |
| `GET` | `/api/interview/mock/sessions/:reportId` | Private | Retrieves all past practice sessions logged under a specific report. |

---

## Third-Party Integrations

### 1. OpenAI SDK (`gpt-4o-mini`)
Used to analyze candidate resumes against target job descriptions, tailor technical experience bullets, compile Motivated Defense parameters, and grade interview answers. Outputs are structured using strict Mongoose/Zod schema validation formatting.

### 2. Puppeteer (Headless PDF Compilation)
Spawns a headless browser on the server side, loads tailored HTML resume layouts matching LaTeX and Modern preset templates, applies print stylesheets, and exports print-ready A4 PDF files.

### 3. PDF.js (CDN Canvas Renderer)
Allows real-time browser previewing of PDF resumes. It dynamic-loads libraries inside the client and draws PDF binary structures page by page onto HTML canvas layers, optimizing scroll rendering on mobile viewports.

---

## Visual Previews

### Dashboard & Sidebar View
![Dashboard View](assets/dashboard_preview.png)

### Mock Interview Practice Terminal
![Mock Interview Terminal](assets/interview_preview.png)

*To render actual images on GitHub, simply drop your screenshots in an `assets/` folder in the root directory under the names `dashboard_preview.png` and `interview_preview.png`.*

---

## Environment Variables

Create a `.env` file inside the `Backend` directory:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/intervai
OPENAI_API_KEY=your_openai_or_gemini_api_key_here
JWT_SECRET=your_jwt_signature_secret_key_here
```

---

## Getting Started

### Prerequisites
* **Node.js** (v18 or higher)
* **MongoDB** (Local instance or Atlas connection string)
* **AI API Key** (OpenAI API access token)

### Installation

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/SUY1603/IntervAI.git
   cd IntervAI
   ```

2. **Backend Setup**:
   ```bash
   cd Backend
   npm install
   npm run dev
   ```

3. **Frontend Setup**:
   ```bash
   cd ../Frontend
   npm install
   npm run dev
   ```
   Open `http://localhost:5173` in your browser to start practicing!

---

## Dependencies

### Backend Dependencies
| Package | Version | Purpose |
|---|---|---|
| `express` | ^5.2.1 | Web Framework |
| `mongoose` | ^9.2.3 | MongoDB ODM |
| `openai` | ^6.27.0 | OpenAI SDK (Resume tailoring, transcript grading) |
| `@google/genai` | ^1.44.0 | Google GenAI SDK |
| `pdf-parse` | ^1.1.1 | PDF raw text extractor |
| `puppeteer` | ^24.38.0 | Headless PDF compiler |
| `jsonwebtoken` | ^9.0.3 | Session auth token generation |
| `bcryptjs` | ^3.0.3 | Password hashing security |
| `multer` | ^2.1.1 | Multipart upload processor |
| `cors` | ^2.8.6 | CORS policy handler |

### Frontend Dependencies
| Package | Version | Purpose |
|---|---|---|
| `react` | ^19.2.0 | Core UI Library |
| `react-dom` | ^19.2.0 | DOM Render Engine |
| `react-router` | ^7.13.1 | Single-Page Routing |
| `axios` | ^1.13.6 | Promise-based HTTP Client |
| `sass` | ^1.97.3 | SCSS styling compilation |

---

## License
Distributed under the MIT License. See `LICENSE` for more information.
