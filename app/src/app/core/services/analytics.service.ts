import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { APIData } from 'src/app/shared/model/api-data.model';
import { Stats } from 'src/app/shared/model/stats.model';
import { DataService } from './data.service';

@Injectable({
    providedIn: 'root'
})
export class AnalyticsService {

    stats?: Stats;
    stats$ = new BehaviorSubject<Stats | undefined>(undefined);

    constructor(private dataService: DataService) {
        this.getStats();
        setInterval(() => {
            this.getStats();
        }, 10000);
    }

    getStats(): void {
        const [result, _] = this.dataService.getData('stats');
        result.subscribe((data: APIData) => {
            if (data.ok) {
                if (!data.data) { throw Error('Data is null'); }
                this.stats = data.data;
                this.stats$.next(this.stats);
            }
        });
    }

    updateStats(unique: boolean): void {
        const [result, _] = this.dataService.getData(`visitor?unique=${unique}`);
        result.subscribe((data: APIData) => {
            if (data.ok) {
                if (!data.data) { throw Error('Data is null'); }
                this.stats = data.data;
                this.stats$.next(this.stats);
            }
        });
    }

}
