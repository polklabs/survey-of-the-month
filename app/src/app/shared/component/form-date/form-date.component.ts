import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
    selector: 'app-form-date',
    templateUrl: './form-date.component.html',
    styleUrls: ['./form-date.component.scss']
})
export class FormDateComponent {

    @Input() choices: string[] = [];

    @Input() editable = false;
    @Input() loading = false;

    @Output() aEditText = new EventEmitter<number>();
    @Output() aRandomize = new EventEmitter<number>();
    @Output() aDelete = new EventEmitter<number>();
    @Output() aAdd = new EventEmitter<void>();

    constructor() { }

}
