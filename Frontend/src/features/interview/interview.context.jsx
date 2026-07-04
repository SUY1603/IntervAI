import { createContext,useState } from "react";


export const InterviewContext = createContext()

export const InterviewProvider = ({ children }) => {
    const [loading, setLoading] = useState(false)
    const [generating, setGenerating] = useState(false)
    const [report, setReport] = useState(null)
    const [reports, setReports] = useState([])
    const [safeFileUrl, setSafeFileUrlState] = useState(null)
    const [fileType, setFileType] = useState(null)

    const setSafeFileUrl = (newUrl) => {
        setSafeFileUrlState(prevUrl => {
            if (prevUrl && typeof prevUrl === 'string' && prevUrl.startsWith('blob:') && prevUrl !== newUrl) {
                try {
                    window.URL.revokeObjectURL(prevUrl)
                } catch (e) {
                    console.error("Error revoking object URL:", e)
                }
            }
            return newUrl
        })
    }

    return (
        <InterviewContext.Provider value={{ 
            loading, 
            setLoading, 
            generating,
            setGenerating,
            report, 
            setReport, 
            reports, 
            setReports, 
            safeFileUrl, 
            setSafeFileUrl, 
            fileType, 
            setFileType 
        }}>
            {children}
        </InterviewContext.Provider>
    )
}