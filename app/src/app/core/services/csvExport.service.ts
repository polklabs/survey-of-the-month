import { Injectable } from '@angular/core';
import { SurveyContainer } from 'src/app/shared/model/survey-container.model';
import { HelperService } from './helperService.service';

@Injectable({
    providedIn: 'root'
})
export class CsvExportService {

    export(container: SurveyContainer, showUsers = true, includeQIds: string[] = []): string {

        const contentsArray: string[] = [];
        contentsArray.push(this.generateHeader(container, includeQIds));

        if (showUsers) {
            container.survey.users.sort((a, b) => a.name.localeCompare(b.name));
        } else {
            HelperService.SHUFFLE(container.survey.users);
        }
        container.survey.users.forEach(u => {
            contentsArray.push(this.generateRow(container, u, showUsers, includeQIds));
        });

        const fileContents = contentsArray.join('\n');

        const filetype = 'text/csv;charset=utf-8;';
        const data = new Blob([fileContents], { type: filetype });
        const textFile = window.URL.createObjectURL(data);
        return textFile;
    }

    exportName(container: SurveyContainer): string {
        return `survey_${container.survey.name.replace(/[^\x00-\x7F]/g, '')}.csv`;
    }

    private generateHeader(container: SurveyContainer, includeQIds: string[]): string {
        const toReturn: string[] = ['name'];

        container.survey.questions.forEach((q, index) => {
            if (!includeQIds.includes(q.questionId)) {
                return;
            }
            toReturn.push(`Question ${index + 1}`);
        });

        return toReturn.join(',');
    }

    private generateRow(container: SurveyContainer, user: { name: string, _id: string },
                        showUsers: boolean, includeQIds: string[]): string {
        const toReturn: string[] = showUsers ? [user.name] : ['Unknown'];
        const answers = container.answers.find(x => x.userId === user._id);

        container.survey.questions.forEach(q => {
            if (!includeQIds.includes(q.questionId)) {
                return;
            }
            let a = answers?.answers.find(x => x.questionId === q.questionId)?.value;
            if (q.answerType === 'rank') {
                a ??= q.choices.map((x, i) => i);
            }
            if (a) {
                toReturn.push(HelperService.answerToString(q, a).join(','));
            } else {
                toReturn.push('');
            }
        });

        return toReturn.map(x => JSON.stringify(x)).join(',');
    }
}
