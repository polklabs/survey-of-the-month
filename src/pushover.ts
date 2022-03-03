import fs from 'fs';
import request from 'request';

LoadSettings();

var pushoverURL = 'https://api.pushover.net/1/messages.json';
var token = '';
var user = '';
var onNewSurvey = false;
var onAnswerSubmit = false;
var onSurveyDelete = false;

function LoadSettings(): void {
    const pushoverSettings = JSON.parse(fs.readFileSync(`./pushover.json`,
        { encoding: 'utf8', flag: 'r' }));
    token = pushoverSettings['token'];
    user = pushoverSettings['user'];
    onNewSurvey = pushoverSettings['onNewSurvey'];
    onAnswerSubmit = pushoverSettings['onAnswerSubmit'];
    onSurveyDelete = pushoverSettings['onSurveyDelete'];
}

export function sendNewSurveyMsg(surveyTitle: string) {
    if (onNewSurvey) {
        sendMsg(`Survey '${surveyTitle}' was created`, `New Survey Created`);
    }
}

export function sendAnswerSubmitMsg(person: string, survey: string) {
    if (onAnswerSubmit) {
        sendMsg(`${person} has submitted answers for ${survey}`, `New Answers Submitted`);
    }
}

export function sendSurveyDeleteMsg(surveyTitle: string) {
    if (onSurveyDelete) {
        sendMsg(`Survey '${surveyTitle}' was deleted`, `Survey Deleted`);
    }
}

function sendMsg(message: string, title: string): void {
    const options = {
        url: pushoverURL,
        json: true,
        body: {
            token,
            user,
            message,
            title
        }
    };
    request.post(options);
}