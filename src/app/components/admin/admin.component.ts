import {Component, OnDestroy, OnInit, ViewEncapsulation} from '@angular/core';
import {INavigationItem} from "../../shared/models/structures.model";
import {AngularFirestore} from "@angular/fire/compat/firestore";
import {NgClass, NgIf} from "@angular/common";
import {FormsModule} from "@angular/forms";
import {LoaderService} from "../../shared/services/loader.service";
import {NgxJsonViewerModule} from "ngx-json-viewer";
import {UserService} from "../../shared/services/user.service";
import {DatabaseService} from "../../shared/services/database.service";
import {Subject, take, takeUntil} from "rxjs";
import {IUser} from "../../shared/models/user.model";
import {ToDateFormatPipe} from "../../shared/pipes/to-date-format.pipe";
import {IBlockItem} from "../../shared/models/exam.model";
import {TranslateModule} from "@ngx-translate/core";
import {NgxPaginationModule} from "ngx-pagination";
import {UserSearchPipe} from "../../shared/pipes/user-search.pipe";

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [
    NgClass,
    FormsModule,
    NgIf,
    NgxJsonViewerModule,
    ToDateFormatPipe,
    TranslateModule,
    NgxPaginationModule,
    UserSearchPipe
  ],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.scss',
  encapsulation: ViewEncapsulation.None
})
export class AdminComponent implements OnInit, OnDestroy {
  uploadSuccess = false;
  isLoading = true;
  users: IUser[] = [];
  blocks: IBlockItem[] = [];
  /*
  commonUsers: IUser[] = [];
  usersSortedByRequest: IUser[] = [];
  products: IProduct[] = [];*/
  searchUser = '';
  lessonResult: any = [];
  p1 = 1;
  p2 = 1;
  p3 = 1;

  activeMode: 'users' | 'documents' = 'documents';

  navigation: INavigationItem[] = [
    { title: 'Пользователи', view: 'users', img: 'settings', isVisible: true},
    { title: 'Экзамены', view: 'exams', img: 'settings', isVisible: true},
    { title: 'Телефоны', view: 'phones', img: 'settings', isVisible: true},
  ];

  activeView = 'exams';
  selectedFiles: (File | undefined | any)[] = [];
  phoneNumber!: string;

  allFilesLoaded = false;

  searchField = '';

  destroy$ = new Subject();

  constructor(
      public afs: AngularFirestore,
      private loaderService: LoaderService,
      private userService: UserService,
      private databaseService: DatabaseService
  ) {
    this.userService.getUserData()
  }

  ngOnInit(): void {
    this.databaseService.getBlocks();
    this.databaseService.getAllUsers();

    this.databaseService.users$.pipe(takeUntil(this.destroy$)).subscribe(users => {
      this.users = users;
    });

    this.databaseService.blocks.pipe(takeUntil(this.destroy$)).subscribe(blocks => {
      this.blocks = blocks;
    })

    setTimeout(() => {
      this.loaderService.loading$.next(false);
    }, 1500)
  }

  ngOnDestroy() {
    this.destroy$.next(true);
    this.destroy$.complete();
  }

  onChangeMode(mode: 'users' | 'documents'): void {
    this.loaderService.loading$.next(true);

    this.activeMode = mode;

    setTimeout(() => {
      this.loaderService.loading$.next(false);
    }, 1500)
  }

  onSearchUser() {
    this.users = this.users.filter(user => user.email.toLowerCase().includes(this.searchField.toLowerCase()));
    this.p1 = 1;
  }

  /*onGetProducts(): void {
    if (this.products.length < 1) {
      this.isLoading = true;
      this.afs
          .collection('products')
          .snapshotChanges()
          .pipe(map(j => j.map(i => i.payload.doc.data() as IProduct)))
          .subscribe((resp: IProduct[]) => {
            this.products.length = 0;
            this.products = resp;
            this.onGetUsers();
          });
    }
  }

  onGetUsers(): void {
    this.afs
        .collection('users')
        .snapshotChanges()
        .pipe(map(j => j.map(i => i.payload.doc.data() as IUser)))
        .subscribe((resp: IUser[]) => {
          this.users.length = 0;
          this.users = resp;
          this.commonUsers = resp;
          this.usersSortedByRequest = [...resp.filter(u => u.request && u.request.product && u.request.time)].sort((a, b) => {
            // @ts-ignore
            return new Date(a.request.time.seconds * 1000 + a.request.time.nanoseconds / 1e6) < new Date(b.request.time.seconds * 1000 + b.request.time.nanoseconds / 1e6) ? 1 : -1;
          });
          this.users = this.commonUsers;
          this.users.filter(u => dayjs(u.expirationDate) < dayjs()).forEach(u => this.onSuspendAccess(u, 1));
          this.isLoading = false;
        });
  }*/

