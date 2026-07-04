const mockInterviewModel = require("../models/mockInterview.model");
const interviewReportModel = require("../models/interviewReport.model");
const { generateMockInterviewerQuestion, generateMockInterviewFeedback } = require("../services/ai.service");

/**
 * @description Controller to start a new mock interview session.
 */
async function startMockInterviewController(req, res) {
    try {
        const { reportId } = req.params;
        const { totalQuestions = 5 } = req.body;

        const report = await interviewReportModel.findOne({ _id: reportId, user: req.user.id });
        if (!report) {
            return res.status(404).json({
                message: "Interview report not found."
            });
        }

        const initialQuestion = await generateMockInterviewerQuestion({
            resume: report.resume,
            jobDescription: report.jobDescription,
            history: []
        });

        const mockInterview = await mockInterviewModel.create({
            report: reportId,
            user: req.user.id,
            totalQuestions: totalQuestions,
            status: "ongoing",
            messages: [{
                role: "interviewer",
                content: initialQuestion
            }]
        });

        res.status(201).json({
            message: "Mock interview session started successfully.",
            mockInterview
        });
    } catch (error) {
        console.error("Error starting mock interview:", error);
        res.status(500).json({
            message: "Error starting mock interview session."
        });
    }
}

/**
 * @description Controller to process a message (candidate response) and generate follow-up or auto-evaluation.
 */
async function sendMessageController(req, res) {
    try {
        const { sessionId } = req.params;
        const { message } = req.body;

        if (!message || message.trim() === "") {
            return res.status(400).json({
                message: "Message content is required."
            });
        }

        const session = await mockInterviewModel.findOne({ _id: sessionId, user: req.user.id });
        if (!session) {
            return res.status(404).json({
                message: "Mock interview session not found."
            });
        }

        if (session.status === "completed") {
            return res.status(400).json({
                message: "This mock interview session is already completed."
            });
        }

        const report = await interviewReportModel.findById(session.report);
        if (!report) {
            return res.status(404).json({
                message: "Linked interview report not found."
            });
        }

        // 1. Save candidate's answer
        session.messages.push({
            role: "candidate",
            content: message
        });

        // Calculate candidate answer count
        const candidateAnswersCount = session.messages.filter(m => m.role === "candidate").length;

        if (candidateAnswersCount >= session.totalQuestions) {
            // 2. Trigger auto-evaluation
            session.status = "completed";
            const feedback = await generateMockInterviewFeedback({
                resume: report.resume,
                jobDescription: report.jobDescription,
                history: session.messages
            });
            session.feedback = feedback;
            await session.save();

            return res.status(200).json({
                message: "Mock interview completed and evaluated.",
                mockInterview: session
            });
        } else {
            // 3. Ask next follow-up question
            const nextQuestion = await generateMockInterviewerQuestion({
                resume: report.resume,
                jobDescription: report.jobDescription,
                history: session.messages
            });

            session.messages.push({
                role: "interviewer",
                content: nextQuestion
            });

            await session.save();

            return res.status(200).json({
                message: "Response processed successfully.",
                mockInterview: session
            });
        }
    } catch (error) {
        console.error("Error processing mock interview message:", error);
        res.status(500).json({
            message: "Error processing interview response."
        });
    }
}

/**
 * @description Controller to voluntarily end a mock interview session early and generate feedback.
 */
async function endMockInterviewController(req, res) {
    try {
        const { sessionId } = req.params;

        const session = await mockInterviewModel.findOne({ _id: sessionId, user: req.user.id });
        if (!session) {
            return res.status(404).json({
                message: "Mock interview session not found."
            });
        }

        if (session.status === "completed") {
            return res.status(200).json({
                message: "Session is already completed.",
                mockInterview: session
            });
        }

        const report = await interviewReportModel.findById(session.report);
        if (!report) {
            return res.status(404).json({
                message: "Linked interview report not found."
            });
        }

        session.status = "completed";

        // Generate feedback even if finished early
        if (session.messages.length > 1) {
            const feedback = await generateMockInterviewFeedback({
                resume: report.resume,
                jobDescription: report.jobDescription,
                history: session.messages
            });
            session.feedback = feedback;
        } else {
            // Insufficient Q&A for feedback
            session.feedback = {
                score: 0,
                strengths: ["No interview answers provided."],
                improvements: ["Participate in the Q&A rounds to get comprehensive feedback."],
                detailedReview: []
            };
        }

        await session.save();

        res.status(200).json({
            message: "Mock interview ended and evaluated successfully.",
            mockInterview: session
        });
    } catch (error) {
        console.error("Error ending mock interview session:", error);
        res.status(500).json({
            message: "Error ending mock interview session."
        });
    }
}

/**
 * @description Controller to get all mock sessions for a report.
 */
async function getMockSessionsController(req, res) {
    try {
        const { reportId } = req.params;

        const sessions = await mockInterviewModel.find({
            report: reportId,
            user: req.user.id
        }).sort({ createdAt: -1 });

        res.status(200).json({
            message: "Mock interview sessions retrieved successfully.",
            sessions
        });
    } catch (error) {
        console.error("Error retrieving mock interview sessions:", error);
        res.status(500).json({
            message: "Error retrieving mock interview sessions."
        });
    }
}

module.exports = {
    startMockInterviewController,
    sendMessageController,
    endMockInterviewController,
    getMockSessionsController
};
