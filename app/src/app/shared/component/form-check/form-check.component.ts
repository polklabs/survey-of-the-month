import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
    selector: 'app-form-check',
    templateUrl: './form-check.component.html',
    styleUrls: ['./form-check.component.scss']
})
export class FormCheckComponent implements OnInit {

    @Input() choices: string[] = [];

    @Input() editable = false;
    @Input() loading = false;

    @Output() aEditText = new EventEmitter<number>();
    @Output() aRandomize = new EventEmitter<number>();
    @Output() aDelete = new EventEmitter<number>();
    @Output() aAdd = new EventEmitter<void>();

    @Output() aUpdate = new EventEmitter<string[]>();
    answers: boolean[] = [];

    constructor() { }

    ngOnInit(): void {
        this.choices.forEach(c => {
            this.answers.push(false);
        });
    }

    addAnswer() {
        this.answers.push(false);
        this.aAdd.emit();
    }

    deleteAnswer(i: number) {
        this.answers.splice(i, 1);
        this.aDelete.emit(i);
    }

    onChange() {
        this.aUpdate.emit(this.answers.map(x => x ? 'true' : 'false'));
    }

}