  /*getActiveUsers(users: IUser[]): IUser[] {
    return users.filter(u => u.product && u.expirationDate);
  }

  getExpiredUsers(users: IUser[]): IUser[] {
    return users.filter(u => u.product && !u.expirationDate);
  }

  getRequests(users: IUser[]): IUser[] {
    return users.filter(u => u.request && u.request.product);
  }

  onGetProductDetails(productId: string): IProduct {
    return this.products.find(p => p.id === productId);
  }*/

  getDate(d: any): any {
    return d ? new Date(d.seconds * 1000 + d.nanoseconds / 1000000) : null;
  }

  onFileChanged(event: any): void {
    this.selectedFiles = event.target.files;

    Array.from(this.selectedFiles).forEach(file => {
      const fileReader = new FileReader();
      // @ts-ignore
      fileReader.readAsText(file, 'UTF-8');
      fileReader.onload = () => {
        if (typeof fileReader.result === 'string') {
          this.lessonResult.push(JSON.parse(fileReader.result));
          console.log(this.lessonResult);
          if (this.lessonResult.length === Array.from(this.selectedFiles).length) {
            console.log('All files loaded!');
            this.allFilesLoaded = true;
          }
        }
      };
      fileReader.onerror = (error) => {
        console.log(error);
      };
    });
  }

  /*onGrantAccess(user: IUser): void {

    const temp = JSON.parse(JSON.stringify(user));
    temp.product = user.request.product;
    temp.expirationDate = dayjs().add(this.onGetProductDetails(user.request.product).duration, 'day').format('YYYY-MM-DDTHH:mm');
    delete temp.request;

    this.afs
        .collection('users')
        .doc(user.uid)
        .set(temp)
        .then(() => {
          alert('Доступ предоставлен');
        });
  }*/

  /*onSuspendAccess(user: IUser, log?): void {
    const temp = JSON.parse(JSON.stringify(user));
    temp.expirationDate = null;
    // temp.product = null;

    this.afs
        .collection('users')
        .doc(user.uid)
        .set(temp)
        .then(() => {
          log ? console.log('Доступ приостановлен') : alert('Доступ приостановлен');
        });
  }*/

  /*onExtendAccess(user: IUser): void {
    const temp = JSON.parse(JSON.stringify(user));
    temp.expirationDate = dayjs().add(3, 'day').format();

    this.afs
        .collection('users')
        .doc(user.uid)
        .set(temp)
        .then(() => { console.log('Доступ продлен'); });
  }*/

  onDeleteUser(uid: string): void {
    this.afs.collection('users')
        .doc(uid)
        .delete()
        .then(() => {
          alert('Пользователь удлаен!');
        });
  }

  onRemoveFile(): void {
    this.lessonResult = null;
    this.selectedFiles = [];
    this.allFilesLoaded = false;
  }

  onUpload(type: string): void {
    if (type === 'products') {
      /*this.lessonResult.forEach((product: any) => {
        this.afs
            .collection(type)
            .doc(product.id)
            .set(product)
            .then(() => {
              this.onRemoveFile();
              this.uploadSuccess = true;
              setTimeout(() => this.uploadSuccess = false, 2000);
            });
      });*/
    } else {
      this.lessonResult.forEach((item: any) => {
        this.afs
            .collection(type)
            .doc(item.id)
            .set(item)
            .then(() => {
              this.onRemoveFile();
              this.uploadSuccess = true;
              setTimeout(() => this.uploadSuccess = false, 2000);
            });
      })
    }
  }

  /*onSortUsers(param: string): void {
    if (param === 'common') {
      this.users = this.commonUsers;
    } else {
      this.users = this.usersSortedByRequest;
    }
  }*/

  saveNumber(): void {
    if (this.phoneNumber) {
      this.afs.collection('contacts').doc('phones').set({techSupport: this.phoneNumber}).then(() => {
        this.phoneNumber = '';
      });
    }
  }

  protected readonly Object = Object;
}
