import NodeCouchDb from 'node-couchdb';
import fs from 'fs';
import crypto from 'crypto';
import { Survey } from '../app/src/app/shared/model/survey.model';

// TODO: Make into await/synchronous functions

// Initialize connection to counchDB ----------------------------------
const couchDbSettings = JSON.parse(fs.readFileSync(`./couchDB.json`,
    { encoding: 'utf8', flag: 'r' }));
export const couch = new NodeCouchDb(couchDbSettings);

export function upsertSurvey(survey: Survey, userkey: string, res: any): void {

    couch.get('survey-lock', survey._id).then(({data}: {data: {key: string}}) => {
        // Document Exists
        const key = data.key;
        if (key === userkey) {
           updateSurvey(survey, res);
        } else {
            res.json({ok: false, error: 'Invalid Key'});
        }
    },(error: any) => {
        // Document Doesn't exist
        insertSurvey(survey, res);
    });

}

export function updateSurvey(survey: Survey, res: any): void {
    couch.update('surveys', survey).then(({ data }) => {
        res.json({...data});
    }, (error: any) => {
        res.json({ok: false, error});
    });
}

export function insertSurvey(survey: Survey, res: any): void {
    const lock = {_id: survey._id, key: crypto.randomBytes(8).toString('hex')};
    couch.insert('survey-lock', lock).then(() => {
        couch.insert('surveys', survey).then(({ data }) => {
            res.json({...data, key: lock.key});
        }, (error: any) => {
            res.json({ ok: false, error });
        });
    }, (error: any) => {
        res.json({ ok: false, error });
    }); 
}

export function getSurvey(id: string, res: any): void {
    couch.get('surveys', id).then(({ data }) => {
        res.json({ ok: true, data });
    }, (error: any) => {
        res.json({ ok: false, error });
    });
}

export function getEditSurvey(id: string, key: string, res: any): void {
    couch.get('survey-lock', id).then(({data}: {data: {key: string}}) => {
        // Document Exists
        if (key === data.key) {
            getSurvey(id, res);
        } else {
            res.json({ok: false, error: 'Invalid Key'});
        }
    },(err: any) => {
        res.json({ ok: false, error: err });
    });
}

export function deleteSurvey(id: string, key: string, res: any): void {
    couch.get('survey-lock', id).then((lockFile: {data: {key: string, _rev: string}}) => {
        // Document Exists
        if (key === lockFile.data.key) {
            
            couch.get('surveys', id).then(({data}) => {
                data.users.forEach(element => {
                    deleteAnswer(element._id);
                });
                couch.del('surveys', id, data._rev).then(() => {
                    res.json({ok: true});
                    couch.del('survey-lock', id, lockFile.data._rev).then(() => {});
                },
                error => {
                    res.json({ok: false, error});
                });
            });

        } else {
            res.json({ok: false, error: 'Invalid Key'});
        }
    },(error: any) => {
        res.json({ ok: false, error });
    });
}

function deleteAnswer(id: string): void {
    couch.get('answers', id).then(({data}) => {
        couch.del('answers', id, data._rev).then(() => {
        });
    });
}