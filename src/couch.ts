import NodeCouchDb from 'node-couchdb';
import fs from 'fs';
import crypto from 'crypto';
import { Survey } from '../app/src/app/shared/model/survey.model';
import { SurveyContainer } from '../app/src/app/shared/model/survey-container.model';
import { Answer, AnswerStatus } from '../app/src/app/shared/model/answer.model';
import { response } from '../server';
import { SendEmail, SendSurveyEmail } from './email';

// Initialize connection to counchDB ----------------------------------
const couchDbSettings = JSON.parse(fs.readFileSync(`./couchDB.json`,
    { encoding: 'utf8', flag: 'r' }));
export const couch = new NodeCouchDb(couchDbSettings);
// setInterval(() => {
//     console.log('Deleting Old Surveys');
//     deleteOldSurveys();
// }, 24 * 60 * 60 * 1000)


export function upsertSurvey(survey: Survey, id: string, key: string, req: any, res: response): void {

    couch.get('survey', id).then(({ data }: { data: SurveyContainer }) => {
        // Document Exists
        if (key === data.key) {
            updateSurvey(data, survey, req, res);
        } else {
            res.json({ ok: false, error: { code: 'KEY', body: { error: 'Invalid Key', reason: '' } } });
        }
    }, () => {
        // Document Doesn't exist
        insertSurvey(survey, req, res);
    });

}

function updateSurvey(container: SurveyContainer, survey: Survey, req: any, res: response): void {
    container.survey = survey;
    container.lastModifiedDate = new Date().toISOString();
    container.survey.lastModifiedDate = new Date().toISOString();

    // Delete non existent users and non existent questions
    const toDelete_user: number[] = [];
    container.answers.forEach((user, user_index) => {
        if (container.survey.users.findIndex(x => x._id === user.userId) === -1) {
            toDelete_user.push(user_index);
        } else {
            const toDelete_answer: number[] = [];
            user.answers.forEach((answer, answer_index) => {
                if (container.survey.questions.findIndex(x => x.questionId === answer.questionId) === -1) {
                    toDelete_answer.push(answer_index);
                }
            });
            toDelete_answer.reverse();
            toDelete_answer.forEach(index => {
                user.answers.splice(index, 1);
            });
        }
    })
    toDelete_user.reverse();
    toDelete_user.forEach(index => {
        container.answers.splice(index, 1);
    });

    if (!survey.emailSent) {
        SendSurveyEmail(req, container._id, container.key, survey);
        survey.emailSent = true;
    }

    couch.update('survey', container).then(({ data }) => {
        res.json({ ...data, key: container.key });
    }, (error: any) => {
        res.json({ ok: false, error });
    });
}

function insertSurvey(survey: Survey, req: any, res: response): void {
    const container = new SurveyContainer();
    container.key = crypto.randomBytes(8).toString('hex');
    container.survey = survey;

    if (!survey.emailSent) {
        SendSurveyEmail(req, container._id, container.key, survey);
        survey.emailSent = true;
    }

    couch.insert('survey', container).then(({ data }) => {
        res.json({ ...data, key: container.key });
    }, (error: any) => {
        res.json({ ok: false, error });
    });
}

export function getSurvey(id: string, res: response): void {
    couch.get('survey', id).then(({ data }: { data: SurveyContainer }) => {
        res.json({ ok: true, data: data.survey });
    }, (error: any) => {
        res.json({ ok: false, error });
    });
}

export function getEditSurvey(id: string, key: string, res: response): void {
    couch.get('survey', id).then(({ data }: { data: SurveyContainer }) => {
        if (key === data.key) {
            res.json({ ok: true, data })
        } else {
            res.json({ ok: false, error: { code: 'KEY', body: { error: 'Invalid Key', reason: '' } } });
        }
    }, (err: any) => {
        res.json({ ok: false, error: err });
    });
}

export function getResultsSurvey(id: string, key: string, res: response): void {
    couch.get('survey', id).then(({ data }: { data: SurveyContainer }) => {
        if (data.resultsRequireKey ?? true) {
            if (key === data.key) {
                res.json({ ok: true, data })
            } else {
                res.json({ ok: false, error: { code: 'KEY', body: { error: 'Invalid Key', reason: '' } } });
            }
        } else {
            res.json({ ok: true, data })
        }
    }, (err: any) => {
        res.json({ ok: false, error: err });
    });
}

export function putReleaseStatus(requireKey: boolean, id: string, key: string, res: response): void {
    couch.get('survey', id).then(({ data }: { data: SurveyContainer }) => {
        // Document Exists
        if (key === data.key) {
            
            data.resultsRequireKey = requireKey;
            data.lastModifiedDate = new Date().toISOString();

            couch.update('survey', data).then(({ data }) => {
                res.json({ ...data });
            }, (error: any) => {
                res.json({ ok: false, error });
            });

        } else {
            res.json({ ok: false, error: { code: 'KEY', body: { error: 'Invalid Key', reason: '' } } });
        }
    }, (err: any) => {
        res.json({ ok: false, error: err });
    });
}

