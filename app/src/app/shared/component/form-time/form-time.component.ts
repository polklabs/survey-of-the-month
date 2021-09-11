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

    constructor() { }

}
