import {CanActivateFn, Router} from '@angular/router';
import {inject} from "@angular/core";
import {UserService} from "../services/user.service";

export const logInGuard: CanActivateFn = () => {
  const router: Router = inject(Router);
  const userService: UserService = inject(UserService);

  return new Promise((resolve, reject) => {
    userService.user$.subscribe(value => {
      if (value) {
        router.navigateByUrl('/', {replaceUrl: true}).then();
        reject(false);
      } else {
        resolve(true);
      }
    })
  })
};
