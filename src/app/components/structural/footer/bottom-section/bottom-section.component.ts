import { Component } from '@angular/core';
import {TranslateModule, TranslateService} from "@ngx-translate/core";
import {Router, RouterLink} from "@angular/router";
import {NgClass, NgForOf} from "@angular/common";

@Component({
  selector: 'app-bottom-section',
  standalone: true,
  imports: [
    NgClass,
    RouterLink,
    TranslateModule,
    NgForOf
  ],
  templateUrl: './bottom-section.component.html',
  styleUrl: './bottom-section.component.scss'
})
export class BottomSectionComponent {
  navbarOpen = false;

  navItems = [
    {title: 'HEADER.NAV.ABOUT', link: '/home#about'},
    {title: 'HEADER.NAV.CONTACTS', link: '/contacts'},
    {title: 'HEADER.NAV.PAYMENTS', link: '/checkout'},
    {title: 'PUBLIC_OFFER_AGREEMENT.PAGE_TITLE', link: '/offer-agreement'},
    {title: 'PRIVACY_POLICY.PAGE_TITLE', link: '/privacy-policy'},
  ];

  constructor(
      private router: Router,
      private translateService: TranslateService
  ) {}

  ngOnInit(): void {}

  toggleNavbar(): void {
    this.navbarOpen = !this.navbarOpen;
  }

  isActiveLink(link: string): boolean {
    return link === this.router.url;
  }
}
