import { Component, Input, OnInit } from '@angular/core';

@Component({
    selector: 'app-form-text',
    templateUrl: './form-text.component.html',
    styleUrls: ['./form-text.component.scss']
})
export class FormTextComponent implements OnInit {

    @Input() choices: string[] = [];

    constructor() { }

    ngOnInit(): void {
    }

}
