import { Injectable } from '@angular/core';
import {BehaviorSubject} from "rxjs";
import {NavigationStart, Router} from "@angular/router";
import {UserService} from "./user.service";

@Injectable({
  providedIn: 'root'
})
export class LoaderService {
  public loading$ = new BehaviorSubject<boolean>(false);

  noLoaderUrls = ['sign-in', 'sign-up', 'password-reset', 'privacy-policy', 'offer-agreement', 'payments'];

  constructor(
      private router: Router,
      private userService: UserService
  ) {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationStart && event.navigationTrigger === 'imperative') {
        if (!this.noLoaderUrls.includes(event.url.replace('/', ''))) {
            this.loading$.next(true);
        }
      }
    });
  }
}
