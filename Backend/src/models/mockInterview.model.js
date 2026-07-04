const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    role: {
        type: String,
        enum: ["interviewer", "candidate"],
        required: true
    },
    content: {
        type: String,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
}, {
    _id: false
});

const detailedReviewSchema = new mongoose.Schema({
    question: {
        type: String,
        required: true
    },
    answer: {
        type: String,
        required: true
    },
    score: {
        type: Number,
        min: 0,
        max: 100,
        required: true
    },
    critique: {
        type: String,
        required: true
    }
}, {
    _id: false
});

const mockInterviewSchema = new mongoose.Schema({
    report: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "InterviewReport",
        required: true,
        index: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
        required: true
    },
    status: {
        type: String,
        enum: ["ongoing", "completed"],
        default: "ongoing"
    },
    totalQuestions: {
        type: Number,
        enum: [5, 10],
        default: 5
    },
    messages: [messageSchema],
    feedback: {
        score: {
            type: Number,
            min: 0,
            max: 100
        },
        strengths: [{
            type: String
        }],
        improvements: [{
            type: String
        }],
        detailedReview: [detailedReviewSchema]
    }
}, {
    timestamps: true
});

const mockInterviewModel = mongoose.model("MockInterview", mockInterviewSchema);

module.exports = mockInterviewModel;
