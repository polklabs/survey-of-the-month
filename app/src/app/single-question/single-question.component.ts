import { Component, OnInit } from '@angular/core';
import { DataService } from '../core/services/data.service';

@Component({
    selector: 'app-single-question',
    templateUrl: './single-question.component.html',
    styleUrls: ['./single-question.component.scss']
})
export class SingleQuestionComponent implements OnInit {

    question = '';
    answer: { answers: string[], answerKey: string, answerType: string, answerCount: number } = { answers: [], answerKey: '', answerType: 'text', answerCount: 0 };

    constructor(private dataService: DataService) { }

    ngOnInit(): void {
        this.getQuestion();
    }

    getQuestion(): void {
        this.dataService.getQuestion().subscribe(result => {
            console.log(result);
            this.question = result['question'];
            this.answer = result['answer'];
        });
    }

}
