import React, { useState, useEffect, useRef } from "react";

const MockInterviewPanel = ({ 
    reportId, 
    jobDescription, 
    resume, 
    mockSession, 
    setMockSession,
    mockSessions, 
    mockLoading, 
    startMockInterview, 
    submitCandidateAnswer, 
    endMockInterview, 
    fetchMockSessions 
}) => {
    const [selectedQuestionCount, setSelectedQuestionCount] = useState(5);
    const [voiceOutput, setVoiceOutput] = useState(true);
    const [voiceInput, setVoiceInput] = useState(false);
    const [inputValue, setInputValue] = useState("");
    const [recognition, setRecognition] = useState(null);
    const [recognitionSupported, setRecognitionSupported] = useState(true);
    const [isListening, setIsListening] = useState(false);
    const [selectedFeedbackSession, setSelectedFeedbackSession] = useState(null);

    const chatEndRef = useRef(null);

    // Initialize Speech Recognition
    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            setRecognitionSupported(false);
            return;
        }

        const rec = new SpeechRecognition();
        rec.continuous = false;
        rec.interimResults = false;
        rec.lang = "en-US";

        rec.onstart = () => {
            setIsListening(true);
        };

        rec.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            setInputValue(prev => {
                const trimmed = prev.trim();
                return trimmed ? `${trimmed} ${transcript}` : transcript;
            });
        };

        rec.onerror = (event) => {
            console.error("Speech Recognition Error:", event.error);
            setIsListening(false);
            if (event.error === "not-allowed" || event.error === "permission-denied") {
                alert("Microphone permission denied. Please click the camera/mic icon in the browser URL bar and allow microphone permissions.");
            } else {
                alert(`Speech Recognition Error: "${event.error}"\n\nNote: Modern versions of Brave and Firefox block native Speech Recognition (STT) for privacy reasons.\n\nWorkarounds:\n1. Switch to Google Chrome or Microsoft Edge (which fully support Speech-to-Text out of the box).\n2. Use OS-level dictation: click on the text box and press "Windows Key + H" (Windows) or "Cmd + Ctrl + S" (Mac) to speak directly!`);
            }
        };

        rec.onend = () => {
            setIsListening(false);
        };

        setRecognition(rec);
    }, []);

    // Text to Speech logic
    const speakQuestion = (text) => {
        if (!voiceOutput || !('speechSynthesis' in window)) return;
        
        try {
            window.speechSynthesis.cancel(); // Stop any current speech
            const utterance = new SpeechSynthesisUtterance(text);
            
            // Fetch voices and try to select an English voice
            const voices = window.speechSynthesis.getVoices();
            const preferredVoice = voices.find(v => 
                v.lang.startsWith("en-") && 
                (v.name.includes("Google") || v.name.includes("Natural") || v.name.includes("Siri"))
            ) || voices.find(v => v.lang.startsWith("en"));
            
            if (preferredVoice) {
                utterance.voice = preferredVoice;
            }
            
            utterance.rate = 0.95; // Slightly slower, more professional pace
            window.speechSynthesis.speak(utterance);
        } catch (e) {
            console.error("Speech Synthesis Error:", e);
        }
    };

    // Whenever a new interviewer message lands, speak it
    useEffect(() => {
        if (mockSession && mockSession.status === "ongoing" && mockSession.messages.length > 0) {
            const lastMsg = mockSession.messages[mockSession.messages.length - 1];
            if (lastMsg.role === "interviewer") {
                speakQuestion(lastMsg.content);
            }
        }
    }, [mockSession]);

    // Autoscroll chat
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [mockSession?.messages, mockLoading]);

    // Handle Mic Toggle
    const handleMicClick = () => {
        if (!recognition) {
            alert("Speech recognition is not supported on this browser or blocked. (Enable Google services in Brave settings or use Chrome).");
            return;
        }

        if (isListening) {
            recognition.stop();
        } else {
            try {
                recognition.start();
            } catch (e) {
                console.error(e);
            }
        }
    };

    // Start Session
    const handleStart = async () => {
        await startMockInterview({
            reportId,
            totalQuestions: selectedQuestionCount
        });
        setSelectedFeedbackSession(null);
    };

    // Submit Answer
    const handleSubmit = async (e) => {
        e?.preventDefault();
        if (!inputValue.trim() || mockLoading) return;

        const currentAnswer = inputValue;
        setInputValue("");
        if (isListening) {
            recognition.stop();
        }

        await submitCandidateAnswer({
            sessionId: mockSession._id,
            message: currentAnswer
        });
    };

    // Voluntarily End Early
    const handleEndEarly = async () => {
        if (window.confirm("Are you sure you want to end this interview session? You will receive evaluation on the questions answered so far.")) {
            if (isListening) {
                recognition.stop();
            }
            window.speechSynthesis.cancel();
            const updatedSession = await endMockInterview(mockSession._id);
            if (updatedSession) {
                setSelectedFeedbackSession(updatedSession);
            }
        }
    };

    // Past Sessions View
    const handleViewFeedback = (session) => {
        setSelectedFeedbackSession(session);
        setMockSession(null); // Hide active session
        window.speechSynthesis.cancel();
    };

    // Calculate details for active screen
    const candidateAnswers = mockSession?.messages?.filter(m => m.role === "candidate")?.length || 0;
    const progressPercent = mockSession ? Math.min(100, Math.round((candidateAnswers / mockSession.totalQuestions) * 100)) : 0;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: '520px', gap: '1.25rem' }}>
            
            {/* Header section */}
            <div className='content-header' style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', paddingBottom: '0.75rem', marginBottom: '0.5rem' }}>
                <div>
                    <h2>Mock Interview Simulator</h2>
                    <span style={{ fontSize: '0.8rem', color: '#7d8590', marginTop: '0.2rem', display: 'block' }}>
                        Simulate a live technical screening using your resume and target JD
                    </span>
                </div>
                
                {/* Active Session Progress Info */}
                {mockSession && mockSession.status === "ongoing" && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: '600', color: '#7d8590' }}>
                            Round {candidateAnswers + 1} of {mockSession.totalQuestions}
                        </span>
                        <div style={{ width: '80px', height: '6px', backgroundColor: '#2a3348', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ width: `${progressPercent}%`, height: '100%', backgroundColor: '#ff2d78', transition: 'width 0.3s ease' }} />
                        </div>
                        <button 
                            onClick={handleEndEarly} 
                            style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem', backgroundColor: 'rgba(255, 77, 77, 0.1)', border: '1px solid rgba(255, 77, 77, 0.3)', color: '#ff4d4d', borderRadius: '0.25rem', cursor: 'pointer' }}
                        >
                            End Session
                        </button>
                    </div>
                )}
            </div>

            {/* Main content grid split */}
            <div style={{ display: 'flex', gap: '1.25rem', flex: 1, minHeight: '480px' }}>
                
                {/* Left Pane - Setup & History */}
                <div style={{ flex: '1', display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '300px' }}>
                    
                    {/* Setup Card */}
                    {!mockSession && (
                        <div style={{ padding: '1rem', background: '#1c2230', border: '1px solid #2a3348', borderRadius: '0.4rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <h3 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 'bold', color: '#e6edf3', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Start Session</h3>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                <label style={{ fontSize: '0.75rem', color: '#7d8590' }}>Interview Length</label>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button 
                                        onClick={() => setSelectedQuestionCount(5)}
                                        style={{ flex: 1, padding: '0.4rem', fontSize: '0.8rem', borderRadius: '0.25rem', border: '1px solid ' + (selectedQuestionCount === 5 ? '#ff2d78' : '#2a3348'), backgroundColor: selectedQuestionCount === 5 ? 'rgba(255, 45, 120, 0.1)' : '#1e2535', color: selectedQuestionCount === 5 ? '#fff' : '#7d8590', cursor: 'pointer', fontWeight: '600' }}
                                    >
                                        Quick (5 Qs)
                                    </button>
                                    <button 
                                        onClick={() => setSelectedQuestionCount(10)}
                                        style={{ flex: 1, padding: '0.4rem', fontSize: '0.8rem', borderRadius: '0.25rem', border: '1px solid ' + (selectedQuestionCount === 10 ? '#ff2d78' : '#2a3348'), backgroundColor: selectedQuestionCount === 10 ? 'rgba(255, 45, 120, 0.1)' : '#1e2535', color: selectedQuestionCount === 10 ? '#fff' : '#7d8590', cursor: 'pointer', fontWeight: '600' }}
                                    >
                                        Deep (10 Qs)
                                    </button>
                                </div>
                            </div>

                            <button 
                                onClick={handleStart}
                                disabled={mockLoading}
                                style={{ width: '100%', padding: '0.6rem', fontSize: '0.85rem', fontWeight: 'bold', backgroundColor: '#ff2d78', color: '#fff', border: 'none', borderRadius: '0.25rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
                            >
                                {mockLoading ? 'Starting...' : 'Start Mock Interview'}
                            </button>
                        </div>
                    )}

                    {/* Speech Settings Card */}
                    <div style={{ padding: '1rem', background: '#1c2230', border: '1px solid #2a3348', borderRadius: '0.4rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                        <h3 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 'bold', color: '#e6edf3', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Voice Settings</h3>
                        
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.8rem', color: '#e6edf3' }}>
                            <input 
                                type="checkbox" 
                                checked={voiceOutput} 
                                onChange={(e) => {
                                    setVoiceOutput(e.target.checked);
                                    if (!e.target.checked) window.speechSynthesis.cancel();
                                }} 
                                style={{ accentColor: '#ff2d78' }}
                            />
                            Interviewer Voice (TTS)
                        </label>

                        {!recognitionSupported && (
                            <div style={{ backgroundColor: 'rgba(245, 166, 35, 0.1)', border: '1px solid rgba(245, 166, 35, 0.2)', borderRadius: '0.25rem', padding: '0.4rem 0.6rem', fontSize: '0.7rem', color: '#f5a623', lineHeight: '1.3' }}>
                                ℹ️ STT (Mic Input) is not supported on this browser (use Chrome or Edge).
                            </div>
                        )}
                        
                        {recognitionSupported && (
                            <div style={{ fontSize: '0.7rem', color: '#7d8590', lineHeight: '1.3', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                <div style={{ color: '#f5a623' }}>
                                    🛡️ <strong>Brave/Firefox Notice:</strong> Native speech recognition is blocked by default due to browser privacy policies.
                                </div>
                                <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.4rem' }}>
                                    💡 <strong>Pro Tip:</strong> Click the input box and press <strong>Win + H</strong> (Windows) or <strong>Cmd + Space</strong> (Mac) to dictate your answer using OS voice input!
                                </div>
                            </div>
                        )}
                    </div>

                    {/* History List */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem', overflowY: 'auto', maxHeight: '340px' }}>
                        <span style={{ fontSize: '0.7rem', fontWeight: 'bold', color: '#7d8590', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Session History</span>
                        {mockSessions.length === 0 ? (
                            <div style={{ fontSize: '0.75rem', color: '#7d8590', padding: '0.5rem 0', fontStyle: 'italic' }}>No past sessions found.</div>
                        ) : (
                            mockSessions.map((session, sIdx) => {
                                const active = mockSession?._id === session._id;
                                const isCompleted = session.status === "completed";
                                const dateStr = new Date(session.createdAt).toLocaleDateString();
                                const rating = session.feedback?.score;

                                return (
                                    <div 
                                        key={session._id || sIdx}
                                        onClick={() => isCompleted ? handleViewFeedback(session) : setMockSession(session)}
                                        style={{
                                            padding: '0.6rem 0.75rem',
                                            background: active ? 'rgba(255, 45, 120, 0.08)' : (selectedFeedbackSession?._id === session._id ? 'rgba(56, 139, 253, 0.08)' : '#1c2230'),
                                            border: '1px solid ' + (active ? '#ff2d78' : (selectedFeedbackSession?._id === session._id ? '#58a6ff' : '#2a3348')),
                                            borderRadius: '0.3rem',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            transition: 'all 0.15s'
                                        }}
                                    >
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                                            <span style={{ fontSize: '0.78rem', fontWeight: '600', color: '#e6edf3' }}>
                                                {session.totalQuestions} Qs Session
                                            </span>
                                            <span style={{ fontSize: '0.65rem', color: '#7d8590' }}>
                                                {dateStr} &bull; {session.status}
                                            </span>
                                        </div>
                                        {isCompleted && rating !== undefined && (
                                            <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: rating >= 80 ? '#3fb950' : rating >= 60 ? '#f5a623' : '#ff4d4d', backgroundColor: 'rgba(255,255,255,0.05)', padding: '0.15rem 0.4rem', borderRadius: '0.2rem' }}>
                                                {rating}%
                                            </span>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Right Pane - Chat Terminal or Feedback */}
                <div style={{ flex: '1.8', background: '#1c2230', border: '1px solid #2a3348', borderRadius: '0.4rem', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    
                    {/* CASE 1: Active Interview Terminal */}
                    {mockSession && mockSession.status === "ongoing" && (
                        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', flex: 1 }}>
                            
                            {/* Chat messages */}
                            <div style={{ flex: 1, padding: '1rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.85rem', maxHeight: '420px' }}>
                                {mockSession.messages.map((msg, idx) => {
                                    const isAI = msg.role === "interviewer";
                                    return (
                                        <div 
                                            key={idx} 
                                            style={{
                                                alignSelf: isAI ? 'flex-start' : 'flex-end',
                                                maxWidth: '85%',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: '0.2rem'
                                            }}
                                        >
                                            <span style={{ fontSize: '0.65rem', color: '#7d8590', alignSelf: isAI ? 'flex-start' : 'flex-end' }}>
                                                {isAI ? 'Interviewer' : 'You'}
                                            </span>
                                            <div 
                                                style={{
                                                    padding: '0.65rem 0.85rem',
                                                    borderRadius: '0.4rem',
                                                    fontSize: '0.85rem',
                                                    lineHeight: '1.5',
                                                    color: '#e6edf3',
                                                    backgroundColor: isAI ? '#161b22' : '#ff2d78',
                                                    border: isAI ? '1px solid #2a3348' : 'none'
                                                }}
                                            >
                                                {msg.content}
                                            </div>
                                        </div>
                                    );
                                })}

                                {mockLoading && (
                                    <div style={{ alignSelf: 'flex-start', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                                        <span style={{ fontSize: '0.65rem', color: '#7d8590' }}>Interviewer</span>
                                        <div style={{ padding: '0.65rem 0.85rem', borderRadius: '0.4rem', backgroundColor: '#161b22', border: '1px solid #2a3348', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#ff2d78', animation: 'spin 1s infinite alternate' }} />
                                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#ff2d78', animation: 'spin 1s infinite alternate 0.2s' }} />
                                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#ff2d78', animation: 'spin 1s infinite alternate 0.4s' }} />
                                        </div>
                                    </div>
                                )}
                                <div ref={chatEndRef} />
                            </div>

                            {/* Listening Visualizer overlay banner */}
                            {isListening && (
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.4rem', backgroundColor: 'rgba(255, 45, 120, 0.1)', borderTop: '1px solid rgba(255, 45, 120, 0.2)' }}>
                                    <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ff2d78', animation: 'spin 0.8s infinite alternate' }} />
                                    <span style={{ fontSize: '0.72rem', color: '#ff2d78', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                        Listening to your voice... Speak now
                                    </span>
                                </div>
                            )}

                            {/* Chat Input form */}
                            <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '0.5rem', padding: '0.75rem', borderTop: '1px solid #2a3348', backgroundColor: '#161b22' }}>
                                
                                {recognitionSupported && (
                                    <button 
                                        type="button"
                                        onClick={handleMicClick}
                                        style={{
                                            width: '42px',
                                            height: '42px',
                                            borderRadius: '0.25rem',
                                            border: '1px solid ' + (isListening ? '#ff2d78' : '#2a3348'),
                                            backgroundColor: isListening ? 'rgba(255, 45, 120, 0.15)' : '#1e2535',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: isListening ? '#ff2d78' : '#7d8590',
                                            transition: 'all 0.15s'
                                        }}
                                        title={isListening ? "Stop listening" : "Start voice dictation"}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                                            <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                                            <line x1="12" y1="19" x2="12" y2="23"/>
                                            <line x1="8" y1="23" x2="16" y2="23"/>
                                        </svg>
                                    </button>
                                )}

                                <input 
                                    type="text" 
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    placeholder="Type your response here..."
                                    disabled={mockLoading}
                                    style={{
                                        flex: 1,
                                        height: '42px',
                                        padding: '0 0.85rem',
                                        backgroundColor: '#1e2535',
                                        border: '1px solid #2a3348',
                                        borderRadius: '0.25rem',
                                        color: '#e6edf3',
                                        fontSize: '0.85rem'
                                    }}
                                />

                                <button 
                                    type="submit"
                                    disabled={!inputValue.trim() || mockLoading}
                                    style={{
                                        padding: '0 1.25rem',
                                        height: '42px',
                                        backgroundColor: inputValue.trim() && !mockLoading ? '#ff2d78' : '#2a3348',
                                        color: '#fff',
                                        border: 'none',
                                        borderRadius: '0.25rem',
                                        cursor: inputValue.trim() && !mockLoading ? 'pointer' : 'default',
                                        fontWeight: 'bold',
                                        fontSize: '0.85rem',
                                        transition: 'background-color 0.15s'
                                    }}
                                >
                                    Send
                                </button>
                            </form>
                        </div>
                    )}

                    {/* CASE 2: Finished Session Feedback Screen */}
                    {selectedFeedbackSession && (
                        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', flex: 1, overflowY: 'auto', padding: '1.25rem', gap: '1rem' }}>
                            
                            {/* Score header box */}
                            <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', backgroundColor: '#161b22', border: '1px solid #2a3348', padding: '1rem', borderRadius: '0.4rem' }}>
                                
                                {/* Match Score Circular progress */}
                                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '80px', height: '80px' }}>
                                    <svg width="80" height="80" viewBox="0 0 80 80">
                                        <circle cx="40" cy="40" r="34" fill="none" stroke="#2a3348" strokeWidth="6" />
                                        <circle 
                                            cx="40" 
                                            cy="40" 
                                            r="34" 
                                            fill="none" 
                                            stroke={selectedFeedbackSession.feedback?.score >= 80 ? '#3fb950' : selectedFeedbackSession.feedback?.score >= 60 ? '#f5a623' : '#ff4d4d'} 
                                            strokeWidth="6" 
                                            strokeDasharray={2 * Math.PI * 34}
                                            strokeDashoffset={2 * Math.PI * 34 - (selectedFeedbackSession.feedback?.score / 100) * (2 * Math.PI * 34)}
                                            transform="rotate(-90 40 40)"
                                            strokeLinecap="round"
                                            style={{ transition: 'stroke-dashoffset 0.8s ease' }}
                                        />
                                    </svg>
                                    <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                        <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#e6edf3' }}>
                                            {selectedFeedbackSession.feedback?.score}%
                                        </span>
                                        <span style={{ fontSize: '0.55rem', color: '#7d8590', textTransform: 'uppercase', fontWeight: '600' }}>Score</span>
                                    </div>
                                </div>

                                <div style={{ flex: 1 }}>
                                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 'bold', color: '#e6edf3' }}>Mock Interview Feedback</h3>
                                    <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.78rem', color: '#7d8590' }}>
                                        Evaluated on {new Date(selectedFeedbackSession.createdAt).toLocaleDateString()} &bull; {selectedFeedbackSession.totalQuestions} Rounds
                                    </p>
                                    <button 
                                        onClick={() => { setSelectedFeedbackSession(null); setMockSession(null); }}
                                        style={{ marginTop: '0.5rem', padding: '0.2rem 0.5rem', fontSize: '0.72rem', backgroundColor: '#2a3348', color: '#e6edf3', border: 'none', borderRadius: '0.2rem', cursor: 'pointer' }}
                                    >
                                        Back to Start
                                    </button>
                                </div>
                            </div>

                            {/* Strengths & Improvements List */}
                            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                                <div style={{ flex: 1, minWidth: '220px', background: '#161b22', border: '1px solid #2a3348', padding: '0.75rem 1rem', borderRadius: '0.35rem' }}>
                                    <span style={{ fontSize: '0.72rem', fontWeight: 'bold', color: '#3fb950', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '0.4rem' }}>Key Strengths</span>
                                    <ul style={{ margin: 0, paddingLeft: '1rem', fontSize: '0.8rem', color: '#e6edf3', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                                        {selectedFeedbackSession.feedback?.strengths?.map((str, idx) => (
                                            <li key={idx}>{str}</li>
                                        ))}
                                    </ul>
                                </div>

                                <div style={{ flex: 1, minWidth: '220px', background: '#161b22', border: '1px solid #2a3348', padding: '0.75rem 1rem', borderRadius: '0.35rem' }}>
                                    <span style={{ fontSize: '0.72rem', fontWeight: 'bold', color: '#ff4d4d', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '0.4rem' }}>Areas to Improve</span>
                                    <ul style={{ margin: 0, paddingLeft: '1rem', fontSize: '0.8rem', color: '#e6edf3', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                                        {selectedFeedbackSession.feedback?.improvements?.map((imp, idx) => (
                                            <li key={idx}>{imp}</li>
                                        ))}
                                    </ul>
                                </div>
                            </div>

                            {/* Question by Question Detailed Critique */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginTop: '0.5rem' }}>
                                <span style={{ fontSize: '0.72rem', fontWeight: 'bold', color: '#7d8590', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Detailed QA Critique</span>
                                
                                {selectedFeedbackSession.feedback?.detailedReview?.map((rev, rIdx) => (
                                    <div key={rIdx} style={{ background: '#161b22', border: '1px solid #2a3348', borderRadius: '0.35rem', overflow: 'hidden' }}>
                                        <div style={{ padding: '0.65rem 0.85rem', background: '#1e2535', display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontSize: '0.78rem', fontWeight: 'bold', color: '#ff2d78' }}>Q{rIdx + 1}: Technical screening</span>
                                            <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: rev.score >= 80 ? '#3fb950' : rev.score >= 60 ? '#f5a623' : '#ff4d4d', backgroundColor: 'rgba(255,255,255,0.05)', padding: '0.1rem 0.4rem', borderRadius: '0.15rem' }}>
                                                Grade: {rev.score}%
                                            </span>
                                        </div>
                                        <div style={{ padding: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.8rem', lineHeight: '1.4' }}>
                                            <div>
                                                <strong style={{ color: '#7d8590', display: 'block', fontSize: '0.68rem', textTransform: 'uppercase' }}>Interviewer Question</strong>
                                                <p style={{ margin: '0.15rem 0 0 0', color: '#e6edf3' }}>{rev.question}</p>
                                            </div>
                                            <div>
                                                <strong style={{ color: '#7d8590', display: 'block', fontSize: '0.68rem', textTransform: 'uppercase' }}>Your Answer</strong>
                                                <p style={{ margin: '0.15rem 0 0 0', color: '#ff2d78', fontStyle: 'italic' }}>"{rev.answer}"</p>
                                            </div>
                                            <div style={{ backgroundColor: 'rgba(255, 45, 120, 0.03)', borderLeft: '2px solid #ff2d78', padding: '0.5rem 0.75rem', borderRadius: '0 0.2rem 0.2rem 0' }}>
                                                <strong style={{ color: '#ff2d78', display: 'block', fontSize: '0.68rem', textTransform: 'uppercase' }}>Critique & Ideal approach</strong>
                                                <p style={{ margin: '0.15rem 0 0 0', color: '#e6edf3' }}>{rev.critique}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* CASE 3: Start Screen (No active session, no selected feedback) */}
                    {!mockSession && !selectedFeedbackSession && (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, padding: '3rem', textAlign: 'center', gap: '1rem' }}>
                            <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'rgba(255, 45, 120, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ff2d78' }}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                                </svg>
                            </div>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 'bold', color: '#e6edf3' }}>No Active Interview</h3>
                                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8rem', color: '#7d8590', maxWidth: '300px', lineHeight: '1.4' }}>
                                    Select your preferred question count and click "Start Mock Interview" in the left panel to begin.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MockInterviewPanel;
