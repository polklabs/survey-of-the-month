import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { DataService } from '../core/services/data.service';
import { Question } from '../shared/model/question.model';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { MatChipInputEvent } from '@angular/material/chips';

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

    constructor(private dataService: DataService) { }

    ngOnInit(): void {
        this.getCachedUsers();
        this.getQuestion();
    }

    getQuestion(): void {
        if(this.debounceButton) return;
        this.debounceButton = true;
        setTimeout(()=>this.debounceButton = false, 250);

        const [result, progress] = this.dataService.postData('question', { users: this.users });
        result.subscribe((data: Question) => {
            this.question = data;
            console.log(this.question);
        });
    }

    updateChoice(index: number): void {
        if(this.debounceButton) return;
        this.debounceButton = true;
        setTimeout(()=>this.debounceButton = false, 250);

        const [result, progress] = this.dataService.postData('choice', { question: this.question, users: this.users, choiceIndex: index });
        result.subscribe((data: Question) => {
            this.question = data;
        });
    }

    updateChoices(): void {
        if(this.debounceButton) return;
        this.debounceButton = true;
        setTimeout(()=>this.debounceButton = false, 250);

        const [result, progress] = this.dataService.postData('choice', { question: this.question, users: this.users, choiceIndex: -1 });
        result.subscribe((data: Question) => {
            this.question = data;
        });
    }

    drop(event: CdkDragDrop<string[]>) {
        moveItemInArray(this.question.choices, event.previousIndex, event.currentIndex);
    }

    getAnswerTemplate(): TemplateRef<any> {
        switch (this.question.info.answerType) {
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
                throw new Error(`Unknown Answer Type: ${this.question.info.answerType}`);
        }
    }

    getCanRefreshAnswers(): boolean {
        const at = this.question.info.answerType;
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
