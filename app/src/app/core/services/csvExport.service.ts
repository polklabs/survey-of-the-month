import { Injectable } from '@angular/core';
import { Question } from 'src/app/shared/model/question.model';
import { SurveyContainer } from 'src/app/shared/model/survey-container.model';

@Injectable({
    providedIn: 'root'
})
export class CsvExportService {

    export(container: SurveyContainer): string {

        const contentsArray: string[] = [];
        contentsArray.push(this.generateHeader(container));

        container.survey.users.sort((a, b) => a.name.localeCompare(b.name));
        container.survey.users.forEach(u => {
            contentsArray.push(this.generateRow(container, u));
        });

        const fileContents = contentsArray.join('\n');

        const filetype = 'text/csv;charset=utf-8;';
        const data = new Blob([fileContents], {type: filetype});
        const textFile = window.URL.createObjectURL(data);
        return textFile;
    }

    exportName(container: SurveyContainer): string {
        return `survey_${container.survey.name.replace(/[^\x00-\x7F]/g, '')}.csv`;
    }

    private generateHeader(container: SurveyContainer): string {
        const toReturn: string[] = ['name'];

        container.survey.questions.forEach((_, index) => {
            toReturn.push(`Question ${index + 1}`);
        });

        return toReturn.join(',');
    }

    private generateRow(container: SurveyContainer, user: { name: string, _id: string }): string {
        const toReturn: string[] = [user.name];
        const answers = container.answers.find(x => x.userId === user._id);

        container.survey.questions.forEach(q => {
            const a = answers?.answers.find(x => x.questionId === q.questionId);
            if (a) {
                toReturn.push(this.answerToString(q, a.value));
            } else {
                toReturn.push('');
            }
        });

        return toReturn.map(x => JSON.stringify(x)).join(',');
    }

    private answerToString(q: Question, answer: (null | string | number)[]): string {
        switch (q.answerType) {
            case 'multi':
                const a = answer[0];
                if (a === null) { return ''; }
                if (typeof a === 'string') {
                    return a.toString();
                }
                return q.choices[a];
            case 'text':
                return answer.join(',');
            case 'check':
                return q.choices.map((x, index) => answer[index] === 'true' ? x : '').filter(x => x).join(',');
            case 'rank':
                const a2: number[] = answer as number[];
                return a2.map((x: number) => q.choices[x]).join(',');
            case 'date':
                return answer.join(',');
            case 'time':
                return answer.join(',');
            case 'scale':
                return answer.map((a3, i) => a3 ? `${q.choices[i]}:${q.scaleValues[a3]}` : '').join(',');
            default:
                return '';
        }
    }
}
