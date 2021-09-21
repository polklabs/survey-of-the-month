import NodeCouchDb from 'node-couchdb';
import fs from 'fs';
import crypto from 'crypto';
import { Survey } from '../app/src/app/shared/model/survey.model';
import { SurveyContainer } from '../app/src/app/shared/model/survey-container.model';
import { Answer } from '../app/src/app/shared/model/answer.model';

// TODO: Make into await/synchronous functions

// Initialize connection to counchDB ----------------------------------
const couchDbSettings = JSON.parse(fs.readFileSync(`./couchDB.json`,
    { encoding: 'utf8', flag: 'r' }));
export const couch = new NodeCouchDb(couchDbSettings);

export function upsertSurvey(survey: Survey, id: string, key: string, res: any): void {

    couch.get('survey', id).then(({ data }: { data: SurveyContainer }) => {
        // Document Exists
        if (key === data.key) {
            updateSurvey(data, survey, res);
        } else {
            res.json({ ok: false, error: 'Invalid Key' });
        }
    }, (error: any) => {
        // Document Doesn't exist
        insertSurvey(survey, res);
    });

}

function updateSurvey(container: SurveyContainer, survey: Survey, res: any): void {
    container.survey = survey;
    container.lastModifiedDate = new Date().toISOString();
    couch.update('survey', container).then(({ data }) => {
        res.json({ ...data, key: container.key });
    }, (error: any) => {
        res.json({ ok: false, error });
    });
}

function insertSurvey(survey: Survey, res: any): void {
    const container = new SurveyContainer();
    container.key = crypto.randomBytes(8).toString('hex');
    container.survey = survey;

    couch.insert('survey', container).then(({ data }) => {
        res.json({ ...data, key: container.key });
    }, (error: any) => {
        res.json({ ok: false, error });
    });
}

export function getSurvey(id: string, res: any): void {
    couch.get('survey', id).then(({ data }: { data: SurveyContainer }) => {
        res.json({ ok: true, data: data.survey });
    }, (error: any) => {
        res.json({ ok: false, error });
    });
}

export function getEditSurvey(id: string, key: string, res: any): void {
    couch.get('survey', id).then(({ data }: { data: SurveyContainer }) => {
        if (key === data.key) {
            res.json({ ok: true, data })
        } else {
            res.json({ ok: false, error: 'Invalid Key' });
        }
    }, (err: any) => {
        res.json({ ok: false, error: err });
    });
}

export function deleteSurvey(id: string, key: string, res: any): void {
    couch.get('survey', id).then(({ data }: { data: SurveyContainer }) => {
        if (key === data.key) {

            couch.del('survey', id, data._rev).then(() => {
                res.json({ ok: true });
            }, (error: any) => {
                res.json({ ok: false, error });
            });

        } else {
            res.json({ ok: false, error: 'Invalid Key' });
        }
    }, (error: any) => {
        res.json({ ok: false, error });
    });
}

export function answerStatus(id: string, res: any): void {
    couch.get('survey', id).then(({ data }: { data: SurveyContainer }) => {
        const answerStatus = data.answers.map(x => { return { id: x.userId, count: x.answers.length } });
        res.json({ ok: true, data: answerStatus });
    }, (error: any) => {
        res.json({ ok: false, error });
    });
}

export function submitAnswers(id: string, answers: Answer, res: any): void {
    couch.get('survey', id).then(({ data }: { data: SurveyContainer }) => {

        const index = data.answers.findIndex(x => x.userId === answers.userId);
        if (index === -1) {
            data.answers.push(answers);
        } else {
            answers.createdDate = data.answers[index].createdDate;
            data.answers[index] = answers;
        }

        couch.update('survey', data).then(({ data }) => {
            res.json(data);
        }, (error: any) => {
            res.json({ ok: false, error });
        });
    }, (error: any) => {
        res.json({ ok: false, error });
    });
}