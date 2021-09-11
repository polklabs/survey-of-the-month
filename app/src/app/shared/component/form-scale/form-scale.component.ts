import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
    selector: 'app-form-scale',
    templateUrl: './form-scale.component.html',
    styleUrls: ['./form-scale.component.scss']
})
export class FormScaleComponent implements OnInit {

    @Input() choices: string[] = [];
    @Input() scaleValues: string[] = [];

    @Input() editable = false;
    @Input() loading = false;

    @Output() aEditText = new EventEmitter<number>();
    @Output() aRandomize = new EventEmitter<number>();
    @Output() aDelete = new EventEmitter<number>();
    @Output() aAdd = new EventEmitter<void>();
    @Output() aEditScale = new EventEmitter<void>();

    answers: string[] = [];

    constructor() { }

    ngOnInit(): void {
        this.choices.forEach(c => {
            this.answers.push('');
        });
    }

    addAnswer() {
        this.answers.push('');
        this.aAdd.emit();
    }

    deleteAnswer(i: number) {
        this.answers.splice(i, 1);
        this.aDelete.emit(i);
    }

}
