import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { Component, Input, OnInit } from '@angular/core';

@Component({
    selector: 'app-form-rank',
    templateUrl: './form-rank.component.html',
    styleUrls: ['./form-rank.component.scss']
})
export class FormRankComponent implements OnInit {

    @Input() choices: string[] = [];

    constructor() { }

    ngOnInit(): void {
    }

    drop(event: CdkDragDrop<string[]>) {
        moveItemInArray(this.choices, event.previousIndex, event.currentIndex);
    }

}
