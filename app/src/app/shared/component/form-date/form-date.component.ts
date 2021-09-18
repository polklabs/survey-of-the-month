import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
    selector: 'app-form-date',
    templateUrl: './form-date.component.html',
    styleUrls: ['./form-date.component.scss']
})
export class FormDateComponent implements OnInit {

    @Input() choices: string[] = [];

    @Input() editable = false;
    @Input() loading = false;

    @Output() aEditText = new EventEmitter<number>();
    @Output() aRandomize = new EventEmitter<number>();
    @Output() aDelete = new EventEmitter<number>();
    @Output() aAdd = new EventEmitter<void>();

    @Output() aUpdate = new EventEmitter<(string | null)[]>();
    answers: (Date|null)[] = [];

    constructor() { }

    ngOnInit(): void {
        this.choices.forEach(c => {
            this.answers.push(null);
        });
    }

    addAnswer() {
        this.answers.push(null);
        this.aAdd.emit();
    }

    deleteAnswer(i: number) {
        this.answers.splice(i, 1);
        this.aDelete.emit(i);
    }

    onChange() {
        this.aUpdate.emit(this.answers.map(x => x?.toLocaleDateString() ?? null));
    }

}
