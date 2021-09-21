import { Injectable } from "@angular/core";
import { Observable, of } from "rxjs";
import { SurveysStorage, UserStorage } from "src/app/shared/model/local-storage.model";
import { Survey } from "src/app/shared/model/survey.model";

const USERS = 'users';
const SURVEYS = 'Surveys';

@Injectable({
    providedIn: 'root'
})
export class LocalStorageService {
  
    

    getUsers(): UserStorage[] {
        const usersString = localStorage.getItem(USERS);
        if (usersString !== null) {
            return JSON.parse(usersString);
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

    addSurvey(name: string, id: string, key: string): void {
        const surveys = this.getSurveys();
        const index = surveys.findIndex(x => x.id === id && x.key === key)
        if (index !== -1) {
            surveys.splice(index, 1);
        }
        surveys.push({name, id, key});
        this.setSurveys(surveys);
    }

    delSurvey(id: string): void {
        const surveys = this.getSurveys();
        const index = surveys.findIndex(x => x.id === id)
        if (index !== -1) {
            surveys.splice(index, 1);
        }
        this.setSurveys(surveys);
    }

    setSurveys(surveys: SurveysStorage[]): void {
        localStorage.setItem(SURVEYS, JSON.stringify(surveys));
    }

} 