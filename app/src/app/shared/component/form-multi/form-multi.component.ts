import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
    selector: 'app-form-multi',
    templateUrl: './form-multi.component.html',
    styleUrls: ['./form-multi.component.scss']
})
export class FormMultiComponent {

    @Input() choices: string[] = [];
    @Input() otherOptionAllow: boolean = true;
    @Input() otherOptionText: string = 'Other';

    @Input() editable = false;
    @Input() loading = false;

    @Output() aEditText = new EventEmitter<number>();
    @Output() aRandomize = new EventEmitter<number>();
    @Output() aDelete = new EventEmitter<number>();
    @Output() aAdd = new EventEmitter<void>();
    @Output() aOtherOptionAllow = new EventEmitter<void>();

    @Output() aUpdate = new EventEmitter<any[]>();
    answer: string | number | null = null;
    otherAnswer: string = '';

    constructor() { }

    ngOnInit(): void {
        console.log('Init Multi');
    }

    addAnswer() {
        this.aAdd.emit();
    }

    deleteAnswer(i: number) {
        this.aDelete.emit(i);
    }

    onChange() {
        if (this.answer === -1) {
            this.aUpdate.emit([this.otherAnswer]);
        } else {
            this.aUpdate.emit([this.answer]);
        }
        
    }

}
