# IntervAI
> **AI-Powered Technical Interview Strategy & Practice Simulator Dashboard**

IntervAI is a modern, full-stack application designed to help candidates prepare for their target job roles by analyzing job descriptions against their resumes, building custom prep strategy roadmaps, and providing a real-time, voice-interactive technical mock interview experience. 

Inspired by premium productivity tools, the dashboard features a collapsible sidebar navigation system, personalized profile states, live resume template previews, and direct access to active prep logs.

---

## Key Features

### 1. Collapsible Dashboard Navigation
* **Collapsible Sidebar**: Easily toggle the sidebar to view past interview preparation plans, manage candidate profiles, or collapse it completely to maximize workspace layout.

### 2. User Authentication & Guarded Sessions
* **Secure Candidate Accounts**: Custom registration and sign-in flow matching the application's dark slate styling guidelines.
* **Protected Routing**: Route guard verification checks prevent unauthenticated users from accessing strategy sheets and practice dashboards.

### 3. Tailored Prep Strategy Roadmaps
* **ATS Score Estimations**: Estimates resume compliance scores against target Job Descriptions (JD) and highlights critical missing keywords.
* **Custom Step-by-Step Plans**: Recommends personalized study schedules (from 1 to 60 days) to bridge technical knowledge gaps before the interview.
* **Template Live Preview**: Switch between "Early Career" and "Experienced Track" layout templates, with interactive fullscreen zooming options.

### 4. Tailored ATS Resume Generator & Downloader
* **Dynamic PDF Compiling**: Compiles a tailored resume using the selected template style, structured based on candidate profile and target job description attributes.
* **Interactive PDF Renderer**: Displays the compiled document in real-time using a custom PDF.js canvas viewer, avoiding standard browser iframe rendering bottlenecks.
* **Local Downloading**: Allows candidates to download their compiled ATS-compliant PDF resume directly to their systems.

### 5. Voice-Interactive Mock Interview Simulator
* **Interactive AI Interviewer**: Simulates custom technical screening sessions with direct question-by-question audio readouts using browser-native **Text-to-Speech (TTS)**.
* **Seamless Speech-to-Text (STT)**: Allows candidates to dictate answers directly via the web speech engine, complete with connection/permission status badges.
* **Privacy Workaround Support**: Gracefully fallback to standard typing inputs on Brave/Firefox with automated info tips guiding users to activate Windows (`Win + H`) or macOS system-level voice dictation tools.
* **Cheaper Turn Caps**: Configurable interview lengths (Quick Session of 5 questions or Deep-Dive of 10 questions) to manage LLM resource consumption.
* **Detailed Grading Reports**: Delivers immediate post-interview analysis summarizing performance scores, strengths, improvement metrics, and detailed question critiques.

---

## Visual Previews

### Dashboard & Sidebar View
![Dashboard View](assets/dashboard_preview.png)

### Mock Interview Practice Terminal
![Mock Interview Terminal](assets/interview_preview.png)

*To render actual images on GitHub, simply drop your screenshots in an `assets/` folder in the root directory under the names `dashboard_preview.png` and `interview_preview.png`.*

---

## Technology Stack

### Frontend (Client-side)
* **Core Framework**: React 18+ (Vite SPA)
* **Routing & UI**: React Router v6, CSS/SCSS (Vanilla styling tokens)
* **Browser Integration**: Web Speech API (`window.speechSynthesis`, `window.webkitSpeechRecognition`), PDF.js canvas rendering

### Backend (Server-side)
* **Server Framework**: Node.js & Express
* **Database**: MongoDB (via Mongoose schemas for stateless sessions)
* **AI Orchestration**: Gemini API / OpenAI SDK Integration

---

## Getting Started

### Prerequisites
* **Node.js** (v18 or higher)
* **MongoDB** (Local instance or Atlas connection string)
* **AI API Key** (Gemini or OpenAI API access token)

### Installation

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/<your-username>/IntervAI.git
   cd IntervAI
   ```

2. **Backend Setup**:
   ```bash
   cd Backend
   npm install
   ```
   Create a `.env` file in the `Backend` directory:
   ```env
   PORT=5000
   MONGO_URI=your_mongodb_connection_string
   OPENAI_API_KEY=your_api_key_here
   ```
   Start the backend service:
   ```bash
   npm run dev
   ```

3. **Frontend Setup**:
   ```bash
   cd ../Frontend
   npm install
   ```
   Start the client server:
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in your browser to start practicing!

---

## License
Distributed under the MIT License. See `LICENSE` for more information.
