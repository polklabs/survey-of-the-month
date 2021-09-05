const express = require('express');
const cors = require('cors');
const app = express();
port = 3080;

const NodeCouchDb = require('node-couchdb');
const couch = new NodeCouchDb({
    auth: {
        user: 'admin',
        pass: 'lagrange'
    }
});

const Tracery = require('./src/tracery.js');

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({
    extended: true
}));
app.use(express.static(process.cwd()+"/app/dist/app/"));

app.get('/api/home', (req, res) => {
    let tracery = new Tracery();
    tracery.init();
    const title = tracery.simpleStart('home_page_title');
    const subtitle = tracery.simpleStart('home_page_subtitle');
    const text = tracery.simpleStart('home_page_text');
    res.json({title, subtitle, text});
});

app.get('/api/single', (req, res) => {
    let tracery = new Tracery();
    tracery.init();
    const text = tracery.simpleStart(req.query.id);
    res.json({text});
});

// Generate a completely new question
app.post('/api/question', (req, res) => {
    let tracery = new Tracery();
    tracery.init(req.body.users);
    if (req.body.answerOrigin !== undefined) {
        tracery.answerOrigin = req.body.answerOrigin;
    }
    tracery.start();
    res.json(tracery.getJSON());
});

// Regenerate answers for a specific choice or all
// choiceIndex = -1 for all
app.post('/api/choice', (req, res) => {
    let tracery = new Tracery();
    tracery.init(req.body.users);
    tracery.setJSON(req.body.question);
    tracery.generateAnswer(req.body.choiceIndex);
    res.json(tracery.getJSON());
});

// Save survey
app.put('/api/survey', (req, res) => {
    couch.insert('surveys', req.body).then(({data, headers, status}) => {
        res.json({ok: true, data, headers, status});
    }, err => {
        res.json({ok: false, error: err});
    });
});

// Get Survey
app.get('/api/survey', (req, res) => {
    couch.get('surveys', req.query.id).then(({data, headers, status}) => {
        res.json({ok: true, data, headers, status});
    }, err => {
        res.json({ok: false, error: err});
    });
});

// Submit answers
app.put('/api/answer', (req, res) => {

});

// Get the angular app files
app.get('*', (req, res) => {
    res.sendFile(process.cwd()+"/app/dist/app/index.html");
});

app.listen(port, () => {
    console.log(`Server listening on the port::${port}`);
});