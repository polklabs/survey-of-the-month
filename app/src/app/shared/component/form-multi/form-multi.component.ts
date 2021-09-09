import { Component, Input, OnInit } from '@angular/core';

@Component({
    selector: 'app-form-multi',
    templateUrl: './form-multi.component.html',
    styleUrls: ['./form-multi.component.scss']
})
export class FormMultiComponent implements OnInit {

    @Input() choices: string[] = [];
    @Input() allowOther: boolean = true;

    constructor() { }

    ngOnInit(): void {
    }

}
