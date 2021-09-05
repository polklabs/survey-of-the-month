import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { DataService } from '../core/services/data.service';
import { Question } from '../shared/model/question.model';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { MatChipInputEvent } from '@angular/material/chips';
import { TextBoxComponent } from '../shared/modal/text-box/text-box.component';
import { MatDialog } from '@angular/material/dialog';

@Component({
    selector: 'app-single-question',
    templateUrl: './single-question.component.html',
    styleUrls: ['./single-question.component.scss']
})
export class SingleQuestionComponent implements OnInit {

    usersSelectable = true;
    usersRemovable = true;
    usersAddOnBlur = true;
    readonly separatorKeysCodes = [ENTER, COMMA] as const;

    @ViewChild('answerMC', { static: true }) answerMC!: TemplateRef<any>;
    @ViewChild('answerText', { static: true }) answerText!: TemplateRef<any>;
    @ViewChild('answerRank', { static: true }) answerRank!: TemplateRef<any>;
    @ViewChild('answerMA', { static: true }) answerMA!: TemplateRef<any>;
    @ViewChild('answerDate', { static: true }) answerDate!: TemplateRef<any>;

    question: Question = new Question();
    users: string[] = ['Bob', 'Alice'];

    debounceButton = false;
    loading = false;

    constructor(
        private dataService: DataService,
        private dialog: MatDialog
    ) { }

    ngOnInit(): void {
        this.getCachedUsers();
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
        this.callApi('question', { users: this.users, answerOrigin: this.question.answerOrigin });
    }

    seedQuestion(): void {
        const dialogRef = this.dialog.open(TextBoxComponent, {
            width: '250px',
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
        const [result, progress] = this.dataService.postData(endpoint, data);
        setTimeout(() => {
            result.subscribe((data: Question) => {
                this.question = data;
                this.loading = false;
            });
        }, 500);
    }

    drop(event: CdkDragDrop<string[]>) {
        moveItemInArray(this.question.choices, event.previousIndex, event.currentIndex);
    }

    getAnswerTemplate(): TemplateRef<any> {
        switch (this.question.answerType) {
            case 'mc':
                return this.answerMC;
            case 'text':
                return this.answerText;
            case 'rank':
                return this.answerRank;
            case 'ma':
                return this.answerMA;
            case 'date':
                return this.answerDate;
            default:
                throw new Error(`Unknown Answer Type: ${this.question.answerType}`);
        }
    }

    getCanRefreshAnswers(): boolean {
        const at = this.question.answerType;
        return (at === 'mc' || at === 'rank' || at === 'ma');
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
    }

    getCachedUsers(): void {
        const usersString = localStorage.getItem('users');
        if (usersString !== null) {
            this.users = JSON.parse(usersString);
        }
    }

}
