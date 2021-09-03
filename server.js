const express = require('express');
const app = express();
port = 3080;

const Tracery = require('./src/tracery.js');

app.use(express.json());
app.use(express.urlencoded({
    extended: true
}));
app.use(express.static(process.cwd()+"/app/dist/app/"));

app.post('/api/question', (req, res) => {
    let tracery = new Tracery();
    tracery.init();
    tracery.addPeople(req.body.users);
    tracery.start();
    res.json({text: tracery.question, choices: tracery.choices, info: tracery.info});
});

app.post('/api/choice', (req, res) => {
    let tracery = new Tracery();
    tracery.init();
    tracery.addPeople(req.body.users);
    tracery.question = req.body.question.text;
    tracery.choices = req.body.question.choices;
    tracery.info = req.body.question.info;
    tracery.generateAnswer(req.body.choiceIndex);
    res.json({text: tracery.question, choices: tracery.choices, info: tracery.info});
});

app.get('/', (req, res) => {
    res.sendFile(process.cwd()+"/app/dist/app/index.html");
});

app.listen(port, () => {
    console.log(`Server listening on the port::${port}`);
});