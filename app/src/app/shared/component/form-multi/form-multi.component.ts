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

    constructor() { }

}
