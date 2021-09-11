import { Component, EventEmitter, Input, OnInit, Output, TemplateRef, ViewChild } from '@angular/core';
import { AnswerType, Question } from '../../model/question.model';

@Component({
    selector: 'app-form-question',
    templateUrl: './form-question.component.html',
    styleUrls: ['./form-question.component.scss']
})
export class FormQuestionComponent implements OnInit {

    @ViewChild('formDefault', { static: true }) formDefault!: TemplateRef<any>;
    @ViewChild('formText', { static: true }) formText!: TemplateRef<any>;
    @ViewChild('formMulti', { static: true }) formMulti!: TemplateRef<any>;
    @ViewChild('formCheck', { static: true }) formCheck!: TemplateRef<any>;
    @ViewChild('formRank', { static: true }) formRank!: TemplateRef<any>;
    @ViewChild('formDate', { static: true }) formDate!: TemplateRef<any>;
    @ViewChild('formTime', { static: true }) formTime!: TemplateRef<any>;
    @ViewChild('formScale', { static: true }) formScale!: TemplateRef<any>;


    @Input() question: Question = new Question();
    @Input() loading = false;
    @Input() editable = false; // For the survey creator
    @Input() basicEdit = false; // For the homepage
    @Input() questionNumber?: string;

    @Output() qReset = new EventEmitter<void>();
    @Output() qDelete = new EventEmitter<void>();
    @Output() qEditText = new EventEmitter<void>();
    @Output() qEditType = new EventEmitter<AnswerType>();
    @Output() qRandomize = new EventEmitter<void>();
    @Output() qRandomizeAnswers = new EventEmitter<void>();
    @Output() qSeed = new EventEmitter<void>();
    @Output() qShuffle = new EventEmitter<void>();

    @Output() aAdd = new EventEmitter<void>();
    @Output() aDelete = new EventEmitter<number>();
    @Output() aRandomize = new EventEmitter<number>();
    @Output() aEditText = new EventEmitter<number>();
    @Output() aOtherOptionAllow = new EventEmitter<void>();
    @Output() aEditScale = new EventEmitter<void>();

    constructor() { }

    ngOnInit(): void {
    }

    getAnswerTemplate(): TemplateRef<any> {
        switch (this.question.answerType) {
            case 'text':
                return this.formText;
            case 'multi':
                return this.formMulti;
            case 'rank':
                return this.formRank;
            case 'date':
                return this.formDate;
            case 'check':
                return this.formCheck;
            case 'time':
                return this.formTime;
            case 'scale':
                return this.formScale;
            default:
                return this.formDefault;
        }
    }

}
