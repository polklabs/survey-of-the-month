import { Component, OnInit } from '@angular/core';
import { DataService } from '../core/services/data.service';
import { AnswerType, Question } from '../shared/model/question.model';
import { Survey } from '../shared/model/survey.model';
import { v4 as guid } from 'uuid';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { MatChipInputEvent } from '@angular/material/chips';
import { BehaviorSubject } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { TextBoxComponent } from '../shared/modal/text-box/text-box.component';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
    selector: 'app-survey-maker',
    templateUrl: './survey-maker.component.html',
    styleUrls: ['./survey-maker.component.scss']
})
export class SurveyMakerComponent implements OnInit {

    usersSelectable = true;
    usersRemovable = true;
    usersAddOnBlur = true;
    readonly separatorKeysCodes = [ENTER, COMMA] as const;

    users: string[] = ['Bob', 'Alice'];
    survey: Survey = new Survey();
    editable = true;

    debounceButton = false;
    loading: boolean[] = [];
    loadingUnknown = false;

    constructor(
        private dataService: DataService,
        private dialog: MatDialog,
        private router: Router,
        private activatedroute: ActivatedRoute
    ) { }

    ngOnInit(): void {
        this.survey = new Survey();
        this.getCachedUsers();
        this.activatedroute.paramMap.subscribe(params => { 
            const id = params.get('id'); 
            if (id && id !== '0') {
                this.getSurvey(id);
            }
        });
    }

    // Question --------------------------------------------------------------------------------------

    getQuestion(questionIndex = -1, reset=false, seed='', shuffle = false): void {
        const questionData: any =  { users: this.users, seed, questionOrigin: undefined };

        if (reset) {
            // Reset a basic template question
            if (questionIndex !== -1 && this.survey.questions[questionIndex].custom) {
                this.addQuestion(this.survey.questions[questionIndex].answerType, questionIndex);
                return;
            }
            questionData.seed = this.survey.questions[questionIndex].seed
        }

        if (shuffle && questionIndex !== -1 && !this.survey.questions[questionIndex].custom) {
            questionData.questionOrigin = this.survey.questions[questionIndex].questionOrigin;
            questionData.seed = this.survey.questions[questionIndex].seed
        }

        console.log(questionData);

        this.callApi<Question>('question', questionData, questionIndex)?.subscribe(data => {
            if (data !== null) {
                console.log(data);
                if (questionIndex === -1) {
                    this.survey.questions.push(data);
                    this.loading.push(false);
                } else {
                    this.survey.questions[questionIndex] = data;
                }
            }
        });
    }

    addQuestion(type: AnswerType, questionIndex = -1): void {
        const question = new Question();
        question.answerType = type;
        question.text = 'Use the pencil button in the lower right to edit this text...'
        if (questionIndex === -1) {
            this.survey.questions.push(question);
            this.loading.push(false);
        } else {
            this.survey.questions[questionIndex] = question;
        }
    }

    deleteQuestion(questionIndex: number): void {
        this.survey.questions.splice(questionIndex, 1);
        this.loading.splice(questionIndex,1);
    }

    seedQuestion(questionIndex = -1): void {
        const dialogRef = this.dialog.open(TextBoxComponent, {
            maxWidth: '95vw',
            width: '500px',
            data: { title: 'Enter the question # or a random value', inputLabel: 'Seed', value: '' }
        });
        dialogRef.afterClosed().subscribe(result => {
            if (result !== undefined) {
                this.getQuestion(questionIndex, false, result);
            }
        });
    }

    editQuestion(questionIndex: number): void {
        const question = this.survey.questions[questionIndex];

        const dialogRef = this.dialog.open(TextBoxComponent, {
            maxWidth: '95vw',
            width: '800px',
            data: { title: 'Enter the question text', inputLabel: 'Text', value: question.text }
        });
        dialogRef.afterClosed().subscribe(result => {
            if (result !== undefined) {
                question.text = result;
            }
        });
    }

    editQuestionType(questionIndex: number, answerType: AnswerType): void {
        this.survey.questions[questionIndex].answerType = answerType;
    }

    // Answer -------------------------------------------------------------------------------------

    getAnswer(questionIndex = -1, choiceIndex = -1): void {
        this.callApi<Question>('choice', { question: this.survey.questions[questionIndex], users: this.users, choiceIndex }, questionIndex)?.subscribe(
            data => {
                if (data !== null) {
                    this.survey.questions[questionIndex] = data;
                }
            }
        );
    }

    addAnswer(questionIndex: number): void {
        this.survey.questions[questionIndex].choices.push('New Answer...');
        this.survey.questions[questionIndex].answerCount++;
    }

