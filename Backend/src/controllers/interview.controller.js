const pdfParse = require("pdf-parse")
const zlib = require("zlib")
const { generateInterviewReport, generateResumePdf, generateResumeHtmlAndScore } = require("../services/ai.service")
const interviewReportModel = require("../models/interviewReport.model")

function detectPdfFont(buffer) {
    if (!buffer) return "Arial, Helvetica, sans-serif";
    try {
        const fontNames = new Set();
        
        // Scan the buffer for "stream" and "endstream"
        let index = 0;
        while (true) {
            const streamStart = buffer.indexOf('stream', index);
            if (streamStart === -1) break;
            
            let dataStart = streamStart + 6;
            if (buffer[dataStart] === 13) dataStart++; // \r
            if (buffer[dataStart] === 10) dataStart++; // \n
            
            const streamEnd = buffer.indexOf('endstream', dataStart);
            if (streamEnd === -1) break;
            
            const compressedData = buffer.slice(dataStart, streamEnd);
            try {
                const decompressed = zlib.inflateSync(compressedData);
                const text = decompressed.toString('ascii');
                
                const baseFontRegex = /\/BaseFont\s*\/([^\s()<>[\]{}/%]+)/g;
                let match;
                while ((match = baseFontRegex.exec(text)) !== null) {
                    fontNames.add(match[1]);
                }
                
                const fontNameRegex = /\/FontName\s*\/([^\s()<>[\]{}/%]+)/g;
                while ((match = fontNameRegex.exec(text)) !== null) {
                    fontNames.add(match[1]);
                }
            } catch (err) {
                // Ignore zlib inflate errors for non-flate-compressed streams
            }
            index = streamEnd + 9;
        }

        // Also search the raw uncompressed ascii string for BaseFont/FontName just in case
        const str = buffer.toString('ascii');
        const baseFontRegex = /\/BaseFont\s*\/([^\s()<>[\]{}/%]+)/g;
        let match;
        while ((match = baseFontRegex.exec(str)) !== null) {
            fontNames.add(match[1]);
        }
        const fontNameRegex = /\/FontName\s*\/([^\s()<>[\]{}/%]+)/g;
        while ((match = fontNameRegex.exec(str)) !== null) {
            fontNames.add(match[1]);
        }

        if (fontNames.size === 0) {
            return "Arial, Helvetica, sans-serif";
        }

        const commonFonts = {
            times: 'Times New Roman, Times, Georgia, serif',
            georgia: 'Georgia, serif',
            garamond: 'Garamond, Georgia, serif',
            cambria: 'Cambria, Georgia, serif',
            cm: 'Georgia, Times New Roman, Times, serif', // LaTeX Computer Modern Roman
            lm: 'Georgia, Times New Roman, Times, serif', // LaTeX Latin Modern
            sfrm: 'Georgia, Times New Roman, Times, serif', // LaTeX Computer Modern Roman variation
            arial: 'Arial, Helvetica, sans-serif',
            helvetica: 'Helvetica, Arial, sans-serif',
            calibri: 'Calibri, Arial, sans-serif',
            verdana: 'Verdana, Geneva, sans-serif',
            trebuchet: 'Trebuchet MS, Helvetica, sans-serif',
            tahoma: 'Tahoma, Geneva, sans-serif',
            courier: 'Courier New, Courier, monospace',
            consolas: 'Consolas, monospace',
            roboto: 'Roboto, Arial, sans-serif',
            lato: 'Lato, Arial, sans-serif',
            open: 'Open Sans, Arial, sans-serif',
            montserrat: 'Montserrat, Arial, sans-serif',
            inter: 'Inter, Arial, sans-serif'
        };

        const counts = {};
        for (const key of Object.keys(commonFonts)) {
            counts[key] = 0;
        }

        for (const fontName of fontNames) {
            const lower = fontName.toLowerCase();
            for (const key of Object.keys(commonFonts)) {
                if (lower.includes(key)) {
                    counts[key]++;
                }
            }
        }

        let bestKey = 'arial';
        let maxCount = 0;
        for (const key of Object.keys(counts)) {
            if (counts[key] > maxCount) {
                maxCount = counts[key];
                bestKey = key;
            }
        }

        return maxCount > 0 ? commonFonts[bestKey] : "Arial, Helvetica, sans-serif";
    } catch (e) {
        console.error("Error detecting PDF font:", e);
        return "Arial, Helvetica, sans-serif";
    }
}

