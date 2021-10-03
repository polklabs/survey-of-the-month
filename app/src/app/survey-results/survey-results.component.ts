import { animate, state, style, transition, trigger } from '@angular/animations';
import { Component, HostListener, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DataService } from '../core/services/data.service';
import { DialogService } from '../core/services/dialog.service';
import { APIData } from '../shared/model/api-data.model';
import { Question } from '../shared/model/question.model';
import { SurveyContainer } from '../shared/model/survey-container.model';

type Slide = {
    itemType: 'text' | 'answer' | 'question',
    text: string,
    name?: string,
    nameVisible?: boolean,
    visible: boolean,
    alwaysVisible: boolean,
}[];

@Component({
    selector: 'app-survey-results',
    templateUrl: './survey-results.component.html',
    styleUrls: ['./survey-results.component.scss'],
    animations: [
        trigger('slideDownInOut', [
            transition(':enter', [
                style({ transform: 'translateY(-300%)', opacity: 0 }),
                animate('400ms ease-in', style({ transform: 'translateY(0%)', opacity: 1 }))
            ]),
            transition(':leave', [
                animate('200ms ease-in', style({ transform: 'translateY(-300%)', opacity: 0 }))
            ])
        ]),
        trigger('slideUpInOut', [
            transition(':enter', [
                style({ transform: 'translateY(300%)', opacity: 0 }),
                animate('400ms ease-in', style({ transform: 'translateY(0%)', opacity: 1 }))
            ]),
            transition(':leave', [
                animate('200ms ease-in', style({ transform: 'translateY(300%)', opacity: 0 }))
            ])
        ]),
        trigger('slideRightInOut', [
            transition(':enter', [
                style({ transform: 'translateX(-200%)', opacity: 0 }),
                animate('400ms ease-in', style({ transform: 'translateX(0%)', opacity: 1 }))
            ]),
            transition(':leave', [
                animate('200ms ease-in', style({ transform: 'translateX(-200%)', opacity: 0 }))
            ])
        ]),
        trigger('slideLeftInOut', [
            transition(':enter', [
                style({ transform: 'translateX(200%)', opacity: 0 }),
                animate('400ms ease-in', style({ transform: 'translateX(0%)', opacity: 1 }))
            ]),
            transition(':leave', [
                animate('200ms ease-in', style({ transform: 'translateX(200%)', opacity: 0 }))
            ])
        ]),
        trigger('fadeInOut', [
            transition(':enter', [
                style({ opacity: 0 }),
                animate('200ms ease-in', style({ opacity: 1 }))
            ]),
            transition(':leave', [
                animate('200ms ease-in', style({ opacity: 0 }))
            ])
        ])
    ]
})
export class SurveyResultsComponent implements OnInit {

    @ViewChild('emptyForm', { static: true }) emptyForm!: TemplateRef<any>;
    @ViewChild('textForm', { static: true }) textForm!: TemplateRef<any>;
    @ViewChild('answerForm', { static: true }) answerForm!: TemplateRef<any>;
    @ViewChild('questionForm', { static: true }) questionForm!: TemplateRef<any>;

    id = '';
    key = '';
    surveyContainer!: SurveyContainer;

    slideNum = -1;
    slideCount = 0;

    slide: Slide = [];

    constructor(
        private dataService: DataService,
        private dialogService: DialogService,
        private router: Router,
        private activatedRoute: ActivatedRoute
    ) { }

    @HostListener('window:keyup', ['$event'])
    keyEvent(event: KeyboardEvent): void {
        if (event.key === ' ' || event.key === 'ArrowRight') {
            this.next();
        }

        if (event.key === 'ArrowLeft') {
            this.prev();
        }
    }

    ngOnInit(): void {
        this.activatedRoute.paramMap.subscribe(params => {
            this.id = params.get('id') ?? '';
            this.key = params.get('key') ?? '';
            if (this.id && this.key) {
                this.getSurvey();
            } else {
                this.router.navigateByUrl('/home');
            }
        });
    }

    next(): void {
        for (const item of this.slide.filter(x => !x.alwaysVisible)) {
            if (!item.visible) {
                item.visible = true;
                return;
            }
        }

        if (this.slideNum === this.slideCount - 2) { return; }

        this.slideNum++;
        this.loadSlide();
    }

