import { Injectable } from '@angular/core';
import {getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged} from "firebase/auth";
import {ISignInData, ISignUpData, IUser} from "../models/user.model";
import {BehaviorSubject, first, take} from "rxjs";
import {collection, doc, Firestore, getDoc, setDoc, updateDoc} from "@angular/fire/firestore";
import {createUserWithEmailAndPassword} from "@angular/fire/auth";
import dayjs from "dayjs";
import {LoaderService} from "./loader.service";

@Injectable({
  providedIn: 'root'
})
export class UserService {

  auth = getAuth();
  user$: BehaviorSubject<IUser | null> = new BehaviorSubject<IUser | null>(null);

  usersCollection = collection(this.fs, 'users');

  constructor(private fs: Firestore) {
    onAuthStateChanged(this.auth, (user) => {
      if (user) {
        this.getUserData();
      }
    })
  }

  async signIn(data: ISignInData) {
    try {
      return signInWithEmailAndPassword(this.auth, data.email, data.password);
    } catch (error) {
      console.error('Error sign in:', error);
      throw error;
    }
  }

  getUserData(user?: IUser) {
    if (user) {
      this.user$.next(user);
      return;
    }

    if (this.auth.currentUser) {
      const userDoc = doc(this.usersCollection, this.auth.currentUser?.uid);
      try {
        getDoc(userDoc).then(userData => {
          this.user$.next(userData.data() as IUser);
        })
      } catch (error) {
        console.error('Error fetching user data:', error);
        throw error;
      }
    }
  }

  async signOut() {
    try {
      return signOut(this.auth).then(() => {
        this.user$.next(null);
        location.reload();
      })
    } catch (error) {
      console.error('Error sign out:', error);
      throw error;
    }
  }

  async createUser(data: ISignUpData) {
    try {
      const authData = await createUserWithEmailAndPassword(this.auth, data.email, data.password);
      const user: IUser = {
        uid: authData.user.uid,
        email: data.email,
        name: data.name,
        createdAt: { seconds: Math.floor(new Date().getTime()) },
        balances: {
          administrativeCivilService: {
            amount: 0,
            expirationDate: null
          },
          advocacy: {
            amount: 0,
            expirationDate: null
          },
          corpA: {
            amount: 0,
            expirationDate: null
          },
          govForPeople: {
            amount: 0,
            expirationDate: null
          },
          headOfEducationalOrganization: {
            amount: 0,
            expirationDate: null
          },
          judicialCorp: {
            amount: 0,
            expirationDate: null
          },
          lawService: {
            amount: 0,
            expirationDate: null
          },
          notariat: {
            amount: 0,
            expirationDate: null
          },
          privateBailiffExam: {
            amount: 0,
            expirationDate: null
          }
        }
      }

      const userDoc = doc(this.usersCollection, user.uid);

      await setDoc(userDoc, user);

    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async updateUserData(field: string, data: any): Promise<void> {
    const usersCollection = collection(this.fs, 'users');
    const userDoc = doc(usersCollection, this.user$.getValue()?.uid);

    try {
      const updatedUserData = this.user$.getValue();
      if (updatedUserData) {
        const updatedUser: IUser = {
          ...updatedUserData,
          [field]: data
        };
        this.user$.next(updatedUser);
      }

      return await updateDoc(userDoc, field, data);
    } catch (error) {
      console.error('Error updating user data:', error);
      throw error;
    }
  }

  onCheckUserExpirationDated() {
    let presentChanges = false;
    const now = dayjs().unix();

    this.user$.pipe(first()).subscribe(user => {
      Object.keys(user!.balances).forEach(key => {
        // @ts-ignore
        if (user!.balances[key].expirationDate && (now > user!.balances[key].expirationDate.seconds)) {
          presentChanges = true;
          // @ts-ignore
          user!.balances[key].amount = 0;
          // @ts-ignore
          user!.balances[key].expirationDate = null;
        }
      })

      if (presentChanges) {
        this.updateUserData('balances', user!.balances).then(() => {
          console.log('User balances updated');
          this.getUserData();
        })
      }
    })
  }
}
