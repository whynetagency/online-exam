import {CanActivateFn, Router} from '@angular/router';
import {inject} from "@angular/core";
import {getAuth, onAuthStateChanged} from "firebase/auth";

export const authGuard: CanActivateFn = () => {
  const router: Router = inject(Router);

  return new Promise((resolve, reject) => {
    const auth = getAuth();
    onAuthStateChanged(auth, (user) => {
      if (user) {
        resolve(true);
      } else {
        router.navigateByUrl('/login', {replaceUrl: true}).then();
        reject(false);
      }
    });
  });
};
