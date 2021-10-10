import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';

@Component({
    selector: 'app-form-time',
    templateUrl: './form-time.component.html',
    styleUrls: ['./form-time.component.scss']
})
export class FormTimeComponent implements OnChanges {

    @Input() choices: string[] = [];

    @Input() editable = false;
    @Input() loading = false;
    @Input() clear = -1;

    @Output() aEditText = new EventEmitter<number>();
    @Output() aRandomize = new EventEmitter<number>();
    @Output() aDelete = new EventEmitter<number>();
    @Output() aAdd = new EventEmitter<void>();
    @Output() aOrder = new EventEmitter<{previousIndex: number, currentIndex: number}>();

    @Output() aUpdate = new EventEmitter<string[]>();
    answers: { hour: string, minute: string, ampm: string }[] = [];

    constructor() { }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes.clear) {
            this.answers = [];
            this.choices.forEach(() => {
                this.answers.push({ hour: '12', minute: '00', ampm: 'AM' });
            });
        }
    }

    addAnswer(): void {
        this.answers.push({ hour: '12', minute: '00', ampm: 'AM' });
        this.aAdd.emit();
    }

    deleteAnswer(i: number): void {
        this.answers.splice(i, 1);
        this.aDelete.emit(i);
    }

    onChange(): void {
        this.answers.forEach(answ => {
            if (answ.hour) {
                if (answ.hour === '') { answ.hour = '12'; }
                answ.hour = this.padNumber(answ.hour.toString(), 1);
            }
            if (answ.minute) {
                if (answ.minute === '') { answ.minute = '00'; }
                answ.minute = this.padNumber(answ.minute.toString(), 2);
            }
        });
        this.aUpdate.emit(this.answers.map(x => `${this.padNumber(x.hour, 2)}:${this.padNumber(x.minute, 2)} ${x.ampm}`));
    }

    padNumber(value: string, count: number, pad = '0'): string {
        while (value.length < count) {
            value = pad + value;
        }
        return value;
    }

    move(index: number, direction: 1 | -1): void {
        this.aOrder.emit({previousIndex: index, currentIndex: index + direction});
    }

}
