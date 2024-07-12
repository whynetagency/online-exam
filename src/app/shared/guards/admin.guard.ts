import {CanActivateFn, Router} from '@angular/router';
import {inject} from "@angular/core";
import {UserService} from "../services/user.service";
import {getAuth, onAuthStateChanged} from "firebase/auth";
import {doc, getDoc} from "@angular/fire/firestore";
import {IUser} from "../models/user.model";

export const adminGuard: CanActivateFn = () => {
  const router: Router = inject(Router);
  const userService: UserService = inject(UserService);

  return new Promise((resolve, reject) => {
    const auth = getAuth();
    onAuthStateChanged(auth, (user) => {
      if (user) {
        const userDoc = doc(userService.usersCollection, user.uid);
        getDoc(userDoc).then(userData => {
          if ((userData.data() as IUser).isAdmin) {
            resolve(true);
          } else {
            router.navigateByUrl('/home', {replaceUrl: true}).then();
            reject(false);
          }
        })
      } else {
        router.navigateByUrl('/home', {replaceUrl: true}).then();
        reject(false);
      }
    });
  });
};
