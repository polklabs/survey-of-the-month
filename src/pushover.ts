import request from "request";
import { GetEnvBool, GetEnvString } from "./env";

LoadSettings();

var pushoverURL = "https://api.pushover.net/1/messages.json";
var token: string;
var user: string;
var onNewSurvey: boolean;
var onAnswerSubmit: boolean;
var onSurveyDelete: boolean;

function LoadSettings(): void {
    token = GetEnvString("PUSHOVER_TOKEN", "");
    user = GetEnvString("PUSHOVER_USER", "");
    onNewSurvey = GetEnvBool("PUSHOVER_ON_NEW_SURVEY", false);
    onAnswerSubmit = GetEnvBool("PUSHOVER_ON_ANSWER_SUBMIT", false);
    onSurveyDelete = GetEnvBool("PUSHOVER_ON_SURVEY_DELETE", false);
}

export function sendNewSurveyMsg(surveyTitle: string) {
    if (onNewSurvey === true) {
        sendMsg(`Survey '${surveyTitle}' was created`, `New Survey Created`);
    }
}

export function sendAnswerSubmitMsg(person: string, survey: string) {
    if (onAnswerSubmit === true) {
        sendMsg(
            `'${person}' has submitted answers for '${survey}'`,
            `New Answers Submitted`
        );
    }
}

export function sendSurveyDeleteMsg(surveyTitle: string) {
    if (onSurveyDelete === true) {
        sendMsg(`Survey '${surveyTitle}' was deleted`, `Survey Deleted`);
    }
}

export function sendReportedMsg(surveyId: string, qid: string, answer: string) {
    sendMsg(
        `Public answer was reported '${surveyId}-${qid}' was reported. ${answer}`,
        `Survey Public Answer Reported`
    );
}

function sendMsg(message: string, title: string): void {
    const options = {
        url: pushoverURL,
        json: true,
        body: {
            token,
            user,
            message,
            title,
        },
    };
    request.post(options);
}
