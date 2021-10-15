import { AnswerType } from 'src/app/shared/model/question.model';
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
        }
    }

    public static tagToString(tag: string): string {
        let value = tag.split('_').pop();
        if (!value) { return '{Unknown}'; }
        value = value.replace(/([a-z0-9])([A-Z])/gm, '$1 $2').trim();
        value = value.substr(0, 1).toUpperCase() + value.substr(1);
        return value;
    }

}
