import {Injectable} from '@angular/core';
import {
  collection,
  collectionData,
  doc,
  Firestore,
  getDoc, onSnapshot,
  orderBy,
  query,
  QueryConstraint
} from "@angular/fire/firestore";
import {BehaviorSubject} from "rxjs";
import {IBlockItem, ILaw, ITest} from "../models/exam.model";
import {IUser} from "../models/user.model";

@Injectable({
  providedIn: 'root'
})
export class DatabaseService {

  blocksCollection = collection(this.fs, 'blocks');
  lawsCollection = collection(this.fs, 'laws');
  testsCollection = collection(this.fs, 'tests');
  checkoutCollection = collection(this.fs, 'checkout');
  contactsCollection = collection(this.fs, 'contacts');
  usersCollection = collection(this.fs, 'users');

  blocks: BehaviorSubject<IBlockItem[]> = new BehaviorSubject<IBlockItem[]>([]);
  users$: BehaviorSubject<IUser[]> = new BehaviorSubject<IUser[]>([]);

  constructor(private fs: Firestore) {}

  getBlocks() {
    try {
      collectionData(this.blocksCollection).subscribe(blocksData => {
        if (blocksData.length) {
          this.blocks.next(blocksData as IBlockItem[]);
        }
      })
    } catch (error) {
      console.error('Error fetching blocks data:', error);
      throw error;
    }
  }

  async getTestData(testId: string) {
    try {
      const testDocRef = doc(this.testsCollection, testId);
      const testSnapshot = await getDoc(testDocRef);

      if (testSnapshot.exists()) {
        return (testSnapshot.data() as ITest);
      } else {
        console.log(`Topic with ID ${testId} does not exist.`);
        return null;
      }
    } catch (error) {
      console.error(`Error fetching test with ID ${testId}`, error);
      throw error;
    }
  }

  async getTestsData(testIds: string[]): Promise<ITest[]> {
    try {
      const testsObservables = testIds.map(async (testId) => {
        return await this.getTestData(testId);
      });

      const testResults = await Promise.all(testsObservables);
      return testResults.filter((test) => test !== null) as ITest[];
    } catch (error) {
      console.error('Error fetching tests data', error);
      throw error;
    }
  }



  async getLawData(lawId: string) {
    try {
      const testDocRef = doc(this.lawsCollection, lawId);
      const testSnapshot = await getDoc(testDocRef);

      if (testSnapshot.exists()) {
        return (testSnapshot.data() as ILaw);
      } else {
        console.log(`Law with ID ${lawId} does not exist.`);
        return null;
      }
    } catch (error) {
      console.error(`Error fetching law with ID ${lawId}`, error);
      throw error;
    }
  }

  async getLawsData(lawIds: string[]): Promise<ILaw[]> {
    console.log(lawIds)
    try {
      const lawsObservables = lawIds.map(async (lawId) => {
        return await this.getLawData(lawId);
      });

      const lawResults = await Promise.all(lawsObservables);
      return lawResults.filter((test) => test !== null) as ILaw[];
    } catch (error) {
      console.error('Error fetching tests data', error);
      throw error;
    }
  }

  async getCheckoutItems() {
    try {
      return await new Promise((resolve, reject) => {
        collectionData(this.checkoutCollection).subscribe({
          next: (data) => {
            if (data.length) {
              resolve(data);
            } else {
              resolve(null);
            }
          },
          error: (error) => {
            reject(error);
          }
        });
      });
    } catch (error) {
      console.error('Error fetching checkout data:', error);
      throw error;
    }
  }

  async getContacts() {
    try {
      return await new Promise((resolve, reject) => {
        collectionData(this.contactsCollection).subscribe({
          next: (data) => {
            if (data.length) {
              resolve(data);
            } else {
              resolve(null);
            }
          },
          error: (error) => {
            reject(error);
          }
        });
      });
    } catch (error) {
      console.error('Error fetching contacts:', error);
      throw error;
    }
  }

  getAllUsers() {
    let queryConstraints: QueryConstraint[] = [
      orderBy('createdAt', 'desc')
    ];

    const newsRef = query(
        this.usersCollection,
        ...queryConstraints
    );

    onSnapshot(newsRef, (users => {
      const userItems = users.docs.map(doc => doc.data() as IUser);

      if (userItems.length) {
        this.users$.next(userItems);
      }
    }))
  }
}