    deleteAnswer(questionIndex: number, choiceIndex: number): void {
        this.survey.questions[questionIndex].choices.splice(choiceIndex, 1);
        this.survey.questions[questionIndex].answerCount--;
    }

    editAnswer(questionIndex: number, choiceIndex: number): void {
        const question = this.survey.questions[questionIndex];
        const value = choiceIndex === -1 ? question.otherOptionText : question.choices[choiceIndex];

        const dialogRef = this.dialog.open(TextBoxComponent, {
            maxWidth: '95vw',
            width: '800px',
            data: { title: 'Enter the question text', inputLabel: 'Text', value }
        });
        dialogRef.afterClosed().subscribe(result => {
            if (result !== undefined) {
                if (choiceIndex === -1) {
                    question.otherOptionText = result;
                } else {
                    question.choices[choiceIndex] = result;
                }
            }
        });
    }

    otherOptionAllow(questionIndex: number): void {
        this.survey.questions[questionIndex].otherOptionAllow = !this.survey.questions[questionIndex].otherOptionAllow;
    }

    editScaleValues(questionIndex: number): void {
        const question = this.survey.questions[questionIndex];
        const value = question.scaleValues.join(' ; ');

        const dialogRef = this.dialog.open(TextBoxComponent, {
            maxWidth: '95vw',
            width: '800px',
            data: { title: 'Enter the rating values separated by semicolons.', inputLabel: 'Values', value }
        });
        dialogRef.afterClosed().subscribe((result: string | undefined) => {
            if (result !== undefined) {
                
                const results = result.split(';');
                question.scaleValues = results.map(x => x.trim());
            }
        });
    }

    // Survey -------------------------------------------------------------------------------------

    getSurvey(guid: string): void {
        const [result, progress] = this.dataService.getData('survey?id=' + guid);
        result.subscribe((data: { ok: boolean, data?: Survey, headers?: any, status?: any, error?: any }) => {
            if (data.ok) {
                this.survey = data.data!;
                this.users = this.survey.users.map(x => x.name);
            } else {
                console.error(data.error);
            }
        });
    }

    saveSurvey(): void {
        this.loadingUnknown = true;
        const [result, progress] = this.dataService.putData('survey', this.survey);
        result.subscribe(
            (data: { ok: boolean, id?: string, rev?: string, error?: any }) => {
            this.loadingUnknown = false;
            if (data.ok && data.id) {
                this.saveSurveyID(data.id);
                this.router.navigateByUrl(`/manage-survey/${data.id}`);
            }

        }) ?? console.error('NULL Returned');
    }

    saveSurveyID(id: string): void {
        const s = localStorage.getItem('Surveys');
        let surveys: string[] = [];
        if (s) {
            surveys = JSON.parse(s);
        }
        surveys.push(id);
        localStorage.setItem('Surveys', JSON.stringify(surveys));
    }

    // Edit Users ------------------------------------------

    addUser(event: MatChipInputEvent): void {
        const input = event.input;
        const value = event.value;

        // Add our fruit
        if ((value || '').trim()) {
            this.users.push(value.trim());
        }

        // Reset the input value
        if (input) {
            input.value = '';
        }
        this.cacheUsers();
    }

    removeUser(user: string): void {
        const index = this.users.indexOf(user);

        if (index >= 0) {
            this.users.splice(index, 1);
        }
        this.cacheUsers();
    }

    cacheUsers(): void {
        localStorage.setItem('users', JSON.stringify(this.users));
        this.assignUsers();
    }

    getCachedUsers(): void {
        const usersString = localStorage.getItem('users');
        if (usersString !== null) {
            this.users = JSON.parse(usersString);
            this.assignUsers();
        }
    }

    assignUsers(): void {
        this.survey.users = this.users.map(x => { return { name: x, _id: guid() } });
    }

    // API ---------------------------------------------------------------------------
    callApi<T>(endpoint: string, data: any, questionIndex: number, dataServiceMethod = this.dataService.postData): BehaviorSubject<T | null> | null {
        if (this.debounceButton) return null;
        this.debounceButton = true;
        setTimeout(() => this.debounceButton = false, 750);

        const toReturn = new BehaviorSubject<T | null>(null);

        this.setLoading(questionIndex, true);
        const [result, progress] = this.dataService.postData(endpoint, data);
        setTimeout(() => {
            result.subscribe(data => {
                toReturn.next(data);
                toReturn.complete();
                this.setLoading(questionIndex, false);
            });
        }, 500);

        return toReturn;
    }

    setLoading(index: number, value: boolean): void {
        if (index !== -1 && this.loading.length > index) {
            this.loading[index] = value;
        } else {
            this.loadingUnknown = value;
        }
    }

}