    prev(): void {
        const data: Slide = Object.assign([], this.slide).reverse();
        for (const item of data.filter(x => !x.alwaysVisible)) {
            if (item.visible) {
                item.visible = false;
                if (data.filter(x => x.visible).length === 0) {
                    this.prev();
                }
                return;
            }
        }

        if (this.slideNum === -1) { return; }

        this.slideNum--;
        this.loadSlide();

        this.slide.forEach(s => {
            s.visible = true;
        });
    }

    loadSlide(): void {
        this.slide = [];
        if (this.slideNum === -1) {
            this.slide.push({ itemType: 'text', text: `<h2>Welcome to the survey results!</h2>`, visible: false, alwaysVisible: false });
            this.slide.push({ itemType: 'text', text: `<h2>Let's meet the contenders</h2>`, visible: false, alwaysVisible: false });
            this.slide.push({ itemType: 'text', text: `<ul><li>${this.surveyContainer.survey.users.map(x => x.name).join('</li><li>')}</li></ul>`, visible: false, alwaysVisible: false });
            this.postLoadSlide();
            return;
        }
        if (this.slideNum + 2 === this.slideCount) {
            this.slide.push({ itemType: 'text', text: `<h2>The End!</h2>`, visible: true, alwaysVisible: true });
            this.postLoadSlide();
            return;
        }

        const question = this.surveyContainer.survey.questions[this.slideNum];

        this.slide.push({ itemType: 'question', text: question.text, visible: false, alwaysVisible: false });
        this.shuffle(this.surveyContainer.answers);
        this.surveyContainer.answers.forEach(answ => {
            const user = this.surveyContainer.survey.users.find(x => x._id === answ.userId);
            if (user) {
                const qAnsw = answ.answers.find(x => x.questionId === question.questionId);
                if (qAnsw) {
                    this.slide.push({ itemType: 'answer', text: this.answerToString(question, qAnsw.value), name: user.name, nameVisible: false, visible: false, alwaysVisible: false });
                }
            }
        });
        this.postLoadSlide();
    }

    postLoadSlide(): void {
        setTimeout(() => {
            if (this.slide.length > 0) {
                this.slide[0].visible = true;
            }
        }, 250);
    }

    getSurvey(): void {
        const [result, _] = this.dataService.getData(`survey-edit?id=${this.id}&key=${this.key}`);
        result.subscribe((data: APIData) => {
            if (data.ok) {
                if (data.data) {
                    this.surveyContainer = data.data;
                    if (!this.surveyContainer) {
                        this.dialogService.alert('Survey is undefined', 'Error').subscribe(
                            () => this.router.navigateByUrl('/home')
                        );
                        return;
                    }

                    this.slideCount = this.surveyContainer.survey.questions.length + 2;
                    this.loadSlide();
                }
            } else {
                this.dialogService.error(data.error).subscribe(
                    () => this.router.navigateByUrl('/home')
                );
            }
        });
    }

    getTemplate(type: string): TemplateRef<any> {
        return this[type + 'Form'];
    }

    toggleVisible(index: number): void {
        if (this.slide[index].nameVisible) {
            this.slide[index].nameVisible = false;
        } else {
            this.slide[index].nameVisible = true;
        }
    }

    shuffle(array: any[]): any[] {
        let currentIndex = array.length;
        let randomIndex;
        // While there remain elements to shuffle...
        while (currentIndex !== 0) {

            // Pick a remaining element...
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex--;

            // And swap it with the current element.
            [array[currentIndex], array[randomIndex]] = [
                array[randomIndex], array[currentIndex]];
        }

        return array;
    }

    private answerToString(q: Question, answer: (null | string | number)[]): string {
        switch (q.answerType) {
            case 'multi':
                const a = answer[0];
                if (a === null) { return ''; }
                if (typeof a === 'string') {
                    return `<u>${a}</u>`;
                }
                return q.choices[a];
            case 'text':
                return answer.join('<br>');
            case 'check':
                return q.choices.map((x, index) => answer[index] === 'true' ? x : '').filter(x => x).join('<br>');
            case 'rank':
                const a2: number[] = answer as number[];
                return `<ol><li>${a2.map((x: number) => q.choices[x]).join('</li><li>')}</li></ol>`;
            case 'date':
                return answer.join('<br>');
            case 'time':
                return answer.join('<br>');
            case 'scale':
                return answer.map((a3, i) => (a3 !== null) ? `${q.choices[i]}:${q.scaleValues[a3]}` : '').join('<br>');
        }
    }

}
