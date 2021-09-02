const express = require('express');
const app = express();
port = 3080;

const Tracery = require('./src/tracery.js');

app.use(express.json());
app.use(express.urlencoded({
    extended: true
}));
app.use(express.static(process.cwd()+"/app/dist/app/"));

app.get('/api/question', (req, res) => {
    let tracery = new Tracery();
    tracery.init();
    tracery.start();
    res.json({question: tracery.question, answer: tracery.answer});
});

app.post('/api/user', (req, res) => {
    const user = req.body.user;
    users.push(user);
    res.json("user addedd");
});

app.get('/', (req, res) => {
    res.sendFile(process.cwd()+"/app/dist/app/index.html");
});

app.listen(port, () => {
    console.log(`Server listening on the port::${port}`);
});