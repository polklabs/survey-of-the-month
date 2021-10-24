import { AnswerType, Question } from 'src/app/shared/model/question.model';
import { SurveyContainer } from 'src/app/shared/model/survey-container.model';

export class HelperService {

    public static answerKeyToString(key: string): string {
        let phrase = key.replace(/([a-z0-9])([A-Z])/gm, '$1 $2').trim();
        phrase = phrase.replace(/\_/gm, ' ').trim();
        const words = phrase.split(' ').filter(x => x.length > 0);
        return words.map(w => w[0].toUpperCase() + w.substr(1)).join(' ');
    }

    public static getAnswerTypeTextByIndex(surveyContainer: SurveyContainer, index: number): string {
        return this.getAnswerTypeText(surveyContainer.survey.questions[index].answerType);
    }

    public static getAnswerTypeText(answerType: AnswerType): string {
        switch (answerType) {
            case 'multi':
                return 'Multiple Choice';
            case 'text':
                return 'Free Answer';
            case 'check':
                return 'Check Boxes';
            case 'rank':
                return 'Rank the Following';
            case 'date':
                return 'Date Picker';
            case 'time':
                return 'Time Picker';
            case 'scale':
                return 'Rate the Following';
            default:
                return '';
        }
    }

    public static tagToString(tag: string): string {
        let value = tag.split('_').pop();
        if (!value) { return '{Unknown}'; }
        value = value.replace(/([a-z0-9])([A-Z])/gm, '$1 $2').trim();
        value = value.substr(0, 1).toUpperCase() + value.substr(1);
        return value;
    }

    public static formatAnswer(q: Question, answer: (null | string | number)[], username: string): string {
        const formattedAnswers = this.answerToString(q, answer, false);
        let format = q.answerFormat.replace(new RegExp(/{(?<num>[0-9]+)}/gm), (...match: string[]) => {
            const groups = match.pop();
            // tslint:disable-next-line: no-string-literal
            const num = +(groups?.['num'] ?? '0');

            let replacement = '___';
            if (!isNaN(num)) {
                if (formattedAnswers.length  > num && formattedAnswers[num]) {
                    replacement = formattedAnswers[num];
                }
            }
            return replacement;
        });

        format = format.replace(/{person}/gm, username);

        return format;
    }

    public static answerToString(q: Question, answer: (null | string | number)[], filterDown = true): string[] {
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
                return answer.map(x => x?.toString() ?? '').filter(x => filterDown ? x : true);
            case 'time':
                return answer.map(x => x?.toString() ?? '').filter(x => filterDown ? x : true);
            case 'scale':
                return answer.map((a3, i) => (a3 !== null) ? `${q.choices[i]}: ${q.scaleValues[a3]}` : '')
                    .filter(x => filterDown ? x : true);
            default:
                return [];
        }
    }

}
