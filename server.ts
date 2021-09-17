import { Tracery } from './src/tracery';
import { Question } from './app/src/app/shared/model/question.model';
import { Survey } from './app/src/app/shared/model/survey.model';
import { SendEmail } from './src/email';

import express from 'express';
import cors from 'cors';
const app = express();
const port = 3080;

import NodeCouchDb from 'node-couchdb';
const couch = new NodeCouchDb({
    auth: {
        user: 'admin',
        pass: 'lagrange'
    }
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({
    extended: true
}));
app.use(express.static(process.cwd()+"/app/dist/app/"));

app.get('/api/home', (_, res: any) => {
    let tracery = new Tracery();
    const subtitle = tracery.simpleStart('home_page_subtitle');
    const text = tracery.simpleStart('home_page_text');
    res.json({subtitle, text});
});

app.get('/api/single', (req: {query: {id: string}}, res: any) => {
    let tracery = new Tracery();
    const text = tracery.simpleStart(req.query.id);
    res.json({text});
});

// Generate a completely new question
app.post('/api/question', (req: {body: {users?: string[], seed?: string, questionOrigin?: number}}, res: any) => {
    let tracery = new Tracery(req.body.users, req.body.seed, req.body.questionOrigin);
    tracery.start();
    res.json(tracery.getQuestion());
});

// Regenerate answers for a specific choice or all
// choiceIndex = -1 for all
app.post('/api/choice', (req: {body: {users?: string[], seed?: string, question: Question, choiceIndex?: number}}, res: any) => {
    let tracery = new Tracery(req.body.users, req.body.seed);
    tracery.setQuestion(req.body.question);
    tracery.generateAnswer(req.body.choiceIndex);
    res.json(tracery.getQuestion());
});

// Save survey
app.put('/api/survey', (req: any, res: any) => {
    couch.insert('surveys', req.body).then(({data, headers, status}) => {
        res.json({ok: true, data, headers, status});
    }, (err: any) => {
        res.json({ok: false, error: err});
    });
});

// Get Survey
app.get('/api/survey', (req: {query: {id: string}}, res: any) => {
    couch.get('surveys', req.query.id).then(({data, headers, status}) => {
        res.json({ok: true, data, headers, status});
    }, (err: any) => {
        res.json({ok: false, error: err});
    });
});

// Submit answers
app.put('/api/answer', (req: any, res: any) => {

});

// Submit Feedback
app.post('/api/feedback', (req: {body: {subject: string, body: string, type: string, returnAddress: string}}, res: any) => {

    let replyTo = req.body.returnAddress;
    const subject = `Survey Of The Month - [${req.body.type}]`;
    let text = req.body.subject + '\n\n' + req.body.body;

    const r = SendEmail(subject, text, 'andrew@polklabs.com', 'andrew@polklabs.com', replyTo, (error, info) => {
        if (error) {
            res.json({ok: false, error});
        } else {
            res.json({ok: true});
        }
    });
    if (r) {
        res.json({ok: false, error: r}); 
    }
});

// Get the angular app files
app.get('*', (_, res: any) => {
    res.sendFile(process.cwd()+"/app/dist/app/index.html");
});

app.listen(port, () => {
    console.log(`Server listening on the port::${port}`);
});