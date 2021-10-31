import { Injectable } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { environment } from 'src/environments/environment';

declare var gtag: any;

@Injectable({
    providedIn: 'root'
})
export class AnalyticsService {

    constructor(
        router: Router
    ) {
        router.events.subscribe((e: any) => {
            if (e instanceof NavigationEnd) {
                if (environment.production) {
                    gtag('config', 'G-K9T7TYVBP7', {page_path: e.urlAfterRedirects});
                }
            }
        });
    }

    public triggerEvent(category: string, action: string, label = '', value = 1): void {
        if (environment.production) {
            gtag('event', 'click', {
                eventCategory: category,
                eventAction: action,
                eventLabel: label,
                eventValue: value});
        }
    }

}
