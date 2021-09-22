import { Component, OnInit, ViewChild } from '@angular/core';
import { DataService } from '../core/services/data.service';
import { Question } from '../shared/model/question.model';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { MatChipInputEvent } from '@angular/material/chips';
import { TextBoxComponent } from '../shared/modal/text-box/text-box.component';
import { MatDialog } from '@angular/material/dialog';
import { LocalStorageService } from '../core/services/local-storage.service';
import { FormQuestionComponent } from '../shared/component/form-question/form-question.component';

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

    scrollDelay?: HTMLElement;

    debounceButton = false;
    loading = false;

    constructor(
        private dataService: DataService,
        private dialog: MatDialog,
        private localStorageService: LocalStorageService
    ) { }

    ngOnInit(): void {
        this.users = this.localStorageService.getUsers();
        this.getQuestion();
    }

    getQuestion(): void {
        this.callApi('question', { users: this.users });
    }

    updateChoice(index: number): void {
        this.callApi('choice', { question: this.question, users: this.users, choiceIndex: index });
    }

    updateChoices(): void {
        this.callApi('choice', { question: this.question, users: this.users, choiceIndex: -1 });
    }

    updateQuestion(): void {
        this.callApi('question', { users: this.users, questionOrigin: this.question.questionOrigin });
    }

    seedQuestion(): void {
        const dialogRef = this.dialog.open(TextBoxComponent, {
            maxWidth: '95vw',
            width: '400px',
            data: { title: 'Enter the question # or a random value', inputLabel: 'Seed', value: '' }
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result !== undefined) {
                this.callApi('question', { users: this.users, seed: result });
            }
        });
    }

    callApi(endpoint: string, data: any): void {
        if (this.debounceButton) return;
        this.debounceButton = true;
        setTimeout(() => this.debounceButton = false, 750);

        this.loading = true;
        const [result, _] = this.dataService.postData(endpoint, data);
        setTimeout(() => {
            result.subscribe((data: Question) => {
                this.question = data;
                this.loading = false;
                if(this.questionComp) this.questionComp.clearAnswer();
                this.scroll();
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

    setScroll(el?: HTMLElement): void {
        this.scrollDelay = el;
    }

    scroll(): void {
        if (this.scrollDelay) {
            setTimeout(() => {
                this.scrollDelay?.scrollIntoView();
                this.scrollDelay = undefined;
            }, 250);
        }
    }

}
