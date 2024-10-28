import {ChangeDetectorRef, Component, OnInit} from '@angular/core';
import {RouterOutlet} from '@angular/router';
import {HeaderComponent} from "./components/structural/header/header.component";
import {FooterComponent} from "./components/structural/footer/footer.component";
import {LoaderComponent} from "./components/structural/loader/loader.component";
import {TranslateService} from "@ngx-translate/core";
import {environment} from "../environments/environment";
import {LoaderService} from "./shared/services/loader.service";
import {AsyncPipe} from "@angular/common";
import {DisableContextDirective} from "./shared/directives/disable-context.directive";

@Component({
    selector: 'app-root',
    standalone: true,
    imports: [RouterOutlet, HeaderComponent, FooterComponent, LoaderComponent, AsyncPipe, DisableContextDirective],
    templateUrl: './app.component.html',
    styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {

    isLoading = false;

    constructor(
        private translateService: TranslateService,
        public loaderService: LoaderService,
        private cdr: ChangeDetectorRef
    ) {
        this.setLanguage();
    }

    ngOnInit() {
        this.loaderService.loading$.subscribe((value: boolean) => {
            this.isLoading = value;
            this.cdr.detectChanges();
        })
    }

  setLanguage() {
    const lang = localStorage.getItem('language');

        this.translateService.use(lang || environment.defaultLang);
        this.translateService.setDefaultLang(lang || environment.defaultLang);
    }

}
