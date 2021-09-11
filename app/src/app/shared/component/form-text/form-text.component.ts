import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
    selector: 'app-form-text',
    templateUrl: './form-text.component.html',
    styleUrls: ['./form-text.component.scss']
})
export class FormTextComponent {

    @Input() choices: string[] = [];

    @Input() editable = false;
    @Input() loading = false;

    @Output() aEditText = new EventEmitter<number>();
    @Output() aRandomize = new EventEmitter<number>();
    @Output() aDelete = new EventEmitter<number>();
    @Output() aAdd = new EventEmitter<void>();

    constructor() { }

}
