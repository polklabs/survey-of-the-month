import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';

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

    @Output() aUpdate = new EventEmitter<string[]>();
    answers: { hour: string, minute: string, ampm: string }[] = [];

    constructor() { }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['clear']) {
            this.answers = [];
            this.choices.forEach(() => {
                this.answers.push({ hour: '00', minute: '00', ampm: 'AM' });
            });
        }
    }

    addAnswer() {
        this.answers.push({ hour: '00', minute: '00', ampm: 'AM' });
        this.aAdd.emit();
    }

    deleteAnswer(i: number) {
        this.answers.splice(i, 1);
        this.aDelete.emit(i);
    }

    onChange() {
        this.answers.forEach(answ => {
            if (answ.hour) {
                let hour = Number.parseInt(answ.hour);
                if (isNaN(hour)) hour = 1;
                if (hour > 12) hour = 12;
                if (hour < 1) hour = 1;
                answ.hour = hour.toString();
            }
            if (answ.minute) {
                let minute = Number.parseInt(answ.minute);
                if (isNaN(minute)) minute = 0;
                if (minute > 59) minute = 59;
                if (minute < 0) minute = 0;
                answ.minute = minute.toString();
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

}
