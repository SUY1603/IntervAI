import { getAllInterviewReports, generateInterviewReport, getInterviewReportById, generateResumePdf, changeResumeTemplate, getOriginalResume, startMockInterviewApi, submitCandidateAnswerApi, endMockInterviewApi, getMockSessionsApi } from "../services/interview.api"
import { useContext, useEffect, useState } from "react"
import { InterviewContext } from "../interview.context"
import { useParams } from "react-router"


export const useInterview = () => {

    const context = useContext(InterviewContext)
    const { interviewId } = useParams()

    if (!context) {
        throw new Error("useInterview must be used within an InterviewProvider")
    }

    const { 
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
    } = context
    const [ pdfLoading, setPdfLoading ] = useState(false)
    const [ templateLoading, setTemplateLoading ] = useState(false)
    const [ mockSession, setMockSession ] = useState(null)
    const [ mockSessions, setMockSessions ] = useState([])
    const [ mockLoading, setMockLoading ] = useState(false)

    const startMockInterview = async ({ reportId, totalQuestions }) => {
        setMockLoading(true)
        try {
            const data = await startMockInterviewApi({ reportId, totalQuestions })
            setMockSession(data.mockInterview)
            setMockSessions(prev => [data.mockInterview, ...prev])
            return data.mockInterview
        } catch (error) {
            console.error(error)
            alert("Failed to start mock interview session. Please try again.")
            return null
        } finally {
            setMockLoading(false)
        }
    }

    const submitCandidateAnswer = async ({ sessionId, message }) => {
        setMockLoading(true)
        try {
            const data = await submitCandidateAnswerApi({ sessionId, message })
            setMockSession(data.mockInterview)
            setMockSessions(prev => prev.map(s => s._id === sessionId ? data.mockInterview : s))
            return data.mockInterview
        } catch (error) {
            console.error(error)
            alert("Failed to submit response. Please try again.")
            return null
        } finally {
            setMockLoading(false)
        }
    }

    const endMockInterview = async (sessionId) => {
        setMockLoading(true)
        try {
            const data = await endMockInterviewApi({ sessionId })
            setMockSession(data.mockInterview)
            setMockSessions(prev => prev.map(s => s._id === sessionId ? data.mockInterview : s))
            return data.mockInterview
        } catch (error) {
            console.error(error)
            alert("Failed to end mock interview session. Please try again.")
            return null
        } finally {
            setMockLoading(false)
        }
    }

    const fetchMockSessions = async (reportId) => {
        setMockLoading(true)
        try {
            const data = await getMockSessionsApi(reportId)
            setMockSessions(data.sessions)
            return data.sessions
        } catch (error) {
            console.error(error)
            return []
        } finally {
            setMockLoading(false)
        }
    }

    const generateReport = async ({ jobDescription, selfDescription, resumeFile, template, preparationDays }) => {
        setGenerating(true)
        try {
            const response = await generateInterviewReport({ jobDescription, selfDescription, resumeFile, template, preparationDays })
            setReport(response.interviewReport)
            return response.interviewReport
        } catch (error) {
            console.log(error)
            const status = error?.response?.status
            if (status === 429) {
                alert("⚠️ AI quota exceeded. The free-tier Gemini API limit has been reached. Please wait a few minutes and try again, or upgrade your Google AI plan.")
            } else {
                alert("Something went wrong while generating the report. Please try again.")
            }
            return null
        } finally {
            setGenerating(false)
        }
    }

    const changeTemplate = async (interviewReportId, template) => {
        setTemplateLoading(true)
        try {
            const response = await changeResumeTemplate({ interviewReportId, template })
            setReport(response.interviewReport)
            return response.interviewReport
        } catch (error) {
            console.log(error)
            alert("Failed to update template. Please try again.")
            return null
        } finally {
            setTemplateLoading(false)
        }
    }

    const getReportById = async (interviewId) => {
        setLoading(true)
        try {
            const response = await getInterviewReportById(interviewId)
            const reportData = response.interviewReport
            setReport(reportData)
            if (reportData && reportData.originalResumeFileType) {
                setFileType(reportData.originalResumeFileType)
                try {
                    const blob = await getOriginalResume(interviewId)
                    const url = window.URL.createObjectURL(blob)
                    setSafeFileUrl(url)
                } catch (err) {
                    console.error("Error fetching original resume file:", err)
                    setSafeFileUrl(null)
                }
            } else {
                setFileType(null)
                setSafeFileUrl(null)
            }
            return reportData
        } catch (error) {
            console.log(error)
            return null
        } finally {
            setLoading(false)
        }
    }

    const getReports = async () => {
        setLoading(true)
        try {
            const response = await getAllInterviewReports()
            setReports(response.interviewReports)
            return response.interviewReports
        } catch (error) {
            console.log(error)
            return []
        } finally {
            setLoading(false)
        }
    }

    const getResumePdf = async (interviewReportId) => {
        setPdfLoading(true)
        try {
            const response = await generateResumePdf({ interviewReportId })
            const blob = new Blob([ response ], { type: "application/pdf" })
            const url = window.URL.createObjectURL(blob)
            const link = document.createElement("a")
            link.href = url
            link.setAttribute("download", `resume_${interviewReportId}.pdf`)
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            window.URL.revokeObjectURL(url)
        }
        catch (error) {
            console.log(error)
            alert("Failed to generate resume PDF. Please try again.")
        } finally {
            setPdfLoading(false)
        }
    }

    useEffect(() => {
        if (interviewId) {
            getReportById(interviewId)
            fetchMockSessions(interviewId)
        } else {
            getReports()
        }
    }, [ interviewId ])

    return { 
        loading, 
        generating,
        pdfLoading, 
        templateLoading, 
        report, 
        reports, 
        generateReport, 
        getReportById, 
        getReports, 
        getResumePdf, 
        changeTemplate,
        safeFileUrl,
        setSafeFileUrl,
        fileType,
        setFileType,
        mockSession,
        setMockSession,
        mockSessions,
        mockLoading,
        startMockInterview,
        submitCandidateAnswer,
        endMockInterview,
        fetchMockSessions
    }

}