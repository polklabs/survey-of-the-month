import { animate, keyframes, query, stagger, state, style, transition, trigger } from '@angular/animations';
import { Component, HostListener, OnInit, TemplateRef, ViewChild, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DataService } from '../core/services/data.service';
import { DialogService } from '../core/services/dialog.service';
import { HelperService } from '../core/services/helperService.service';
import { APIData } from '../shared/model/api-data.model';
import { AnswerType, Question } from '../shared/model/question.model';
import { SurveyContainer } from '../shared/model/survey-container.model';

// type Slide = {
//     itemType: 'basicText' | AnswerType | 'question',
//     text: string[],
//     name?: string,
//     nameVisible?: boolean,
//     visible: boolean,
//     alwaysVisible: boolean,
// }[];

class Slide {
    itemType: 'basicText' | AnswerType | 'question' = 'basicText';
    labels: string[] = [];
    text: string[] = [];
    name?: string;
    nameVisible = false;
    visible = false;
    alwaysVisible = false;

    constructor(cfg?: Partial<Slide>) {
        Object.assign(this, cfg);
    }
}

const enterTime = '400ms';
const leaveTime = '200ms';

@Component({
    selector: 'app-survey-results',
    templateUrl: './survey-results.component.html',
    styleUrls: ['./survey-results.component.scss'],
    encapsulation: ViewEncapsulation.None,
    animations: [
        trigger('slideDownInOut', [
            transition(':enter', [
                style({ transform: 'translateY(-300%)', opacity: 0 }),
                animate(enterTime + ' ease-in', style({ transform: 'translateY(0%)', opacity: 1 }))
            ])
        ]),
        trigger('slideUpInOut', [
            transition(':enter', [
                style({ transform: 'translateY(300%)', opacity: 0 }),
                animate(enterTime + ' ease-in', style({ transform: 'translateY(0%)', opacity: 1 }))
            ])
        ]),
        trigger('slideRightInOut', [
            transition(':enter', [
                style({ transform: 'translateX(-200%)', opacity: 0 }),
                animate(enterTime + ' ease-in', style({ transform: 'translateX(0%)', opacity: 1 }))
            ])
        ]),
        trigger('slideLeftInOut', [
            transition(':enter', [
                style({ transform: 'translateX(200%)', opacity: 0 }),
                animate(enterTime + ' ease-in', style({ transform: 'translateX(0%)', opacity: 1 }))
            ])
        ]),
        trigger('fadeInOut', [
            transition(':enter', [
                style({ opacity: 0 }),
                animate(leaveTime + ' ease-in', style({ opacity: 1 }))
            ])
        ]),
        trigger('listAnimation', [
            transition('* => *', [
                query(':enter', style({ opacity: 0}), {optional: true}),
                query(':enter', stagger(leaveTime, [
                    animate(enterTime + ' ease-in', keyframes([
                        style({opacity: 0, transform: 'translateY(-75%)', offset: 0}),
                        style({opacity: .5, transform: 'translateY(35px)',  offset: 0.3}),
                        style({opacity: 1, transform: 'translateY(0)',     offset: 1.0}),
                    ]))
                ]), {optional: true})
            ])
        ])
    ]
})
export class SurveyResultsComponent implements OnInit {

    @ViewChild('emptyForm', { static: true }) emptyForm!: TemplateRef<any>;
    @ViewChild('textForm', { static: true }) basicTextForm!: TemplateRef<any>;
    @ViewChild('questionForm', { static: true }) questionForm!: TemplateRef<any>;
    @ViewChild('answerForm', { static: true }) answerForm!: TemplateRef<any>;

    id = '';
    key = '';
    surveyContainer!: SurveyContainer;

    slideNum = -1;
    slideCount = 0;

    slide: Slide[] = [];

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
        const data: Slide[] = Object.assign([], this.slide).reverse();
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
            this.shuffle(this.surveyContainer.survey.users);
            if (this.surveyContainer.survey.resultsIntro) {
                this.slide.push(new Slide({ text: [this.surveyContainer.survey.resultsIntro] }));
            }
            if (this.surveyContainer.survey.resultsPeople) {
                this.slide.push(new Slide({ text: [this.surveyContainer.survey.resultsPeople] }));
            }
            this.slide.push(new Slide({ text: this.surveyContainer.survey.users.map(x => `<p class="center">${x.name}</p>`) }));
            this.postLoadSlide();
            return;
        }
        if (this.slideNum + 2 === this.slideCount) {
            if (this.surveyContainer.survey.resultsEnd) {
                this.slide.push(new Slide({ text: [this.surveyContainer.survey.resultsEnd], visible: true, alwaysVisible: true }));
            }
            this.postLoadSlide();
            return;
        }

        const question = this.surveyContainer.survey.questions[this.slideNum];

        this.slide.push(new Slide({ text: [`<h2 class="center">Question ${this.slideNum + 1}</h2>`], visible: true, alwaysVisible: true }));
        this.slide.push(new Slide({ itemType: 'question', text: [question.text] }));
        this.shuffle(this.surveyContainer.answers);
        this.surveyContainer.answers.forEach(answ => {
            const user = this.surveyContainer.survey.users.find(x => x._id === answ.userId);
            if (user) {
                const qAnsw = answ.answers.find(x => x.questionId === question.questionId);
                if (qAnsw) {
                    this.slide.push(new Slide({
                        itemType: question.answerType,
                        labels: this.choicesToString(question),
                        text: this.answerToString(question, qAnsw.value),
                        name: user.name
                    }));
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
        const form = this[type + 'Form'];
        if (form === undefined) { return this.answerForm; }
        return form;
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

    getAnswerTypeText(index: number): string {
        return HelperService.getAnswerTypeTextByIndex(this.surveyContainer, index);
    }

    private answerToString(q: Question, answer: (null | string | number)[]): string[] {
        switch (q.answerType) {
            case 'multi':
                const a = answer[0];
                if (a === null) { return ['']; }
                if (typeof a === 'string') {
                    return [`<u>${a}</u>`];
                }
                return [q.choices[a]];
            case 'text':
                return answer.map(x => x?.toString() ?? '');
            case 'check':
                return q.choices.map((x, index) => answer[index] === 'true' ? x : '').filter(x => x);
            case 'rank':
                const a2: number[] = answer as number[];
                return a2.map((x: number) => q.choices[x]);
            case 'date':
                return answer.map(x => x?.toString() ?? '').filter(x => x);
            case 'time':
                return answer.map(x => x?.toString() ?? '').filter(x => x);
            case 'scale':
                return answer.map((a3, i) => (a3 !== null) ? `${q.choices[i]}: ${q.scaleValues[a3]}` : '').filter(x => x);
        }
    }

    private choicesToString(q: Question): string[] {
        switch (q.answerType) {
            case 'multi':
            case 'check':
            case 'scale':
                return [];
            case 'rank':
                return q.choices.map((x, i) => (i + 1).toString() + ': ');
            default:
                if (q.choices.length === 1 && q.choices[0] === 'Answer') {
                    return [];
                }
                return q.choices.map(x => x + ': ');
        }
    }

    public getChoiceText(label: string[], index: number): string {
        if (index >= label.length) { return ''; }
        return label[index];
    }

}
