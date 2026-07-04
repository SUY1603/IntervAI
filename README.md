# IntervAI 🚀
> **AI-Powered Technical Interview Strategy & Practice Simulator Dashboard**

IntervAI is a modern, full-stack application designed to help candidates prepare for their target job roles by analyzing job descriptions against their resumes, building custom prep strategy roadmaps, and providing a real-time, voice-interactive technical mock interview experience. 

Inspired by premium productivity tools, the dashboard features a collapsible sidebar navigation system, personalized profile states, live resume template previews, and direct access to active prep logs.

---

## ✨ Key Features

### 1. Collapsible Dashboard Navigation
* **Gemini-Inspired Layout**: Features a collapsible left sidebar to switch between past reports, manage profiles, and start new mock preparation workflows.
* **Focused Practicing**: The sidebar slides out of view during mock interviews, freeing up screen real estate for immersive training sessions.

### 2. Tailored Prep Strategy Roadmaps
* **ATS Score Estimations**: Estimates resume compliance scores against target Job Descriptions (JD) and highlights critical missing keywords.
* **Custom Step-by-Step Plans**: Recommends personalized study schedules (from 1 to 60 days) to bridge technical knowledge gaps before the interview.
* **Resume Template Selection**: Interactive preview card comparing "Early Career" and "Experienced Track" layout templates, with interactive fullscreen zooming options.

### 3. Voice-Interactive Mock Interview Simulator
* **Interactive AI Interviewer**: Simulates custom technical screening sessions with direct question-by-question audio readouts using browser-native **Text-to-Speech (TTS)**.
* **Seamless Speech-to-Text (STT)**: Allows candidates to dictate answers directly via the web speech engine, complete with connection/permission status badges.
* **Privacy Workaround Support**: Gracefully fallback to standard typing inputs on Brave/Firefox with automated info tips guiding users to activate Windows (`Win + H`) or macOS system-level voice dictation tools.
* **Cheaper Turn Caps**: Configurable interview lengths (**Quick Session** of 5 questions or **Deep-Dive** of 10 questions) to manage LLM resource consumption.
* **Detailed Grading Reports**: Delivers immediate post-interview analysis summarizing performance scores, strengths, improvement metrics, and detailed question critiques.

---

## 🛠️ Technology Stack

### Frontend (Client-side)
* **Core Framework**: React 18+ (Vite SPA)
* **Routing & UI**: React Router v6, CSS/SCSS (Vanilla styling tokens)
* **Browser Integration**: Web Speech API (`window.speechSynthesis`, `window.webkitSpeechRecognition`)

### Backend (Server-side)
* **Server Framework**: Node.js & Express
* **Database**: MongoDB (via Mongoose schemas for stateless sessions)
* **AI Orchestration**: Gemini API / OpenAI SDK Integration

---

## 🚀 Getting Started

### 📋 Prerequisites
* **Node.js** (v18 or higher)
* **MongoDB** (Local instance or Atlas connection string)
* **AI API Key** (Gemini or OpenAI API access token)

### 💻 Installation

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

## 🛡️ License
Distributed under the MIT License. See `LICENSE` for more information.
