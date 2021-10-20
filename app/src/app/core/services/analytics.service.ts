import { Injectable } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';

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
                gtag('config', 'G-K9T7TYVBP7', {page_path: e.urlAfterRedirects});
            }
        });
    }

    public triggerEvent(category: string, action: string, label = '', value = 1): void {
        gtag('event', 'click', {
            eventCategory: category,
            eventAction: action,
            eventLabel: label,
            eventValue: value});
    }

}
