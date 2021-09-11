import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
    selector: 'app-form-check',
    templateUrl: './form-check.component.html',
    styleUrls: ['./form-check.component.scss']
})
export class FormCheckComponent {

    @Input() choices: string[] = [];

    @Input() editable = false;
    @Input() loading = false;

    @Output() aEditText = new EventEmitter<number>();
    @Output() aRandomize = new EventEmitter<number>();
    @Output() aDelete = new EventEmitter<number>();
    @Output() aAdd = new EventEmitter<void>();

    constructor() { }

}
