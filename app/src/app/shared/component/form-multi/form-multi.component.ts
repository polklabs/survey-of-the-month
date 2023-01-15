import { Component, ElementRef, EventEmitter, Input, OnChanges, Output, SimpleChanges, ViewChild } from '@angular/core';

@Component({
    selector: 'app-form-multi',
    templateUrl: './form-multi.component.html',
    styleUrls: ['./form-multi.component.scss']
})
export class FormMultiComponent implements OnChanges {

    @ViewChild('otherOptionInput', {static: false}) otherOptionInput?: ElementRef;

    @Input() choices: string[] = [];
    @Input() otherOptionAllow = true;
    @Input() otherOptionText = 'Other';

    @Input() editable = false;
    @Input() loading = false;
    @Input() clear = 0;

    @Output() aEditText = new EventEmitter<number>();
    @Output() aRandomize = new EventEmitter<number>();
    @Output() aDelete = new EventEmitter<number>();
    @Output() aAdd = new EventEmitter<void>();
    @Output() aOtherOptionAllow = new EventEmitter<void>();
    @Output() aOrder = new EventEmitter<{previousIndex: number, currentIndex: number}>();

    @Output() aUpdate = new EventEmitter<any[]>();
    answer: string | number | null = null;
    otherAnswer = '';

    constructor() { }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes.clear) {
            this.answer = null;
            this.otherAnswer = '';
        }
    }

    addAnswer(): void {
        this.aAdd.emit();
    }

    deleteAnswer(i: number): void {
        this.aDelete.emit(i);
    }

    onChange(): void {
        if (this.answer === -1) {
            if (this.otherOptionInput) {
                this.otherOptionInput.nativeElement.focus();
            }
            this.aUpdate.emit([this.otherAnswer]);
        } else {
            this.aUpdate.emit([this.answer]);
        }

    }

    triggerRadioButton(): void {
        this.answer = -1;
    }

    move(index: number, direction: 1 | -1): void {
        this.aOrder.emit({previousIndex: index, currentIndex: index + direction});
    }

}
