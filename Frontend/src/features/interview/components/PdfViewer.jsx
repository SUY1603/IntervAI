import React, { useState, useEffect, useRef } from 'react'

const PDFJS_SCRIPT_URL = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.min.js";
const PDFJS_WORKER_URL = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js";

const PdfViewer = ({ url }) => {
    const [libLoaded, setLibLoaded] = useState(false);
    const [loading, setLoading] = useState(true);
    const containerRef = useRef(null);
    const renderTasksRef = useRef([]);

    // Dynamically load PDF.js library
    useEffect(() => {
        if (window.pdfjsLib) {
            setLibLoaded(true);
            return;
        }

        const script = document.createElement("script");
        script.src = PDFJS_SCRIPT_URL;
        script.async = true;
        script.onload = () => {
            window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_URL;
            setLibLoaded(true);
        };
        script.onerror = (err) => {
            console.error("Failed to load PDF.js from CDN:", err);
        };
        document.body.appendChild(script);
    }, []);

    // Render PDF onto canvases
    useEffect(() => {
        if (!libLoaded || !url || !containerRef.current) return;

        let active = true;
        setLoading(true);

        // Cancel any active rendering tasks
        renderTasksRef.current.forEach(task => {
            try {
                task.destroy();
            } catch (e) {
                // Ignore
            }
        });
        renderTasksRef.current = [];
        containerRef.current.innerHTML = ""; // Clear existing canvases

        const renderPdf = async () => {
            try {
                const pdfjsLib = window.pdfjsLib;
                const loadingTask = pdfjsLib.getDocument(url);
                const pdf = await loadingTask.promise;

                if (!active) return;

                for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
                    if (!active) return;
                    const page = await pdf.getPage(pageNum);
                    
                    // Create canvas element for the page
                    const canvas = document.createElement("canvas");
                    canvas.style.width = "100%";
                    canvas.style.display = "block";
                    canvas.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";
                    canvas.style.marginBottom = "1.5rem";
                    canvas.style.backgroundColor = "#fff";
                    
                    containerRef.current.appendChild(canvas);

                    // Render with scale=2 for crisp text, scaled to fit container via CSS width
                    const viewport = page.getViewport({ scale: 2 });
                    const context = canvas.getContext("2d");
                    canvas.height = viewport.height;
                    canvas.width = viewport.width;

                    const renderContext = {
                        canvasContext: context,
                        viewport: viewport,
                    };

                    const renderTask = page.render(renderContext);
                    renderTasksRef.current.push(renderTask);
                    await renderTask.promise;
                }

                if (active) {
                    setLoading(false);
                }
            } catch (err) {
                console.error("Error rendering PDF:", err);
                if (active) {
                    setLoading(false);
                }
            }
        };

        renderPdf();

        return () => {
            active = false;
        };
    }, [libLoaded, url]);

    return (
        <div style={{ position: "relative", width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
            {loading && (
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", zIndex: 5, background: "#0d1117" }}>
                    <div className="loading-screen__spinner" style={{ width: '40px', height: '40px', borderWidth: '3px' }} />
                    <span style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: '#7d8590' }}>Rendering resume pages...</span>
                </div>
            )}
            <div 
                ref={containerRef} 
                style={{ 
                    width: "100%", 
                    display: "flex", 
                    flexDirection: "column", 
                    alignItems: "center", 
                    overflowY: "auto", 
                    boxSizing: "border-box" 
                }} 
            />
        </div>
    );
};

export default PdfViewer;
