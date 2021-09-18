import { Tracery } from './src/tracery';
import { Question } from './app/src/app/shared/model/question.model';
import { Survey } from './app/src/app/shared/model/survey.model';
import { Answer } from './app/src/app/shared/model/answer.model';
import { SendEmail } from './src/email';
import slowDown from 'express-slow-down';
import rateLimit from 'express-rate-limit';
import express from 'express';
import cors from 'cors';
import NodeCouchDb from 'node-couchdb';
import fs from 'fs';
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

// Initialize connection to counchDB ----------------------------------
const couchDbSettings = JSON.parse(fs.readFileSync(`./couchDB.json`,
    { encoding: 'utf8', flag: 'r' }));
const couch = new NodeCouchDb(couchDbSettings);

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

// Save survey
app.put('/api/survey', speedLimiter, (req: { body: { survey: Survey, key: string } }, res: any) => {

    couch.get('survey-lock', req.body.survey._id).then(({data}: {data: {key: string}}) => {
        // Document Exists
        const key = data.key;
        if (req.body.key === key) {
            couch.update('surveys', req.body.survey).then(({ data }) => {
                res.json({...data, key});
            }, (err: any) => {
                res.json({ ok: false, error: err });
            });
        } else {
            res.json({ok: false, error: 'Key does not match'});
        }
    },(err: any) => {
        // Document Doesn't exist
        const lock = {_id: req.body.survey._id, key: crypto.randomBytes(8).toString('hex')};

        couch.insert('survey-lock', lock).then(({ data }) => {
            couch.insert('surveys', req.body.survey).then(({ data }) => {
                res.json({...data, key: lock.key});
            }, (err: any) => {
                res.json({ ok: false, error: err });
            });
        }, (err: any) => {
            res.json({ ok: false, error: err });
        }); 
    });
});

// Get Survey
app.get('/api/survey', speedLimiter, (req: { query: { id: string } }, res: any) => {
    couch.get('surveys', req.query.id).then(({ data, headers, status }) => {
        res.json({ ok: true, data });
    }, (err: any) => {
        res.json({ ok: false, error: err });
    });
});

// Get Survey for editing
app.get('/api/survey-edit', speedLimiter, (req: { query: { id: string, key: string } }, res: any) => {

    couch.get('survey-lock', req.query.id).then(({data}: {data: {key: string}}) => {
        // Document Exists
        if (req.query.key === data.key) {
            couch.get('surveys', req.query.id).then(({ data }) => {
                res.json({ ok: true, data });
            }, (err: any) => {
                res.json({ ok: false, error: err });
            });
        } else {
            res.json({ok: false, error: 'Key does not match'});
        }
    },(err: any) => {
        couch.get('surveys', req.query.id).then(({ data }) => {
            res.json({ ok: true, data });
        }, (err: any) => {
            res.json({ ok: false, error: err });
        });
    });
});

app.post('/api/answer-status', speedLimiter, (req: { body: string[] }, res: any) => {
    const answerStatus: { id: string, count: number }[] = [];
    req.body.forEach(id => {
        couch.get('answers', id).then(({ data, headers, status }) => {
            const answer = <Answer>data;
            answerStatus.push({ id, count: answer.answers.length });
            if (answerStatus.length >= req.body.length) {
                res.json(answerStatus);
            }
        }, (err: any) => {
            answerStatus.push({ id, count: 0 });
            if (answerStatus.length >= req.body.length) {
                res.json(answerStatus);
            }
        });
    });
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