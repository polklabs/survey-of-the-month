import { Component, HostListener, OnInit } from '@angular/core';
import { DataService } from '../../core/services/data.service';
import { AnswerType, Question } from '../../shared/model/question.model';
import { Survey } from '../../shared/model/survey.model';
import { v4 as guid } from 'uuid';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { MatChipInputEvent } from '@angular/material/chips';
import { BehaviorSubject, Observable } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DialogService } from '../../core/services/dialog.service';
import { LocalStorageService } from '../../core/services/local-storage.service';
import { APIData } from '../../shared/model/api-data.model';
import { QuestionHolderService } from '../../core/services/questionHolder.service';
import { moveItemInArray } from '@angular/cdk/drag-drop';
import { animate, style, transition, trigger } from '@angular/animations';
import { AnalyticsService } from 'src/app/core/services/analytics.service';
import { SEOService } from 'src/app/core/services/seo.service';
import { QuestionCacheService } from 'src/app/core/services/question-cache.service';
import { environment } from 'src/environments/environment';

const animationTime = 400;

@Component({
    selector: 'app-survey-maker',
    templateUrl: './survey-maker.component.html',
    styleUrls: ['./survey-maker.component.scss'],
    animations: [
        trigger('slideUpDown', [
            transition(':increment', [
                animate(animationTime + 'ms ease-in', style({ transform: 'translateY(100%)', opacity: 0 }))
            ]),
            transition(':decrement', [
                animate(animationTime + 'ms ease-in', style({ transform: 'translateY(-100%)', opacity: 0 }))
            ])
        ])
    ]
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

    filterTags?: string[];

    debounceButton = false;
    loading: boolean[] = [];
    loadingUnknown = false;

    scrollDelay?: HTMLElement;

    dirty = false;

    githubIssues = environment.githubIssues;

    // For animations
    questionPos: string[] = [];
    movingQuestion = false;

    constructor(
        private dataService: DataService,
        private activatedRoute: ActivatedRoute,
        private snackBar: MatSnackBar,
        private dialogService: DialogService,
        private localStorageService: LocalStorageService,
        private router: Router,
        private questionHolderService: QuestionHolderService,
        private analytics: AnalyticsService,
        private seoService: SEOService,
        private questionCache: QuestionCacheService
    ) { }

    ngOnInit(): void {
        this.seoService.updateTitle('Manager - Survey OTM');
        this.getCachedUsers();
        this.updateFilters();
        this.activatedRoute.paramMap.subscribe(params => {
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

    @HostListener('window:beforeunload')
    canDeactivate(internalNavigation: true | undefined): Observable<boolean> | boolean {
        if (this.dirty) {
            if (internalNavigation === undefined) { return false; }
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

    getQuestionRandom(questionIndex = -1): void {
        this.getQuestion(questionIndex);
    }

    getQuestionShuffle(questionIndex: number): void {
        this.getQuestion(questionIndex, false, '', true);
    }

    getQuestionReset(questionIndex: number): void {
        this.getQuestion(questionIndex, true);
    }

    getQuestion(questionIndex = -1, reset = false, seed = '', shuffle = false, typeFilter?: AnswerType, origin?: string): void {
        const questionData: any = { users: this.getUserNames(), seed, questionOrigin: undefined, typeFilter,
            origin, filterTags: this.filterTags };

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
                        this.calculateQuestionPos();
                        this.questionCache.addQuestion(data.data, `${this.survey.questions.length - 1}`);
                    } else {
                        this.survey.questions[questionIndex] = data.data;
                        this.questionCache.addQuestion(data.data, `${questionIndex}`);
                    }
                    this.dirty = true;
                } else {
                    this.dialogService.error(data.error);
                }
            }
        });
    }

    addQuestion(type: AnswerType, questionIndex = -1): void {
        this.dirty = true;
        const question = new Question();
        question.answerType = type;
        question.text = 'Use the pencil button to the right to edit this text...';
        if (question.answerType === 'rank') {
            question.answerCount = 2;
            question.choices.push('Answer 2');
        }
        if (questionIndex === -1) {
            this.survey.questions.push(question);
            this.loading.push(false);
            this.scroll();
            this.calculateQuestionPos();
            this.questionCache.addQuestion(question, `${this.survey.questions.length - 1}`);
        } else {
            this.survey.questions[questionIndex] = question;
            this.questionCache.addQuestion(question, `${questionIndex}`);
        }
    }

    deleteQuestion(questionIndex: number): void {
        this.dialogService.yesNo('Are you sure?', 'Delete').subscribe(
            ok => {
                if (ok) {
                    this.survey.questions.splice(questionIndex, 1);
                    this.loading.splice(questionIndex, 1);
                    this.calculateQuestionPos();
                    this.dirty = true;
                }
            }
        );
    }

    seedQuestion(questionIndex = -1): void {
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
        const question = this.survey.questions[questionIndex];
        this.dialogService.textInput(
            'Enter the question text. Basic <a href="https://www.simplehtmlguide.com/cheatsheet.php" target="_blank">HTML formatting</a> is allowed.',
            'Text',
            question.text,
            true
        ).subscribe(result => {
            if (result !== undefined) {
                question.text = result;

                this.dirty = true;
            }
        });
    }

    editAnswerFormat(questionIndex: number): void {
        const question = this.survey.questions[questionIndex];
        this.dialogService.textInput(
            'Use a number between curly braces to be replaced with a user\'s answer.\ne.g. "The answer is {0}" will become "The answer is rabbits".\nThe number between brackets referring to an answer option 0,1,2,3,...*\nText may not format properly if question is not fully answered.\n\n"{person}" will format to the name of the person who answered the question.\n\n*Question Type Caveats\nMultiple Choice Questions: only support {0} and no other numbers.\nCheck Questions: Can vary on how many {0,1,2} it supports based on the number of boxes the user checks\n\nBasic <a href="https://www.simplehtmlguide.com/cheatsheet.php" target="_blank">HTML formatting</a> is allowed.',
            'Text',
            question.answerFormat,
            true
        ).subscribe(result => {
            if (result !== undefined) {
                question.answerFormat = result;
                this.dirty = true;
            }
        });
    }

    editQuestionType(questionIndex: number, answerType: AnswerType): void {
        this.survey.questions[questionIndex].answerType = answerType;
        this.dirty = true;
    }

    // Answer -------------------------------------------------------------------------------------

    getAnswer(questionIndex = -1, choiceIndex = -1): void {
        this.callApi(
            'choice',
            { question: this.survey.questions[questionIndex], users: this.getUserNames(), choiceIndex, filterTags: this.filterTags },
            questionIndex)?.subscribe(
                data => {
                    if (data !== null) {
                        if (data.ok) {
                            this.survey.questions[questionIndex] = data.data;
                            this.dirty = true;
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
        this.survey.questions[questionIndex].choices.push('New Answer...');
        this.survey.questions[questionIndex].answerCount++;
        this.dirty = true;
    }

    deleteAnswer(questionIndex: number, choiceIndex: number): void {
        this.dialogService.yesNo('Are you sure?', 'Delete').subscribe(
            ok => {
                if (ok) {
                    this.survey.questions[questionIndex].choices.splice(choiceIndex, 1);
                    this.survey.questions[questionIndex].answerCount--;
                    this.dirty = true;
                }
            }
        );
    }

    editAnswer(questionIndex: number, choiceIndex: number): void {
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
                this.dirty = true;
            }
        });
    }

    orderAnswer(questionIndex: number, event: {previousIndex: number, currentIndex: number}): void {
        moveItemInArray(this.survey.questions[questionIndex].choices, event.previousIndex, event.currentIndex);
        this.dirty = true;
        console.log('Answers Reordered!');
    }

    otherOptionAllow(questionIndex: number): void {
        this.survey.questions[questionIndex].otherOptionAllow = !this.survey.questions[questionIndex].otherOptionAllow;
        this.dirty = true;
    }

    editScaleValues(questionIndex: number): void {
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

                this.dirty = true;
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
                this.seoService.updateTitle(`${this.survey.name} - Survey OTM`);
                this.calculateQuestionPos();
            } else {
                this.dialogService.error(data.error);
            }
            this.loadingUnknown = false;
        });
    }

    saveSurvey(): void {
        if (this.survey.users.length === 0) {
            this.dialogService.alert('Please add at least one person to your survey.');
            return;
        }

        this.survey.email = this.survey.email.trim().toLowerCase();
        this.loadingUnknown = true;
        const [result, _] = this.dataService.putData('survey', { survey: this.survey, id: this.id, key: this.key });
        result.subscribe((data: { ok: boolean, id?: string, key?: string, error?: any }) => {
            this.loadingUnknown = false;
            if (data.ok && data.id && data.key) {
                this.survey.emailSent = true;
                this.localStorageService.addSurvey(this.survey.name, data.id, data.key);
                this.cacheUsers();
                this.id = data.id;
                this.key = data.key;
                this.snackBar.open('Saved!', 'OK', { duration: 3000 });
                this.dirty = false;
                this.router.navigateByUrl(`/manage/${this.id}/${this.key}`);
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
    }

    removeUser(user: { _id: string, name: string }): void {
        this.dirty = true;
        const index = this.survey.users.indexOf(user);

        if (index >= 0) {
            this.survey.users.splice(index, 1);
        }
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

    canMoveUp(i: number): boolean {
        return i !== 0;
    }

    canMoveDown(i: number): boolean {
        return i !== this.survey.questions.length - 1;
    }

    move(i: number, dir: 1 | -1): void {
        if (this.movingQuestion) { return; }
        this.movingQuestion = true;

        moveItemInArray(this.questionPos, i, i + dir);

        setTimeout(() => {
            moveItemInArray(this.survey.questions, i, i + dir);
            this.dirty = true;
            this.movingQuestion = false;
        }, animationTime);
    }

    calculateQuestionPos(): void {
        this.questionPos = this.survey.questions.map(x => x.questionId);
    }

    getQuestionPos(id: string): number {
        const i = this.questionPos.findIndex(x => x === id);
        if (i === -1) { return -1; }
        return i;
    }

    scroll(): void {
        setTimeout(() => {
            const qElem = document.getElementById('question' + this.survey.questions.length);
            if (qElem !== null) {
                qElem.scrollIntoView();
            }
        }, 50);
    }

    updateFilters(filters?: string[]): void {
        if (filters) {
            if (filters.length === 0) {
                this.filterTags = undefined;
            } else {
                this.filterTags = filters;
            }
        } else {
            this.filterTags = this.localStorageService.getTags();
        }
    }

    undo(key: number): void {
        this.survey.questions[key] = this.questionCache.undo(key.toString()) ?? this.survey.questions[key];
    }

    canUndo(key: number): boolean {
        return this.questionCache.canUndo(key.toString());
    }

    redo(key: number): void {
        this.survey.questions[key] = this.questionCache.redo(key.toString()) ?? this.survey.questions[key];
    }

    canRedo(key: number): boolean {
        return this.questionCache.canRedo(key.toString());
    }

}
