import { Injectable } from '@angular/core';
import {TranslateService} from "@ngx-translate/core";

@Injectable({
  providedIn: 'root'
})
export class LanguageService {

  lg = this.translateService.currentLang;

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

  constructor(private translateService: TranslateService) { }

  onChangeLanguage(lang: string) {
    this.translateService.use(lang);
    this.lg = lang;
  }

  getCurrentLanguage() {
    return this.translateService.currentLang;
  }
}
