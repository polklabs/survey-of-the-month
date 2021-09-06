import { Component, OnInit } from '@angular/core';
import { DataService } from '../core/services/data.service';

@Component({
    selector: 'app-home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

    title = 'Survey Of The Month';
    subtitle = 'hello';
    text = 'This is a survey maker/taker/generator app';

    timeout = 10000;
    progress = 0;

    constructor(private dataService: DataService) { }

    ngOnInit(): void {
        const [result, progress] = this.dataService.getData('home');
        result.subscribe((data: { subtitle: string, text: string }) => {
            this.subtitle = data.subtitle;
            this.text = data.text;
        });

        let timer = setInterval(() => this.runTimer(), 150);
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                clearInterval(timer);
            } else {
                timer = setInterval(() => this.runTimer(), 150);
            }
        })
    }

    updateSubtitle() {
        const [result, progress] = this.dataService.getData('single?id=home_page_subtitle');
        result.subscribe((data: { text: string }) => {
            this.subtitle = data.text;
        });
    }

    runTimer(): void {
        this.timeout -= 150;

        if (this.timeout <= 0) {
            this.updateSubtitle();
            this.timeout = 10000;
        }

        this.progress = (this.timeout / 10000) * 100;
    }

}
