import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { SurveysStorage, UserStorage } from 'src/app/shared/model/local-storage.model';

const USERS = 'users';
const SURVEYS = 'Surveys';
const TAGS = 'tags';

@Injectable({
    providedIn: 'root'
})
export class LocalStorageService {

    surveyBS = new BehaviorSubject<SurveysStorage[]>([]);

    getUsers(): UserStorage[] {
        const usersString = localStorage.getItem(USERS);
        const users = JSON.parse(usersString ?? '[]');
        if (users.length > 0) {
            return users;
        }
        return ['Bob', 'Alice'];
    }

    setUsers(users: UserStorage[]): void {
        localStorage.setItem(USERS, JSON.stringify(users));
    }

    getSurveys(): SurveysStorage[] {
        const surveyStrings = localStorage.getItem(SURVEYS);
        if (surveyStrings !== null) {
            return JSON.parse(surveyStrings);
        }
        return [];
    }

    getSurveysWatch(): BehaviorSubject<SurveysStorage[]> {
        const s = this.getSurveys();
        this.surveyBS.next(s);
        return this.surveyBS;
    }

    addSurvey(name: string, id: string, key: string): void {
        const surveys = this.getSurveys();
        const index = surveys.findIndex(x => x.id === id && x.key === key);
        if (index !== -1) {
            surveys.splice(index, 1);
        }
        surveys.push({name, id, key});
        this.setSurveys(surveys);
    }

    delSurvey(id: string): void {
        const surveys = this.getSurveys();
        const index = surveys.findIndex(x => x.id === id);
        if (index !== -1) {
            surveys.splice(index, 1);
        }
        this.setSurveys(surveys);
    }

    setSurveys(surveys: SurveysStorage[]): void {
        localStorage.setItem(SURVEYS, JSON.stringify(surveys));
        this.surveyBS.next(surveys);
    }

    setTags(tags: string[]): void {
        localStorage.setItem(TAGS, JSON.stringify(tags));
    }

    getTags(): string[] {
        const data = localStorage.getItem(TAGS);
        if (data !== null) {
            return JSON.parse(data);
        }
        return ['nsfw'];
    }

}
