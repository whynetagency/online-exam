import { Component } from '@angular/core';
import {TranslateModule} from "@ngx-translate/core";
import {LanguageService} from "../../../shared/services/language.service";
import {AsyncPipe, NgClass} from "@angular/common";
import {Router, RouterLink} from "@angular/router";
import {UserService} from "../../../shared/services/user.service";

@Component({
  selector: 'app-header',
  standalone: true,
    imports: [
        TranslateModule,
        NgClass,
        AsyncPipe,
        RouterLink
    ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {
  activeLanguage = ''

  constructor(
      private languageService: LanguageService,
      protected router: Router,
      protected userService: UserService
  ) {
    this.activeLanguage = this.languageService.getCurrentLanguage();
  }

  onChangeLanguage(language: string): void {
    this.languageService.onChangeLanguage(language);
    this.activeLanguage = language;
  }
}
