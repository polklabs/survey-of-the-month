import { Injectable } from "@angular/core";
import { SurveyContainer } from "src/app/shared/model/survey-container.model";

@Injectable({
    providedIn: 'root'
})
export class CsvExportService {

    export(container: SurveyContainer): string {

        let fileContents = "";

        fileContents += 'name,\n';
        
        container.survey.users.sort((a,b) => a.name.localeCompare(b.name));
        container.survey.users.forEach((u, index) => {
            const answer = container.answers.find(x => x.userId === u._id);
            fileContents += `${u.name},\n`;
        });

        const filetype = 'text/csv;charset=utf-8;';
        const data = new Blob([fileContents], {type: filetype});
        const textFile = window.URL.createObjectURL(data);
        return textFile;
    }

    exportName(container: SurveyContainer): string {
        return `survey_${container.survey.name.replace(/[^\x00-\x7F]/g, "")}.csv`;
    }

}