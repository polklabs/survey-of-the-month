import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
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

    timer = 0;
    timerStop = 1000;
    progress = 0;

    constructor(private dataService: DataService) { }

    ngOnInit(): void {
        const [result, progress] = this.dataService.getData('home');
        result.subscribe((data: { title: string, subtitle: string, text: string }) => {
            this.title = data.title;
            this.subtitle = data.subtitle;
            this.text = data.text;
        });
        this.timerStop = (Math.random()*10000)+5000;
        this.startTimer();
    }

    updateSubtitle() {
        const [result, progress] = this.dataService.getData('single?id=home_page_subtitle');
        result.subscribe((data: { title: string, subtitle: string, text: string }) => {
            this.subtitle = data.text;            
        });
    }

    startTimer(): void {
        this.timer += 150;

        if (this.timer >= this.timerStop) {
            this.updateSubtitle();
            this.timerStop = (Math.random()*10000)+5000;
            this.timer = 0;
        }

        this.progress = (this.timer / this.timerStop)*100;

        setTimeout(()=>this.startTimer(), 150);
    }

}
