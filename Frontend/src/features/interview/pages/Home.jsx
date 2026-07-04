import React, { useState, useRef, useEffect } from 'react'
import "../style/home.scss"
import { useInterview } from '../hooks/useInterview.js'
import { useNavigate } from 'react-router'
import { useAuth } from '../../auth/hooks/useAuth.js'

const Home = () => {
    const { loading, generating, generateReport, reports, setSafeFileUrl, setFileType } = useInterview()
    const [ jobDescription, setJobDescription ] = useState("")
    const [ selfDescription, setSelfDescription ] = useState("")
    const [ selectedFile, setSelectedFile ] = useState(null)
    const [ selectedTemplate, setSelectedTemplate ] = useState("early")
    const [ preparationDays, setPreparationDays ] = useState("")
    const [ showModal, setShowModal ] = useState(false)
    const [ isSidebarOpen, setIsSidebarOpen ] = useState(true)
    const resumeInputRef = useRef()

    const navigate = useNavigate()

    useEffect(() => {
        setSafeFileUrl(null)
        setFileType(null)
    }, [])

    const handleGenerateReport = async () => {
        const resumeFile = selectedFile
        const data = await generateReport({ 
            jobDescription, 
            selfDescription, 
            resumeFile, 
            template: selectedTemplate,
            preparationDays: preparationDays ? parseInt(preparationDays, 10) : undefined
        })
        if (data && data._id) {
            navigate(`/interview/${data._id}`)
        }
    }

    const handleFileChange = (e) => {
        const file = e.target.files[0] || null
        setSelectedFile(file)
        if (file) {
            const url = URL.createObjectURL(file)
            setSafeFileUrl(url)
            setFileType(file.type)
        } else {
            setSafeFileUrl(null)
            setFileType(null)
        }
    }

    const handleClearFile = (e) => {
        e.preventDefault()
        e.stopPropagation()
        resumeInputRef.current.value = ""
        setSelectedFile(null)
        setSafeFileUrl(null)
        setFileType(null)
    }

    const { user, handleLogout } = useAuth()

    if (generating) {
        return (
            <main className='loading-screen'>
                <div className='loading-screen__spinner' />
                <h2 className='loading-screen__title'>Crafting your interview plan...</h2>
                <p className='loading-screen__sub'>AI is analysing your profile and the job description. This usually takes ~30 seconds.</p>
            </main>
        )
    }

    if (loading) {
        return (
            <main className='loading-screen'>
                <div className='loading-screen__spinner' />
                <h2 className='loading-screen__title'>Loading your dashboard...</h2>
                <p className='loading-screen__sub'>Retrieving your interview plans, please wait.</p>
            </main>
        )
    }

    return (
        <div className='home-layout-container'>
            
            {/* Collapsible Left Sidebar (Gemini Style) */}
            <aside className={`home-sidebar ${isSidebarOpen ? '' : 'home-sidebar--collapsed'}`}>
                
                {/* Header branding & close button */}
                <div className='sidebar-header'>
                    <div className='sidebar-branding'>
                        <span className='brand-icon'>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M10 2c0 4.4-3.6 8-8 8 4.4 0 8 3.6 8 8 0-4.4 3.6-8 8-8-4.4 0-8-3.6-8-8z" />
                                <path d="M19 13c0 1.6-1.3 3-3 3 1.6 0 3 1.3 3 3 0-1.7 1.3-3 3-3-1.7 0-3-1.3-3-3z" />
                            </svg>
                        </span>
                        <span className='brand-name'>IntervAI</span>
                    </div>
                    <button 
                        type="button" 
                        onClick={() => setIsSidebarOpen(false)} 
                        className='sidebar-toggle-btn'
                        title="Collapse sidebar"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                            <line x1="9" y1="3" x2="9" y2="21"/>
                            <path d="M16 15l-3-3 3-3"/>
                        </svg>
                    </button>
                </div>

                {/* List of Recent Plans */}
                <div className='sidebar-content'>
                    <div className='sidebar-section-title'>Recent plans</div>
                    {reports.length === 0 ? (
                        <div className='sidebar-empty-state'>No past plans found</div>
                    ) : (
                        <ul className='sidebar-reports-list'>
                            {reports.map(report => {
                                const dateStr = new Date(report.createdAt).toLocaleDateString();
                                return (
                                    <li 
                                        key={report._id} 
                                        onClick={() => navigate(`/interview/${report._id}`)}
                                        className='sidebar-report-item'
                                        title={report.title || 'Untitled Position'}
                                    >
                                        <span className='item-icon'>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                                            </svg>
                                        </span>
                                        <div className='item-meta'>
                                            <span className='item-title'>{report.title || 'Untitled Position'}</span>
                                            <span className='item-date'>{dateStr}</span>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>

                {/* Bottom Profile Section */}
                <div className='sidebar-profile-card'>
                    <div className='profile-avatar-circle'>
                        {(user?.username || user?.email || "C")[0].toUpperCase()}
                    </div>
                    <div className='profile-info'>
                        <span className='profile-username' title={user?.username || user?.email}>
                            {user?.username || "Candidate"}
                        </span>
                    </div>
                </div>
            </aside>

            {/* Main Content Workspace */}
            <main className='home-main-content'>
                
                {/* Header navigation bar */}
                <nav className="top-nav">
                    {!isSidebarOpen ? (
                        <button 
                            onClick={() => setIsSidebarOpen(true)} 
                            className="sidebar-open-btn"
                            title="Expand sidebar"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                                <line x1="9" y1="3" x2="9" y2="21"/>
                                <path d="M13 9l3 3-3 3"/>
                            </svg>
                        </button>
                    ) : <div />}
                    
                    <button onClick={handleLogout} className="logout-btn">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                        Logout
                    </button>
                </nav>

                <div className='home-page-inner'>
                    
                    {/* Page Header */}
                    <header className='page-header'>
                        <h1>Create Your Custom <span className='highlight'>Interview Plan</span></h1>
                    </header>

                    {/* Main Creation Card Form */}
                    <div className='interview-card'>
                        <div className='interview-card__body'>

                            {/* Left Panel - Job Description */}
                            <div className='panel panel--left'>
                                <div className='panel__header'>
                                    <span className='panel__icon'>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></svg>
                                    </span>
                                    <h2>Target Job Description</h2>
                                    <span className='badge badge--required'>Required</span>
                                </div>
                                <textarea
                                    value={jobDescription}
                                    onChange={(e) => { setJobDescription(e.target.value) }}
                                    className='panel__textarea'
                                    placeholder={`Paste the full job description here...\ne.g. 'Senior Frontend Engineer at Google requires proficiency in React, TypeScript, and large-scale system design...'`}
                                    maxLength={5000}
                                />
                                <div className='char-counter'>{jobDescription.length} / 5000 chars</div>
                            </div>

                            {/* Vertical Divider */}
                            <div className='panel-divider' />

                            {/* Right Panel - Profile */}
                            <div className='panel panel--right'>
                                <div className='panel__header'>
                                    <span className='panel__icon'>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                                    </span>
                                    <h2>Your Profile</h2>
                                </div>

                                {/* Upload Resume */}
                                <div className='upload-section'>
                                    <label className='section-label' style={{ display: 'block', marginBottom: '0.25rem' }}>
                                        Upload Resume
                                    </label>
                                    <label className={`dropzone ${selectedFile ? 'dropzone--active' : ''}`} htmlFor='resume'>
                                        {selectedFile ? (
                                            <>
                                                <span className='dropzone__icon dropzone__icon--success'>
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                                                </span>
                                                <p className='dropzone__title dropzone__title--success'>{selectedFile.name}</p>
                                                <p className='dropzone__subtitle'>({(selectedFile.size / 1024).toFixed(1)} KB) — <span className='dropzone__clear' onClick={handleClearFile}>Remove</span></p>
                                            </>
                                        ) : (
                                            <>
                                                <span className='dropzone__icon'>
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 16 12 12 8 16" /><line x1="12" y1="12" x2="12" y2="21" /><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" /></svg>
                                                </span>
                                                <p className='dropzone__title'>Click to upload or drag &amp; drop</p>
                                                <p className='dropzone__subtitle'>PDF or DOCX (Max 5MB)</p>
                                            </>
                                        )}
                                        <input ref={resumeInputRef} onChange={handleFileChange} hidden type='file' id='resume' name='resume' accept='.pdf,.docx' />
                                    </label>
                                </div>

                                {/* OR Divider */}
                                <div className='or-divider'><span>OR</span></div>

                                {/* Quick Self-Description */}
                                <div className='self-description'>
                                    <label className='section-label' htmlFor='selfDescription'>Quick Self-Description</label>
                                    <textarea
                                        value={selfDescription}
                                        onChange={(e) => { setSelfDescription(e.target.value) }}
                                        id='selfDescription'
                                        name='selfDescription'
                                        className='panel__textarea panel__textarea--short'
                                        placeholder="Briefly describe your experience, key skills, and years of experience if you don't have a resume handy..."
                                    />
                                </div>

                                {/* Template Selection */}
                                <div className='template-selection' style={{ marginTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                    <label className='section-label'>Resume Template Style</label>
                                    <div className='template-options' style={{ display: 'flex', gap: '0.75rem', marginTop: '0.2rem' }}>
                                        <label className={`template-option-card ${selectedTemplate === 'early' ? 'active' : ''}`} style={{ flex: 1, padding: '0.75rem', borderRadius: '0.4rem', border: '1px solid ' + (selectedTemplate === 'early' ? '#ff2d78' : '#2a3348'), background: selectedTemplate === 'early' ? 'rgba(255, 45, 120, 0.05)' : '#1e2535', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.25rem', minHeight: '50px' }}>
                                            <input type='radio' name='template' value='early' checked={selectedTemplate === 'early'} onChange={() => setSelectedTemplate('early')} style={{ display: 'none' }} />
                                            <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: selectedTemplate === 'early' ? '#ff2d78' : '#e6edf3' }}>Early Career</span>
                                        </label>
                                        <label className={`template-option-card ${selectedTemplate === 'exptrack' ? 'active' : ''}`} style={{ flex: 1, padding: '0.75rem', borderRadius: '0.4rem', border: '1px solid ' + (selectedTemplate === 'exptrack' ? '#ff2d78' : '#2a3348'), background: selectedTemplate === 'exptrack' ? 'rgba(255, 45, 120, 0.05)' : '#1e2535', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.25rem', minHeight: '50px' }}>
                                            <input type='radio' name='template' value='exptrack' checked={selectedTemplate === 'exptrack'} onChange={() => setSelectedTemplate('exptrack')} style={{ display: 'none' }} />
                                            <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: selectedTemplate === 'exptrack' ? '#ff2d78' : '#e6edf3' }}>Experienced Track</span>
                                        </label>
                                    </div>
                                    
                                    {/* Live Interactive Preview Box */}
                                    <div className='template-preview-box' style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.35rem', background: '#1c2230', padding: '0.75rem', borderRadius: '0.4rem', border: 'none' }}>
                                        <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#7d8590', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                            Live Design Preview ({selectedTemplate === 'early' ? 'Early Career' : 'Experienced Track'}) &bull; <span style={{ color: '#ff2d78', textTransform: 'none', cursor: 'pointer' }} onClick={() => setShowModal(true)}>Click to zoom</span>
                                        </span>
                                        <div style={{ width: '100%', maxHeight: '250px', overflowY: 'auto', overflowX: 'hidden', borderRadius: '0.25rem', background: '#fff', padding: '0', cursor: 'pointer' }} onClick={() => setShowModal(true)}>
                                            <img 
                                                src={selectedTemplate === 'early' ? '/templates/early.png' : '/templates/exptrack.png'} 
                                                alt={`Preview of ${selectedTemplate}`} 
                                                style={{ width: '100%', display: 'block', height: 'auto', objectFit: 'contain' }} 
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Roadmap Duration (Days) */}
                                <div className='roadmap-days-section' style={{ marginTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                    <label className='section-label' htmlFor='preparationDays'>Roadmap Duration</label>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <input
                                            type='number'
                                            id='preparationDays'
                                            name='preparationDays'
                                            min='1'
                                            max='60'
                                            value={preparationDays}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                setPreparationDays(val === '' ? '' : Math.max(1, parseInt(val, 10) || 1));
                                            }}
                                            placeholder='7 Days (Default)'
                                            className='panel__textarea'
                                            style={{
                                                flex: 1,
                                                height: '42px',
                                                padding: '0.5rem 0.75rem',
                                                background: '#1c2230',
                                                border: '1px solid #2a3348',
                                                borderRadius: '0.4rem',
                                                color: '#e6edf3',
                                                fontSize: '0.9rem',
                                                minHeight: 'unset',
                                                boxSizing: 'border-box'
                                            }}
                                        />
                                        <span style={{ fontSize: '0.85rem', color: '#7d8590' }}>days until interview</span>
                                    </div>
                                </div>

                                {/* Info Box */}
                                <div className='info-box' style={{ marginTop: '1.25rem' }}>
                                    <span className='info-box__icon'>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" stroke="#1a1f27" strokeWidth="2" /><line x1="12" y1="16" x2="12.01" y2="16" stroke="#1a1f27" strokeWidth="2" /></svg>
                                    </span>
                                    <p>Either a <strong>Resume</strong> or a <strong>Self Description</strong> is required to generate a personalized plan.</p>
                                </div>
                            </div>
                        </div>

                        {/* Card Footer */}
                        <div className='interview-card__footer'>
                            <span className='footer-info'>AI-Powered Strategy Generation &bull; Approx 30s</span>
                            <button
                                onClick={handleGenerateReport}
                                disabled={loading || generating}
                                className={`generate-btn ${generating ? 'generate-btn--loading' : ''}`}>
                                {generating ? (
                                    <span className='btn-spinner' />
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M10.6144 17.7956 11.492 15.7854C12.2731 13.9966 13.6789 12.5726 15.4325 11.7942L17.8482 10.7219C18.6162 10.381 18.6162 9.26368 17.8482 8.92277L15.5079 7.88394C13.7092 7.08552 12.2782 5.60881 11.5105 3.75894L10.6215 1.61673C10.2916.821765 9.19319.821767 8.8633 1.61673L7.97427 3.75892C7.20657 5.60881 5.77553 7.08552 3.97685 7.88394L1.63658 8.92277C.868537 9.26368.868536 10.381 1.63658 10.7219L4.0523 11.7942C5.80589 12.5726 7.21171 13.9966 7.99275 15.7854L8.8704 17.7956C9.20776 18.5682 10.277 18.5682 10.6144 17.7956ZM19.4014 22.6899 19.6482 22.1242C20.0882 21.1156 20.8807 20.3125 21.8695 19.8732L22.6299 19.5353C23.0412 19.3526 23.0412 18.7549 22.6299 18.5722L21.9121 18.2532C20.8978 17.8026 20.0911 16.9698 19.6586 15.9269L19.4052 15.3156C19.2285 14.8896 18.6395 14.8896 18.4628 15.3156L18.2094 15.9269C17.777 16.9698 16.9703 17.8026 15.956 18.2532L15.2381 18.5722C14.8269 18.7549 14.8269 19.3526 15.2381 19.5353L15.9985 19.8732C16.9874 20.3125 17.7798 21.1156 18.2198 22.1242L18.4667 22.6899C18.6473 23.104 19.2207 23.104 19.4014 22.6899Z"></path></svg>
                                )}
                                {generating ? 'Generating...' : 'Generate My Interview Strategy'}
                            </button>
                        </div>
                    </div>

                    {/* Page Footer */}
                    <footer className='page-footer'>
                        <a href='#'>Privacy Policy</a>
                        <a href='#'>Terms of Service</a>
                        <a href='#'>Help Center</a>
                    </footer>
                </div>
            </main>

            {/* Fullscreen Zoom Modal */}
            {showModal && (
                <div 
                    className="template-zoom-overlay"
                    onClick={() => setShowModal(false)}
                    onKeyDown={(e) => { if (e.key === 'Escape') setShowModal(false); }}
                    tabIndex={0}
                    ref={(el) => el && el.focus()}
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        zIndex: 9999,
                        background: 'rgba(0, 0, 0, 0.88)',
                        backdropFilter: 'blur(8px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'zoom-out',
                        animation: 'fadeInModal 0.2s ease-out'
                    }}
                >
                    {/* Close Button */}
                    <button
                        onClick={(e) => { e.stopPropagation(); setShowModal(false); }}
                        style={{
                            position: 'absolute',
                            top: '1.25rem',
                            right: '1.25rem',
                            background: 'rgba(255, 255, 255, 0.1)',
                            border: '1px solid rgba(255, 255, 255, 0.15)',
                            color: '#fff',
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1.1rem',
                            fontWeight: '300',
                            transition: 'background 0.15s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
                    >
                        ✕
                    </button>

                    {/* Template Name Badge */}
                    <div style={{
                        position: 'absolute',
                        top: '1.25rem',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        background: 'rgba(255, 45, 120, 0.15)',
                        border: '1px solid rgba(255, 45, 120, 0.3)',
                        color: '#ff2d78',
                        padding: '0.3rem 0.9rem',
                        borderRadius: '2rem',
                        fontSize: '0.8rem',
                        fontWeight: '600',
                        letterSpacing: '0.03em'
                    }}>
                        {selectedTemplate === 'early' ? 'Early Career' : 'Experienced Track'} Preview
                    </div>

                    {/* Large Preview Image */}
                    <div 
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            maxWidth: '680px',
                            maxHeight: '90vh',
                            overflowY: 'auto',
                            overflowX: 'hidden',
                            borderRadius: '0.5rem',
                            boxShadow: '0 32px 64px rgba(0, 0, 0, 0.5)',
                            cursor: 'default',
                            animation: 'scaleInModal 0.2s ease-out'
                        }}
                    >
                        <img
                            src={selectedTemplate === 'early' ? '/templates/early.png' : '/templates/exptrack.png'}
                            alt={`Full preview of ${selectedTemplate === 'early' ? 'Early Career' : 'Experienced Track'} template`}
                            style={{
                                width: '100%',
                                display: 'block',
                                height: 'auto',
                                borderRadius: '0.5rem'
                            }}
                        />
                    </div>

                    {/* Hint Text */}
                    <span style={{
                        position: 'absolute',
                        bottom: '1.25rem',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        color: 'rgba(255, 255, 255, 0.4)',
                        fontSize: '0.72rem',
                        fontWeight: '500'
                    }}>
                        Click outside or press ESC to close
                    </span>
                </div>
            )}
        </div>
    )
}

export default Home