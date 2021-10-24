import { ChangeDetectorRef, Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, TemplateRef, ViewChild } from '@angular/core';
import { DialogService } from 'src/app/core/services/dialog.service';
import { HelperService } from 'src/app/core/services/helperService.service';
import { Question } from '../../model/question.model';

const rarityValues = [1 * (10 ** 3), 1 * (10 ** 6), 1 * (10 ** 9), 1 * (10 ** 12), 1 * (10 ** 15), 1 * (10 ** 18)];
const rarities = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary', 'Galactic'];
const rarityColors = ['white', 'forestgreen', 'dodgerblue', 'blueviolet', 'orange', 'aqua'];

@Component({
    selector: 'app-form-question',
    templateUrl: './form-question.component.html',
    styleUrls: ['./form-question.component.scss']
})
export class FormQuestionComponent implements OnInit, OnChanges {

    @ViewChild('formDefault', { static: true }) formDefault!: TemplateRef<any>;
    @ViewChild('formEmpty', {static: true}) formEmpty!: TemplateRef<any>;

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
    @Input() questionNumber = '0';

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
    @Output() aOrder = new EventEmitter<{previousIndex: number, currentIndex: number}>();
    @Output() aFormatEdit = new EventEmitter<void>();

    @Output() aUpdate = new EventEmitter<(string | number | null)[] | null>();

    // Only stored for editable questions
    tempAnswers: (string | number | null)[] = [];
    showFormatted = false;

    currentAnswerType = '';
    dirty = false;
    clearVar = 0; // Increment this to clear answers from question form;

    rarityText = '';
    rarityColor = '';

    constructor(
        private dialogService: DialogService,
        private cd: ChangeDetectorRef
    ) { }

    ngOnInit(): void {
        this.currentAnswerType = this.question.answerType;
        this.showFormatted = this.editable;
        this.getRarity();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes.question) {
            this.clearAnswer();
            this.getRarity();
        }
    }

    getAnswerTemplate(): TemplateRef<any> {
        if (this.currentAnswerType !== this.question.answerType) {
            this.currentAnswerType = this.question.answerType;
            this.clearAnswer();
        }
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

    public clearAnswer(): void {
        this.aUpdate.emit(null);
        this.clearVar++;
        this.tempAnswers = [];
        this.cd.detectChanges();
        this.dirty = false;
        this.showFormatted = false;
    }

    answerUpdate($event: (string | number | null)[] | null): void {
        this.dirty = true;
        if (this.editable || this.basicEdit) {
            this.tempAnswers = $event ?? [];
        }
        this.aUpdate.emit($event);
    }

    disableAnswerRandom(): boolean {
        return this.question.choices.length === 1 && this.question.choices[0] === 'Answer';
    }

    answerKeyChange(newKey: string): void {
        this.question.answerKey = newKey;
        this.qRandomizeAnswers.emit();
    }

    answerKeyString(key: string): string {
        return HelperService.answerKeyToString(key);
    }

    questionFeedback(type: string): void {
        this.dialogService.feedbackQuestion(this.question, type);
    }

    buttonsHelp(): void {
        this.dialogService.helpButtons();
    }

    formatAnswer(): string {
        return HelperService.formatAnswer(this.question, this.tempAnswers);
    }

    getRarity(): void {
        for (let i = 0; i < rarityValues.length; i++) {
            if (this.question.qChance < rarityValues[i]) {
                this.rarityText = rarities[i];
                this.rarityColor = rarityColors[i];
                return;
            }
        }
        this.rarityText = 'Universal';
        this.rarityColor = 'gray';
    }

    clickRarity(): void {
        this.dialogService.alert(
            `This specific question had a 1 in ${this.question.qChance.toLocaleString('en-US')} chance of occuring!<br><br><p>Rarities Are:</p><ol>${rarities.map(x => `<li>${x}</li>`).join('')}</ol>`,
            this.rarityText + ' Question'
        );
    }

    getBorderStyle(): any {
        if (this.question.qChance > 1 && this.basicEdit) {
            return {border: 'solid 2px ' + this.rarityColor};
        }
        return {};
    }

}
