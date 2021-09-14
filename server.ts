import { Tracery } from './src/tracery';

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

app.get('/api/home', (req: any, res: any) => {
    let tracery = new Tracery();
    const subtitle = tracery.simpleStart('home_page_subtitle');
    const text = tracery.simpleStart('home_page_text');
    res.json({subtitle, text});
});

app.get('/api/single', (req: any, res: any) => {
    let tracery = new Tracery();
    const text = tracery.simpleStart(req.query.id);
    res.json({text});
});

// Generate a completely new question
app.post('/api/question', (req: any, res: any) => {
    let tracery = new Tracery(req.body.users, req.body.seed, req.body.questionOrigin);
    tracery.start();
    res.json(tracery.getJSON());
});

// Regenerate answers for a specific choice or all
// choiceIndex = -1 for all
app.post('/api/choice', (req: any, res: any) => {
    let tracery = new Tracery(req.body.users, req.body.seed);
    tracery.setJSON(req.body.question);
    tracery.generateAnswer(req.body.choiceIndex);
    res.json(tracery.getJSON());
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
app.get('/api/survey', (req: any, res: any) => {
    couch.get('surveys', req.query.id).then(({data, headers, status}) => {
        res.json({ok: true, data, headers, status});
    }, (err: any) => {
        res.json({ok: false, error: err});
    });
});

// Submit answers
app.put('/api/answer', (req: any, res: any) => {

});

// Get the angular app files
app.get('*', (req: any, res: any) => {
    res.sendFile(process.cwd()+"/app/dist/app/index.html");
});

app.listen(port, () => {
    console.log(`Server listening on the port::${port}`);
});