export function getReleaseStatus(id: string, res: response): void {
    couch.get('survey', id).then(({ data }: { data: SurveyContainer }) => {
        const requireKey = data.resultsRequireKey ?? true;
        res.json({ok: true, data: !requireKey});
    }, (err: any) => {
        res.json({ ok: false, error: err });
    });
} 

export function deleteSurvey(id: string, key: string, res: response): void {
    couch.get('survey', id).then(({ data }: { data: SurveyContainer }) => {
        if (key === data.key) {

            couch.del('survey', id, data._rev).then(() => {
                res.json({ ok: true });
            }, (error: any) => {
                res.json({ ok: false, error });
            });

        } else {
            res.json({ ok: false, error: { code: 'KEY', body: { error: 'Invalid Key', reason: '' } } });
        }
    }, (error: any) => {
        res.json({ ok: false, error });
    });
}

export function answerStatus(id: string, res: response): void {
    couch.get('survey', id).then(({ data }: { data: SurveyContainer }) => {
        const answerStatus: AnswerStatus[] = [];
        data.survey.users.forEach(u => {
            const a = data.answers.find(x => x.userId === u._id);
            answerStatus.push({
                userId: u._id,
                name: u.name,
                count: a?.answers.length ?? 0,
                lastModifiedDate: a?.lastModifiedDate,
                answered: a?.answers.map(x => { return { questionId: x.questionId, lastModifiedDate: x.lastModifiedDate } }) ?? []
            });
        });
        res.json({ ok: true, data: answerStatus });
    }, (error: any) => {
        res.json({ ok: false, error });
    });
}

export function getSurveyEmail(id: string, key: string, callback: (survey?: SurveyContainer) => any, res: response): void {
    couch.get('survey', id).then(({ data }: { data: SurveyContainer }) => {
        if (key === data.key) {
            callback(data);
        } else {
            res.json({ ok: false, error: { code: 'KEY', body: { error: 'Invalid Key', reason: '' } } });
        }
    }, (err: any) => {
        res.json({ ok: false, error: err });
    });
}

// Submit answers ----------------------------------------------------------------------

export function submitAnswers(id: string, answer: Answer, res: response): void {
    couch.get('survey', id).then(({ data }: { data: SurveyContainer }) => {
        const index = data.answers.findIndex(x => x.userId === answer.userId);
        if (index === -1) {
            data.answers.push(answer);
        } else {
            data.answers[index].lastModifiedDate = answer.lastModifiedDate;

            answer.answers.forEach(a => {
                const i = data.answers[index].answers.findIndex(x => x.questionId === a.questionId);
                if (i === -1) {
                    data.answers[index].answers.push(a);
                } else {
                    data.answers[index].answers[i] = a;
                }
            });
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

export function findSurveys(email: string, req: any, res: response): void {
    const query = {
        selector: {
            "survey.email": email
        },
        fields: [
            "_id",
            "key",
            "survey.email",
            "survey.name"
        ]
    };

    couch.mango('survey', query, {}).then(({ data }) => {

        const subject = `Survey Of The Month - Link Retrieval`;
        let text = `Here are the survey link I could find matching your email\n\n`;

        if (data.docs.length <= 0) {
            res.json({ ok: false, error: { code: 'EMPTYDOC', body: { error: '', reason: 'No surveys found.' } } })
            return;
        }

        data.docs.forEach(doc => {
            var fullUrl = req.protocol + '://' + req.get('host') + '/manage/' + doc._id + '/' + doc.key;
            text += doc.survey.name + '\n' + fullUrl + '\n\n';
        });

        const r = SendEmail(subject, text, 'andrew@polklabs.com', email, 'andrew@polklabs.com', (error, info) => {
            if (error) {
                res.json({ ok: false, error });
            } else {
                res.json({ ok: true });
            }
        });
        if (r) {
            res.json({ ok: false, error: { code: 'EMAILERROR', body: { error: r, reason: r } } });
        }


    }, (error: any) => {
        res.json({ ok: false, error });
    });
}

// Survey's will only be kept for a year after their last modified date.
// export function deleteOldSurveys(): void {
//     const deleteCutoff = new Date();
//     deleteCutoff.setFullYear(deleteCutoff.getFullYear()-1);
//     const query = {
//         "selector": {
//             "lastModifiedDate": {
//                 "$lt": deleteCutoff.toISOString()
//             }
//         }
//     };

//     couch.mango('survey', query, {}).then(({ data }) => {

//         if (data.docs.length <= 0) { return; }

//         data.docs.forEach(doc => {
//             couch.del('survey', doc._id, data._rev).then(() => {
//                 console.log(`Deleted: ${doc._id}`);
//             }, (error: any) => {
//                 console.error(error);
//             });
//         });

//     }, (error: any) => {
//         console.error(error);
//     });
// }