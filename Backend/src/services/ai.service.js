const OpenAI = require("openai")
const puppeteer = require("puppeteer")

const openai = new OpenAI({
    apiKey: process.env.OPEN_API_KEY
})

// ─── Interview Report ─────────────────────────────────────────────────────────

async function generateInterviewReport({ resume, selfDescription, jobDescription }) {

    const systemPrompt = `You are an expert interview coach and career advisor. 
You must respond with a valid JSON object that exactly matches this structure:
{
  "matchScore": <number 0-100, how well the candidate matches the job>,
  "title": <string, the job title from the job description>,
  "technicalQuestions": [
    {
      "question": <string, a technical interview question>,
      "intention": <string, why the interviewer asks this>,
      "answer": <string, how to answer it, key points to cover>
    }
  ],
  "behavioralQuestions": [
    {
      "question": <string, a behavioral interview question>,
      "intention": <string, why the interviewer asks this>,
      "answer": <string, how to answer it using STAR method or similar>
    }
  ],
  "skillGaps": [
    {
      "skill": <string, a skill the candidate is missing>,
      "severity": <"low" | "medium" | "high">
    }
  ],
  "preparationPlan": [
    {
      "day": <number, starting from 1>,
      "focus": <string, the main topic for this day>,
      "tasks": [<string, specific task to do>]
    }
  ]
}
Provide at least 5 technical questions, 3 behavioral questions, relevant skill gaps, and a 7-day preparation plan.`

    const userPrompt = `Generate a comprehensive interview report for the following candidate:

Resume:
${resume || "Not provided"}

Self Description:
${selfDescription || "Not provided"}

Job Description:
${jobDescription}`

    const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
    })

    return JSON.parse(response.choices[0].message.content)
}


// ─── Resume PDF ───────────────────────────────────────────────────────────────

async function generatePdfFromHtml(htmlContent) {
    const browser = await puppeteer.launch()
    const page = await browser.newPage()
    await page.setContent(htmlContent, { waitUntil: "networkidle0" })

    const pdfBuffer = await page.pdf({
        format: "A4",
        margin: {
            top: "20mm",
            bottom: "20mm",
            left: "15mm",
            right: "15mm"
        }
    })

    await browser.close()
    return pdfBuffer
}

async function generateResumePdf({ resume, selfDescription, jobDescription }) {

    const systemPrompt = `You are an expert resume writer. 
You must respond with a valid JSON object with a single field:
{
  "html": <string, complete self-contained HTML resume>
}
The HTML should be professional, ATS-friendly, and visually clean. 
Use inline CSS only. No external libraries or fonts. Target 1-2 pages when printed to A4.`

    const userPrompt = `Create a tailored resume for this candidate targeting the given job description.

Resume / Background:
${resume || "Not provided"}

Self Description:
${selfDescription || "Not provided"}

Target Job Description:
${jobDescription}

Requirements:
- Tailor content to highlight relevant experience for the job
- Be ATS-friendly (avoid tables, images, columns for ATS, but feel free to use them visually)
- Professional and concise - 1 to 2 pages max
- Do not make the content sound AI-generated`

    const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
    })

    const jsonContent = JSON.parse(response.choices[0].message.content)
    const pdfBuffer = await generatePdfFromHtml(jsonContent.html)
    return pdfBuffer
}


module.exports = { generateInterviewReport, generateResumePdf }