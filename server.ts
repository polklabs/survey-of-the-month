import { Tracery } from './src/tracery';
import { AnswerType, Question } from './app/src/app/shared/model/question.model';
import { Survey } from './app/src/app/shared/model/survey.model';
import { APIData } from './app/src/app/shared/model/api-data.model';
import { upsertSurvey, getSurvey, getEditSurvey, deleteSurvey, answerStatus, submitAnswers, findSurveys, getResultsSurvey, putReleaseStatus, getReleaseStatus, getStats, updateStat, updateVisitorStat, submitPublicAnswer } from './src/couch';
import slowDown from 'express-slow-down';
import rateLimit from 'express-rate-limit';
import express from 'express';
import cors from 'cors';
import { Answer, SingleAnswer } from './app/src/app/shared/model/answer.model';
import { grammarHTML } from './src/data.html';
import { getTags } from './src/tracery.load';

export type response = { json: (res: APIData) => any };

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
    delayAfter: 250, // allow 100 requests per 15 minutes, then...
    delayMs: 500, // begin adding 500ms of delay per request above 100:
    maxDelayMs: 10000, // Will not increase past 10 seconds,
    skip: (req) => {
        return req.ip.startsWith('192.168.1.');
    }
});
const feedbackLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour window
    max: 5, // start blocking after 5 requests
    message:
        "Too many feedbacks sent from this IP, please try again after an hour"
});

// Question --------------------------------------------------------------------------------------

// Generate a completely new question
app.post('/api/question', speedLimiter, (req: { body: { users?: string[], seed?: string, questionOrigin?: number, typeFilter?: AnswerType, filterTags?: string[], origin?: string } }, res: response) => {
    updateStat(null, {questions_generated: 1});
    let tracery = new Tracery(req.body.users, req.body.seed, req.body.questionOrigin, req.body.typeFilter, req.body.filterTags);
    tracery.start(req.body.origin);
    res.json({ ok: true, data: tracery.getQuestion() });
});

// Regenerate answers for a specific choice or all
// choiceIndex = -1 for all
app.post('/api/choice', speedLimiter, (req: { body: { users?: string[], seed?: string, question: Question, choiceIndex?: number, filterTags?: string[] } }, res: response) => {
    updateStat(null, {questions_generated: 1});
    let tracery = new Tracery(req.body.users, req.body.seed, -1, undefined, req.body.filterTags);
    tracery.setQuestion(req.body.question);
    tracery.generateAnswer(req.body.choiceIndex);
    res.json({ ok: true, data: tracery.getQuestion() });
});

// Surveys ------------------------------------------------------------------------------------------

app.put('/api/survey', speedLimiter, (req: { body: { survey: Survey, id: string, key: string } }, res: response) => {
    upsertSurvey(req.body.survey, req.body.id, req.body.key, req, res);
});

// Get Survey
app.get('/api/survey', speedLimiter, (req: { query: { id: string } }, res: response) => {
    getSurvey(req.query.id, res);
});

// Get Survey for editing
app.get('/api/survey-edit', speedLimiter, (req: { query: { id: string, key: string } }, res: response) => {
    getEditSurvey(req.query.id, req.query.key, res);
});

app.get('/api/survey-results', speedLimiter, (req: { query: { id: string, key: string } }, res: response) => {
    getResultsSurvey(req.query.id, req.query.key, res);
});

app.delete('/api/survey', speedLimiter, (req: { query: { id: string, key: string } }, res: response) => {
    deleteSurvey(req.query.id, req.query.key, res);
});

app.put('/api/release', speedLimiter, (req: { body: { requireKey: boolean, id: string, key: string } }, res: response) => {
    putReleaseStatus(req.body.requireKey, req.body.id, req.body.key, res);
});

// Will return true if results are viewable without secret key
app.get('/api/is-released', speedLimiter, (req: { query: { id: string } }, res: response) => {
    getReleaseStatus(req.query.id, res);
});

// Answers --------------------------------------------------------------------------------------------

app.get('/api/answer-status', speedLimiter, (req: { query: { id: string } }, res: response) => {
    answerStatus(req.query.id, res);
});

// Submit answers
app.put('/api/answer', speedLimiter, (req: { body: { id: string, answers: Answer } }, res: response) => {
    updateStat(null, {questions_answered: req.body.answers.answers.length});
    submitAnswers(req.body.id, req.body.answers, res);
});

app.put('/api/public_answer', speedLimiter, (req: { body: { question: Question, singleAnswers: SingleAnswer } }, res: response) => {
    updateStat(null, {questions_answered: 1});
    submitPublicAnswer(req.body.question, req.body.singleAnswers, res);
});

// Other -------------------------------------------------------------------------------------------------

app.get('/api/find', feedbackLimiter, (req: { query: { email: string } }, res: response) => {
    findSurveys(req.query.email, req, res);
});

app.get('/api/info', speedLimiter, (_, res: any) => {
    res.json({
        ok: true, data: {
            tags: getTags()
        }
    });
});

app.get('/api/home', speedLimiter, (_, res: any) => {
    let tracery = new Tracery();
    const subtitle = tracery.simpleStart('home_page_subtitle');
    const text = tracery.simpleStart('home_page_text');
    res.json({ subtitle, text });
});

app.get('/api/single', speedLimiter, (req: { query: { id: string } }, res: response) => {
    let tracery = new Tracery();
    tracery.filterTags = ['nsfw']
    const text = tracery.simpleStart(req.query.id);
    res.json({ ok: true, data: text });
});

app.get('/api/grammar', speedLimiter, (_, res: any) => {
    res.json({
        ok: true, data: grammarHTML
    });
});

app.get('/api/stats', speedLimiter, (_, res: any) => {
    getStats(res);
});

app.get('/api/visitor', speedLimiter, (req: { query: { unique: string } }, res: any) => {
    updateVisitorStat(res, req.query.unique);
});

// Get the angular app files
app.get('*', (_, res: any) => {
    res.sendFile(process.cwd() + "/app/dist/app/index.html");
});

// Start up web server
app.listen(port, () => {
    console.log(`Server listening on the port::${port}`);
});