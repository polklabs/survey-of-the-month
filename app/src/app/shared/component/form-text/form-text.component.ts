import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';

@Component({
    selector: 'app-form-text',
    templateUrl: './form-text.component.html',
    styleUrls: ['./form-text.component.scss']
})
export class FormTextComponent implements OnChanges {

    @Input() choices: string[] = [];

    @Input() editable = false;
    @Input() loading = false;
    @Input() clear = -1;

    @Output() aEditText = new EventEmitter<number>();
    @Output() aRandomize = new EventEmitter<number>();
    @Output() aDelete = new EventEmitter<number>();
    @Output() aAdd = new EventEmitter<void>();

    @Output() aUpdate = new EventEmitter<string[]>();
    answers: string[] = [];

    constructor() { }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['clear']) {
            this.answers = [];
            this.choices.forEach(() => {
                this.answers.push('');
            });
        }
    }

    addAnswer() {
        this.answers.push('');
        this.aAdd.emit();
    }

    deleteAnswer(i: number) {
        this.answers.splice(i, 1);
        this.aDelete.emit(i);
    }

    onChange() {
        this.aUpdate.emit(this.answers);
    }

}
