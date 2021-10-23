import { Injectable } from '@angular/core';
import { Question } from 'src/app/shared/model/question.model';
import { SurveyContainer } from 'src/app/shared/model/survey-container.model';
import { HelperService } from './helperService.service';

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
                toReturn.push(HelperService.answerToString(q, a.value).join(','));
            } else {
                toReturn.push('');
            }
        });

        return toReturn.map(x => JSON.stringify(x)).join(',');
    }
}
