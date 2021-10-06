import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';

@Component({
    selector: 'app-form-scale',
    templateUrl: './form-scale.component.html',
    styleUrls: ['./form-scale.component.scss']
})
export class FormScaleComponent implements OnChanges {

    @Input() choices: string[] = [];
    @Input() scaleValues: string[] = [];

    @Input() editable = false;
    @Input() loading = false;
    @Input() clear = -1;

    @Output() aEditText = new EventEmitter<number>();
    @Output() aRandomize = new EventEmitter<number>();
    @Output() aDelete = new EventEmitter<number>();
    @Output() aAdd = new EventEmitter<void>();
    @Output() aEditScale = new EventEmitter<void>();
    @Output() aOrder = new EventEmitter<{previousIndex: number, currentIndex: number}>();

    @Output() aUpdate = new EventEmitter<(number | null)[]>();
    answers: (number | null)[] = [];

    constructor() { }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes.clear) {
            this.answers = [];
            this.choices.forEach(() => {
                this.answers.push(null);
            });
        }
    }

    addAnswer(): void {
        this.answers.push(null);
        this.aAdd.emit();
    }

    deleteAnswer(i: number): void {
        this.answers.splice(i, 1);
        this.aDelete.emit(i);
    }

    onChange(): void {
        this.aUpdate.emit(this.answers);
    }

    move(index: number, direction: 1 | -1): void {
        this.aOrder.emit({previousIndex: index, currentIndex: index + direction});
    }


}
