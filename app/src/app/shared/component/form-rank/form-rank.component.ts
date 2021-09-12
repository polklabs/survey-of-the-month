import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
    selector: 'app-form-rank',
    templateUrl: './form-rank.component.html',
    styleUrls: ['./form-rank.component.scss']
})
export class FormRankComponent implements OnInit {

    @Input() choices: string[] = [];

    @Input() editable = false;
    @Input() loading = false;

    @Output() aEditText = new EventEmitter<number>();
    @Output() aRandomize = new EventEmitter<number>();
    @Output() aDelete = new EventEmitter<number>();
    @Output() aAdd = new EventEmitter<void>();

    @Output() aUpdate = new EventEmitter<number[]>();
    answers: string[] = [];

    constructor() { }

    ngOnInit(): void {
        console.log('Init Rank');

        if (this.editable) {
            this.answers = this.choices
        } else {
            this.choices.forEach(c => {
                this.answers.push(c);
            });
        }
    }


    drop(event: CdkDragDrop<string[]>) {
        moveItemInArray(this.choices, event.previousIndex, event.currentIndex);
        this.onChange();
    }

    onChange() {
        this.aUpdate.emit(this.choices.map(x => this.answers.indexOf(x)))
    }

}
