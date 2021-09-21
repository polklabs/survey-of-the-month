import { Tracery } from './src/tracery';
import { Question } from './app/src/app/shared/model/question.model';
import { Survey } from './app/src/app/shared/model/survey.model';
import { Answer } from './app/src/app/shared/model/answer.model';
import { SendEmail } from './src/email';
import { upsertSurvey, getSurvey, getEditSurvey, deleteSurvey, couch, answerStatus } from './src/couch';
import slowDown from 'express-slow-down';
import rateLimit from 'express-rate-limit';
import express from 'express';
import cors from 'cors';
import crypto from 'crypto';

// Create basic express app -------------------------------------------
const app = express();
const port = 3080;
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({
    extended: true
}));
app.use(express.static(process.cwd() + "/app/dist/app/"));

// Setup rate limiters ------------------------------------------------
app.enable("trust proxy"); // only if you're behind a reverse proxy (Heroku, Bluemix, AWS if you use an ELB, custom Nginx setup, etc)
const speedLimiter = slowDown({
    windowMs: 10 * 60 * 1000, // 15 minutes
    delayAfter: 100, // allow 100 requests per 15 minutes, then...
    delayMs: 500, // begin adding 500ms of delay per request above 100:
    maxDelayMs: 10000 // Will not increase past 10 seconds
});
const feedbackLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour window
    max: 5, // start blocking after 5 requests
    message:
        "Too many feedbacks sent from this IP, please try again after an hour"
});

// API Endpoints -----------------------------------------------------
app.get('/api/home', speedLimiter, (_, res: any) => {
    let tracery = new Tracery();
    const subtitle = tracery.simpleStart('home_page_subtitle');
    const text = tracery.simpleStart('home_page_text');
    res.json({ subtitle, text });
});

app.get('/api/single', speedLimiter, (req: { query: { id: string } }, res: any) => {
    let tracery = new Tracery();
    const text = tracery.simpleStart(req.query.id);
    res.json({ text });
});

// Generate a completely new question
app.post('/api/question', speedLimiter, (req: { body: { users?: string[], seed?: string, questionOrigin?: number } }, res: any) => {
    let tracery = new Tracery(req.body.users, req.body.seed, req.body.questionOrigin);
    tracery.start();
    res.json(tracery.getQuestion());
});

// Regenerate answers for a specific choice or all
// choiceIndex = -1 for all
app.post('/api/choice', speedLimiter, (req: { body: { users?: string[], seed?: string, question: Question, choiceIndex?: number } }, res: any) => {
    let tracery = new Tracery(req.body.users, req.body.seed);
    tracery.setQuestion(req.body.question);
    tracery.generateAnswer(req.body.choiceIndex);
    res.json(tracery.getQuestion());
});

// Surveys ------------------------------------------------------------------------------------------

app.put('/api/survey', speedLimiter, (req: { body: { survey: Survey, id: string, key: string } }, res: any) => {
    upsertSurvey(req.body.survey, req.body.id, req.body.key, res);
});

// Get Survey
app.get('/api/survey', speedLimiter, (req: { query: { id: string } }, res: any) => {
    getSurvey(req.query.id, res);
});

// Get Survey for editing
app.get('/api/survey-edit', speedLimiter, (req: { query: { id: string, key: string } }, res: any) => {
    getEditSurvey(req.query.id, req.query.key, res);
});

app.delete('/api/survey', speedLimiter, (req: { query: { id: string, key: string } }, res: any) => {
    deleteSurvey(req.query.id, req.query.key, res);
});

app.get('/api/answer-status', speedLimiter, (req: { query: {id: string} }, res: any) => {
    answerStatus(req.query.id, res);
});

// Submit answers
app.put('/api/answer', speedLimiter, (req: any, res: any) => {

});

// Submit Feedback
app.post('/api/feedback', feedbackLimiter, (req: { body: { subject: string, body: string, type: string, returnAddress: string } }, res: any) => {

    let replyTo = req.body.returnAddress;
    const subject = `Survey Of The Month - [${req.body.type}]`;
    let text = req.body.subject + '\n\n' + req.body.body;

    const r = SendEmail(subject, text, 'andrew@polklabs.com', 'andrew@polklabs.com', replyTo, (error, info) => {
        if (error) {
            res.json({ ok: false, error });
        } else {
            res.json({ ok: true });
        }
    });
    if (r) {
        res.json({ ok: false, error: r });
    }
});

// Get the angular app files
app.get('*', (_, res: any) => {
    res.sendFile(process.cwd() + "/app/dist/app/index.html");
});

// Start up web server
app.listen(port, () => {
    console.log(`Server listening on the port::${port}`);
});