function extractPdfUrls(buffer) {
    if (!buffer) return [];
    try {
        const uris = new Set();
        let index = 0;
        while (true) {
            const streamStart = buffer.indexOf('stream', index);
            if (streamStart === -1) break;
            
            let dataStart = streamStart + 6;
            if (buffer[dataStart] === 13) dataStart++;
            if (buffer[dataStart] === 10) dataStart++;
            
            const streamEnd = buffer.indexOf('endstream', dataStart);
            if (streamEnd === -1) break;
            
            const compressedData = buffer.slice(dataStart, streamEnd);
            try {
                const decompressed = zlib.inflateSync(compressedData);
                const text = decompressed.toString('ascii');
                
                const uriRegex = /\/URI\s*\(([^)]+)\)/g;
                let match;
                while ((match = uriRegex.exec(text)) !== null) {
                    uris.add(match[1]);
                }
            } catch (err) {
                // Ignore zlib inflate errors
            }
            index = streamEnd + 9;
        }
        
        // Also search uncompressed raw text
        const str = buffer.toString('ascii');
        const uriRegex = /\/URI\s*\(([^)]+)\)/g;
        let match;
        while ((match = uriRegex.exec(str)) !== null) {
            uris.add(match[1]);
        }
        
        return Array.from(uris);
    } catch (e) {
        console.error("Error extracting PDF URLs:", e);
        return [];
    }
}




/**
 * @description Controller to generate interview report based on user self description, resume and job description.
 */
async function generateInterViewReportController(req, res) {
    try {
        let resumeContent = ""
        let detectedFont = "Arial, Helvetica, sans-serif"
        let extractedUrls = []

        if (req.file) {
            const pdfData = await pdfParse(req.file.buffer)
            resumeContent = pdfData.text
                .replace(/ï/g, "•")
                .replace(/§/g, "▪")
                .replace(/🕿/g, "📞")
                .replace(/\uFFFD/g, "")
            
            detectedFont = detectPdfFont(req.file.buffer)
            extractedUrls = extractPdfUrls(req.file.buffer)
        }
        const { selfDescription, jobDescription, template = "early", preparationDays } = req.body

        let parsedPreparationDays = parseInt(preparationDays, 10);
        if (isNaN(parsedPreparationDays) || parsedPreparationDays <= 0) {
            parsedPreparationDays = 7;
        }

        const [interViewReportByAi, refinedResumeByAi] = await Promise.all([
            generateInterviewReport({
                resume: resumeContent,
                selfDescription,
                jobDescription,
                preparationDays: parsedPreparationDays
            }),
            generateResumeHtmlAndScore({
                resume: resumeContent,
                selfDescription,
                jobDescription,
                template,
                fontFamily: detectedFont,
                extractedUrls
            })
        ])

        const originalScore = interViewReportByAi.metadata?.matchScoreOriginal || 50;
        let refinedScore = refinedResumeByAi.matchScoreRefined;
        let isOriginalResumeOptimal = false;

        if (refinedScore < originalScore) {
            refinedScore = originalScore;
            isOriginalResumeOptimal = true;
        }

        const reportMetadata = {
            ...(interViewReportByAi.metadata || {}),
            isOriginalResumeOptimal
        };

        const interviewReport = await interviewReportModel.create({
            user: req.user.id,
            resume: resumeContent,
            originalResumeFile: req.file ? req.file.buffer : undefined,
            originalResumeFileType: req.file ? req.file.mimetype : undefined,
            originalResumeFontFamily: detectedFont,
            extractedUrls,
            selfDescription,
            jobDescription,
            matchScore: refinedScore,
            matchScoreOriginal: originalScore,
            matchScoreRefined: refinedScore,
            refinedResumeHtml: refinedResumeByAi.html,
            refinedResumeData: refinedResumeByAi.data,
            selectedTemplate: template,
            preparationDays: parsedPreparationDays,
            title: interViewReportByAi.metadata?.title || "Tailored Position",
            projectQuestions: interViewReportByAi.projectQuestions,
            workExperienceQuestions: interViewReportByAi.workExperienceQuestions,
            behavioralQuestions: interViewReportByAi.behavioralQuestions,
            metadata: reportMetadata,
            skillGaps: interViewReportByAi.skillGaps,
            preparationPlan: interViewReportByAi.preparationPlan
        })

        res.status(201).json({
            message: "Interview report generated successfully.",
            interviewReport
        })

    }
    
    catch (error) {
        console.log(error)

        if (error?.status === 429) {
            return res.status(429).json({
                message: "AI quota exceeded or rate limit reached. Please wait a moment and try again."
            })
        }

        if (error?.status === 401) {
            return res.status(500).json({
                message: "Invalid OpenAI API key. Please check your OPEN_API_KEY in the .env file."
            })
        }

        res.status(500).json({
            message: "Error generating interview report."
        })
    }
}

/**
 * @description Controller to get interview report by interviewId.
 */
