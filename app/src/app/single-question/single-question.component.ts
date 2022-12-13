import { Component, OnInit, ViewChild } from '@angular/core';
import { DataService } from '../core/services/data.service';
import { Question } from '../shared/model/question.model';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { MatChipInputEvent } from '@angular/material/chips';
import { LocalStorageService } from '../core/services/local-storage.service';
import { FormQuestionComponent } from '../shared/component/form-question/form-question.component';
import { APIData } from '../shared/model/api-data.model';
import { DialogService } from '../core/services/dialog.service';
import { QuestionHolderService } from '../core/services/questionHolder.service';
import { Router } from '@angular/router';
import { AnalyticsService } from '../core/services/analytics.service';
import { QuestionCacheService } from '../core/services/question-cache.service';

@Component({
    selector: 'app-single-question',
    templateUrl: './single-question.component.html',
    styleUrls: ['./single-question.component.scss']
})
export class SingleQuestionComponent implements OnInit {

    @ViewChild('singleQuestion', {static: false}) questionComp?: FormQuestionComponent;

    usersSelectable = true;
    usersRemovable = true;
    usersAddOnBlur = true;
    readonly separatorKeysCodes = [ENTER, COMMA] as const;

    question: Question = new Question();
    users: string[] = [];
    filterTags?: string[];
    hideTags = true;

    debounceButton = false;
    loading = false;
    firstCall = true;

    constructor(
        private dialogService: DialogService,
        private dataService: DataService,
        private localStorageService: LocalStorageService,
        private questionHolderService: QuestionHolderService,
        private router: Router,
        private analytics: AnalyticsService,
        private questionCache: QuestionCacheService
    ) { }

    ngOnInit(): void {
        this.users = this.localStorageService.getUsers();
        this.updateFilters();
        this.getQuestion();
    }

    getQuestion(): void {
        this.callApi('question', { users: this.users, filterTags: this.filterTags });
    }

    undo(): void {
        this.question = this.questionCache.undo() ?? this.question;
    }

    redo(): void {
        this.question = this.questionCache.redo() ?? this.question;
    }

    canUndo(): boolean {
        return this.questionCache.canUndo();
    }

    canRedo(): boolean {
        return this.questionCache.canRedo();
    }

    updateChoices(): void {
        this.callApi('choice', { question: this.question, users: this.users, choiceIndex: -1, filterTags: this.filterTags });
    }

    updateQuestion(): void {
        this.callApi('question', { users: this.users, questionOrigin: this.question.questionOrigin, filterTags: this.filterTags });
    }

    seedQuestion(): void {
        this.dialogService.textInput(
            'Enter a value to use as the seed for the random number generator. This may not provide the same results between website updates',
            'Seed',
            '',
            false
        ).subscribe(result => {
            if (result !== undefined) {
                this.callApi('question', { users: this.users, seed: result });
            }
        });
    }

    callApi(endpoint: string, data: any): void {
        if (this.debounceButton) { return; }
        this.debounceButton = true;
        setTimeout(() => this.debounceButton = false, 750);

        this.loading = true;
        const [result, _] = this.dataService.postData(endpoint, data);
        setTimeout(() => {
            result.subscribe((resultData: APIData) => {
                if (resultData.ok) {
                    this.question = resultData.data;
                    this.questionCache.addQuestion(this.question);
                } else {
                    this.dialogService.error(data.error);
                }
                this.loading = false;
                if (this.questionComp) { this.questionComp.clearAnswer(); }

                // if (!this.firstCall) {
                //     setTimeout(() => {
                //         this.scroll('scrollTo');
                //     }, 50);
                // }
                this.firstCall = false;
            });
        }, 500);
    }

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
        this.localStorageService.setUsers(this.users);
    }

    removeUser(user: string): void {
        const index = this.users.indexOf(user);

        if (index >= 0) {
            this.users.splice(index, 1);
        }
        this.localStorageService.setUsers(this.users);
    }

    randomizeUsers(): void {
        this.localStorageService.setUsers([]);
        this.users = this.localStorageService.getUsers();
    }

    createSurvey(): void {
        this.questionHolderService.saveQuestion(this.question);
        this.router.navigateByUrl('/manage/make/0/0');
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

    scroll(id: string): void {
        const el = document.getElementById(id);
        if (el) {
            el.scrollIntoView();
        }
    }

}
