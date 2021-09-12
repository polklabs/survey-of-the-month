import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
    selector: 'app-form-time',
    templateUrl: './form-time.component.html',
    styleUrls: ['./form-time.component.scss']
})
export class FormTimeComponent {

    @Input() choices: string[] = [];

    @Input() editable = false;
    @Input() loading = false;

    @Output() aEditText = new EventEmitter<number>();
    @Output() aRandomize = new EventEmitter<number>();
    @Output() aDelete = new EventEmitter<number>();
    @Output() aAdd = new EventEmitter<void>();

    @Output() aUpdate = new EventEmitter<string[]>();
    answers: {hour: string, minute: string, ampm: string}[] = [];

    constructor() { }

    ngOnInit(): void {
        console.log('Init Time');
        this.choices.forEach(c => {
            this.answers.push({hour: '00', minute: '00', ampm: 'AM'});
        });
    }

    addAnswer() {
        this.answers.push({hour: '00', minute: '00', ampm: 'AM'});
        this.aAdd.emit();
    }

    deleteAnswer(i: number) {
        this.answers.splice(i, 1);
        this.aDelete.emit(i);
    }

    onChange() {
        this.aUpdate.emit(this.answers.map(x => `${this.padNumber(x.hour, 2)}:${this.padNumber(x.minute, 2)} ${x.ampm}`));
    }

    padNumber(value: string, count: number, pad = '0'): string {
        while(value.length < count) {
            value = pad + value;
        }
        return value;
    }

}