async function getInterviewReportByIdController(req, res) {

    const { interviewId } = req.params

    const interviewReport = await interviewReportModel.findOne({ _id: interviewId, user: req.user.id }).select("-originalResumeFile")

    if (!interviewReport) {
        return res.status(404).json({
            message: "Interview report not found."
        })
    }

    res.status(200).json({
        message: "Interview report fetched successfully.",
        interviewReport
    })
}


/** 
 * @description Controller to get all interview reports of logged in user.
 */
async function getAllInterviewReportsController(req, res) {
    const interviewReports = await interviewReportModel.find({ user: req.user.id }).sort({ createdAt: -1 }).select("-resume -selfDescription -jobDescription -__v -technicalQuestions -behavioralQuestions -skillGaps -preparationPlan -originalResumeFile")

    res.status(200).json({
        message: "Interview reports fetched successfully.",
        interviewReports
    })
}


/**
 * @description Controller to generate resume PDF based on user self description, resume and job description.
 */
async function generateResumePdfController(req, res) {
    try {
        const { interviewReportId } = req.params

        const interviewReport = await interviewReportModel.findOne({ _id: interviewReportId, user: req.user.id })

        if (!interviewReport) {
            return res.status(404).json({
                message: "Interview report not found or unauthorized."
            })
        }

        const pdfBuffer = await generateResumePdf({ htmlContent: interviewReport.refinedResumeHtml })

        res.set({
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename=resume_${interviewReportId}.pdf`
        })

        res.send(pdfBuffer)
    } catch (error) {
        console.error(error)
        res.status(500).json({
            message: "Error generating resume PDF."
        })
    }
}

/**
 * @description Controller to change template of resume, regenerate HTML & refined ATS score, and save in DB.
 */
async function changeResumeTemplateController(req, res) {
    try {
        const { interviewReportId } = req.params
        const { template } = req.body

        const interviewReport = await interviewReportModel.findOne({ _id: interviewReportId, user: req.user.id })

        if (!interviewReport) {
            return res.status(404).json({
                message: "Interview report not found or unauthorized."
            })
        }

        const { resume, selfDescription, jobDescription, originalResumeFontFamily, extractedUrls } = interviewReport

        const refinedResumeByAi = await generateResumeHtmlAndScore({
            resume,
            selfDescription,
            jobDescription,
            template,
            fontFamily: originalResumeFontFamily,
            extractedUrls
        })

        const originalScore = interviewReport.matchScoreOriginal || 50;
        let refinedScore = refinedResumeByAi.matchScoreRefined;
        let isOriginalResumeOptimal = false;

        if (refinedScore < originalScore) {
            refinedScore = originalScore;
            isOriginalResumeOptimal = true;
        }

        interviewReport.selectedTemplate = template
        interviewReport.refinedResumeHtml = refinedResumeByAi.html
        interviewReport.refinedResumeData = refinedResumeByAi.data
        interviewReport.matchScoreRefined = refinedScore
        interviewReport.matchScore = refinedScore
        
        interviewReport.metadata = {
            ...(interviewReport.metadata || {}),
            isOriginalResumeOptimal
        }
        interviewReport.markModified('metadata')
        
        await interviewReport.save()

        res.status(200).json({
            message: "Resume template updated and regenerated successfully.",
            interviewReport
        })

    } catch (error) {
        console.error(error)
        if (error?.status === 429) {
            return res.status(429).json({
                message: "AI quota exceeded or rate limit reached. Please wait a moment and try again."
            })
        }
        res.status(500).json({
            message: "Error updating resume template."
        })
    }
}


/**
 * @description Controller to get the original uploaded resume file binary.
 */
async function getOriginalResumeController(req, res) {
    try {
        const { interviewId } = req.params

        const interviewReport = await interviewReportModel.findOne({ _id: interviewId, user: req.user.id })

        if (!interviewReport) {
            return res.status(404).json({
                message: "Interview report not found."
            })
        }

        if (!interviewReport.originalResumeFile) {
            return res.status(404).json({
                message: "No original resume file found for this report."
            })
        }

        res.set({
            "Content-Type": interviewReport.originalResumeFileType || "application/octet-stream",
            "Content-Disposition": `inline; filename=original_resume_${interviewId}`
        })

        res.send(interviewReport.originalResumeFile)
    } catch (error) {
        console.error(error)
        res.status(500).json({
            message: "Error fetching original resume file."
        })
    }
}

module.exports = { 
    generateInterViewReportController, 
    getInterviewReportByIdController, 
    getAllInterviewReportsController, 
    generateResumePdfController,
    changeResumeTemplateController,
    getOriginalResumeController
}