import { Injectable } from '@angular/core';
import {TranslateService} from "@ngx-translate/core";
import { BehaviorSubject, from, Observable } from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class LanguageService {

  lg = this.translateService.currentLang;
  private language$ = new BehaviorSubject(localStorage['language'] || 'ru');

  languages = [
    {
      code: 'ru',
      language: 'LANGUAGES.RU'
    },
    {
      code: 'kz',
      language: 'LANGUAGES.KZ'
    }
  ]

  languagesOptions = {
    header: this.translateService.instant('ACCOUNT.LANGUAGES'),
    subHeader: this.translateService.instant('ACCOUNT.SELECT_LANG'),
    options: this.languages
  };

  constructor(private translateService: TranslateService) {
    this.translateService.use(this.language$.value)
  }

  onChangeLanguage(lang: string) {
    this.translateService.use(lang);
    this.lg = lang;
    this.language$.next(lang);
    localStorage.setItem('language', lang);
  }

  getCurrentLanguage() {
    return this.translateService.currentLang;
  }

  getCurrentLanguageAsObservable(): Observable<string> {
    return this.language$.asObservable();
  }
}
