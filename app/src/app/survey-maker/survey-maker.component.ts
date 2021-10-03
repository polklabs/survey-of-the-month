import { Component, OnInit } from '@angular/core';
import { DataService } from '../core/services/data.service';
import { AnswerType, Question } from '../shared/model/question.model';
import { Survey } from '../shared/model/survey.model';
import { v4 as guid } from 'uuid';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { MatChipInputEvent } from '@angular/material/chips';
import { BehaviorSubject, Observable } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DialogService } from '../core/services/dialog.service';
import { LocalStorageService } from '../core/services/local-storage.service';
import { APIData } from '../shared/model/api-data.model';
import { QuestionHolderService } from '../core/services/questionHolder.service';
import { moveItemInArray } from '@angular/cdk/drag-drop';

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

    id = '';
    key = '';

    survey: Survey = new Survey();
    editable = true;

    debounceButton = false;
    loading: boolean[] = [];
    loadingUnknown = false;

    scrollDelay?: HTMLElement;

    dirty = false;

    constructor(
        private dataService: DataService,
        private activatedroute: ActivatedRoute,
        private snackBar: MatSnackBar,
        private dialogService: DialogService,
        private localStorageService: LocalStorageService,
        private router: Router,
        private questionHolderService: QuestionHolderService
    ) { }

    ngOnInit(): void {
        this.getCachedUsers();
        this.activatedroute.paramMap.subscribe(params => {
            const id = params.get('id');
            const key = params.get('key');
            if (id && id !== '0' && key && key !== '0') {
                this.id = id;
                this.key = key;
                this.getSurvey();
            } else if (id && id === '0' && key && key === '0') {
                this.id = guid();
                this.key = '';
                this.survey = new Survey();
                this.getCachedUsers();
                const qTemp = this.questionHolderService.getQuestion();
                if (qTemp) {
                    this.survey.questions.push(qTemp);
                }
            }
        });
    }

    canDeactivate(): Observable<boolean> | boolean {
        if (this.dirty) {
            return this.dialogService.confirm('Discard changes to this Survey?');
        }
        return true;
    }

    // Question --------------------------------------------------------------------------------------

    getQuestionWithFilter(typeFilter: AnswerType): void {
        this.getQuestion(undefined, undefined, undefined, undefined, typeFilter);
    }

    getQuestionWithOrigin(origin: string): void {
        this.getQuestion(undefined, undefined, undefined, undefined, undefined, origin);
    }

    getQuestion(questionIndex = -1, reset = false, seed = '', shuffle = false, typeFilter?: AnswerType, origin?: string): void {
        this.dirty = true;
        const questionData: any = { users: this.getUserNames(), seed, questionOrigin: undefined, typeFilter, origin };

        if (reset) {
            // Reset a basic template question
            if (questionIndex !== -1 && this.survey.questions[questionIndex].custom) {
                this.addQuestion(this.survey.questions[questionIndex].answerType, questionIndex);
                return;
            }
            questionData.seed = this.survey.questions[questionIndex].seed;
        }

        if (shuffle && questionIndex !== -1 && !this.survey.questions[questionIndex].custom) {
            questionData.questionOrigin = this.survey.questions[questionIndex].questionOrigin;
            questionData.seed = this.survey.questions[questionIndex].seed;
        }

        this.callApi('question', questionData, questionIndex)?.subscribe(data => {
            if (data !== null) {
                if (data.ok) {
                    if (questionIndex === -1) {
                        this.survey.questions.push(data.data);
                        this.loading.push(false);
                        this.scroll();
                    } else {
                        this.survey.questions[questionIndex] = data.data;
                    }
                } else {
                    this.dialogService.error(data.error).subscribe(
                        () => this.router.navigateByUrl('/home')
                    );
                }
            }
        });
    }

    addQuestion(type: AnswerType, questionIndex = -1): void {
        this.dirty = true;
        const question = new Question();
        question.answerType = type;
        question.text = 'Use the pencil button in the lower right to edit this text...';
        if (question.answerType === 'rank') {
            question.answerCount = 2;
            question.choices.push('Answer 2');
        }
        if (questionIndex === -1) {
            this.survey.questions.push(question);
            this.loading.push(false);
            this.scroll();
        } else {
            this.survey.questions[questionIndex] = question;
        }
    }

    deleteQuestion(questionIndex: number): void {
        this.dirty = true;
        this.survey.questions.splice(questionIndex, 1);
        this.loading.splice(questionIndex, 1);
    }

    seedQuestion(questionIndex = -1): void {
        this.dirty = true;
        this.dialogService.textInput(
            'Enter the question # or a random value',
            'Seed',
            '',
            false
        ).subscribe(result => {
            if (result !== undefined) {
                this.getQuestion(questionIndex, false, result);
            }
        });
    }

    editQuestion(questionIndex: number): void {
        this.dirty = true;
        const question = this.survey.questions[questionIndex];
        this.dialogService.textInput(
            'Enter the question text. Basic <a href="https://www.simplehtmlguide.com/cheatsheet.php" target="_blank">HTML formatting</a> is allowed.',
            'Text',
            question.text,
            true
        ).subscribe(result => {
            if (result !== undefined) {
                question.text = result;
            }
        });
    }

    editQuestionType(questionIndex: number, answerType: AnswerType): void {
        this.dirty = true;
        this.survey.questions[questionIndex].answerType = answerType;
    }

    // Answer -------------------------------------------------------------------------------------

    getAnswer(questionIndex = -1, choiceIndex = -1): void {
        this.dirty = true;
        this.callApi(
            'choice',
            { question: this.survey.questions[questionIndex], users: this.getUserNames(), choiceIndex },
            questionIndex)?.subscribe(
                data => {
                    if (data !== null) {
                        if (data.ok) {
                            this.survey.questions[questionIndex] = data.data;
                        } else {
                            this.dialogService.error(data.error).subscribe(
                                () => this.router.navigateByUrl('/home')
                            );
                        }
                    }
                }
            );
    }

    addAnswer(questionIndex: number): void {
        this.dirty = true;
        this.survey.questions[questionIndex].choices.push('New Answer...');
        this.survey.questions[questionIndex].answerCount++;
    }

    deleteAnswer(questionIndex: number, choiceIndex: number): void {
        this.dirty = true;
        this.survey.questions[questionIndex].choices.splice(choiceIndex, 1);
        this.survey.questions[questionIndex].answerCount--;
    }

    editAnswer(questionIndex: number, choiceIndex: number): void {
        this.dirty = true;
        const question = this.survey.questions[questionIndex];
        const value = choiceIndex === -1 ? question.otherOptionText : question.choices[choiceIndex];
        this.dialogService.textInput(
            'Enter the answer text. Basic <a href="https://www.simplehtmlguide.com/cheatsheet.php" target="_blank">HTML formatting</a> is allowed.',
            'Text',
            value,
            true
        ).subscribe(result => {
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
        this.dirty = true;
        this.survey.questions[questionIndex].otherOptionAllow = !this.survey.questions[questionIndex].otherOptionAllow;
    }

    editScaleValues(questionIndex: number): void {
        this.dirty = true;
        const question = this.survey.questions[questionIndex];
        const value = question.scaleValues.join(' ; ');
        this.dialogService.textInput(
            'Enter the rating values separated by semicolons.',
            'Values',
            value,
            false
        ).subscribe((result: string | undefined) => {
            if (result !== undefined) {

                const results = result.split(';');
                question.scaleValues = results.map(x => x.trim());
            }
        });
    }

    // Survey -------------------------------------------------------------------------------------

    getSurvey(): void {
        this.loadingUnknown = true;
        const [result, _] = this.dataService.getData(`survey-edit?id=${this.id}&key=${this.key}`);
        result.subscribe((data: APIData) => {
            if (data.ok) {
                if (!data.data) {
                    this.dialogService.alert('Survey has no data.');
                    return;
                }
                this.survey = data.data?.survey;
            } else {
                this.dialogService.error(data.error);
            }
            this.loadingUnknown = false;
        });
    }

    saveSurvey(): void {
        this.survey.email = this.survey.email.trim().toLowerCase();
        this.loadingUnknown = true;
        const [result, _] = this.dataService.putData('survey', { survey: this.survey, id: this.id, key: this.key });
        result.subscribe((data: { ok: boolean, id?: string, key?: string, error?: any }) => {
            this.loadingUnknown = false;
            if (data.ok && data.id && data.key) {
                this.survey.emailSent = true;
                this.localStorageService.addSurvey(this.survey.name, data.id, data.key);
                this.id = data.id;
                this.key = data.key;
                this.snackBar.open('Saved!', 'OK', { duration: 3000 });
                this.dirty = false;
                this.router.navigateByUrl(`/manage-survey/${this.id}/${this.key}`);
            } else if (!data.ok) {
                this.dialogService.error(data.error);
            }

        });
    }

    // Edit Users ------------------------------------------

    addUser(event: MatChipInputEvent): void {
        this.dirty = true;
        const input = event.input;
        const value = event.value;

        if ((value || '').trim()) {
            this.survey.users.push({ _id: guid(), name: value.trim() });
        }

        // Reset the input value
        if (input) {
            input.value = '';
        }
        this.cacheUsers();
    }

    removeUser(user: { _id: string, name: string }): void {
        this.dirty = true;
        const index = this.survey.users.indexOf(user);

        if (index >= 0) {
            this.survey.users.splice(index, 1);
        }
        this.cacheUsers();
    }

    getUserNames(): string[] {
        return this.survey.users.map(x => x.name);
    }

    cacheUsers(): void {
        this.localStorageService.setUsers(this.getUserNames());
    }

    getCachedUsers(): void {
        this.survey.users = this.localStorageService.getUsers().map(x => ({ name: x, _id: guid() }));
    }

    // API ---------------------------------------------------------------------------
    callApi(endpoint: string, data: any, questionIndex: number): BehaviorSubject<APIData | null> | null {
        if (this.debounceButton) { return null; }
        this.debounceButton = true;
        setTimeout(() => this.debounceButton = false, 750);

        const toReturn = new BehaviorSubject<APIData | null>(null);

        this.setLoading(questionIndex, true);
        const [result, _] = this.dataService.postData(endpoint, data);
        setTimeout(() => {
            result.subscribe(resultData => {
                toReturn.next(resultData);
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

    setScroll(el?: HTMLElement): void {
        this.scrollDelay = el;
    }

    scroll(): void {
        if (this.scrollDelay) {
            setTimeout(() => {
                this.scrollDelay?.scrollIntoView();
                this.scrollDelay = undefined;
            }, 100);
        }
    }

    canMoveUp(i: number): boolean {
        if (i === 0) { return false; }
        return true;
    }

    canMoveDown(i: number): boolean {
        if (i === this.survey.questions.length - 1) { return false; }
        return true;
    }

    move(i: number, dir: 1 | -1): void {
        moveItemInArray(this.survey.questions, i, i + dir);
        this.dirty = true;
    }

    openFeedback(): void {
        this.dialogService.feedback();
    }

}
