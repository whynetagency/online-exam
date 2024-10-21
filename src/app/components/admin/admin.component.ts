import { Component, ElementRef, OnDestroy, OnInit, TemplateRef, ViewChild, ViewEncapsulation } from '@angular/core';
import {INavigationItem} from "../../shared/models/structures.model";
import {AngularFirestore} from "@angular/fire/compat/firestore";
import { DatePipe, NgClass, NgForOf, NgIf } from "@angular/common";
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from "@angular/forms";
import {LoaderService} from "../../shared/services/loader.service";
import {NgxJsonViewerModule} from "ngx-json-viewer";
import {UserService} from "../../shared/services/user.service";
import {DatabaseService} from "../../shared/services/database.service";
import { combineLatest, filter, map, Subject, takeUntil } from "rxjs";
import {IUser} from "../../shared/models/user.model";
import {ToDateFormatPipe} from "../../shared/pipes/to-date-format.pipe";
import { IBlockItem, ILaw, ITest } from "../../shared/models/exam.model";
import {TranslateModule} from "@ngx-translate/core";
import {NgxPaginationModule} from "ngx-pagination";
import {UserSearchPipe} from "../../shared/pipes/user-search.pipe";
import dayjs from "dayjs";
import { BsModalRef, BsModalService, ModalModule } from "ngx-bootstrap/modal";

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
    UserSearchPipe,
    DatePipe,
    NgForOf,
    ReactiveFormsModule,
    ModalModule
  ],
  providers: [BsModalService],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.scss',
  encapsulation: ViewEncapsulation.None
})
export class AdminComponent implements OnInit, OnDestroy {
  @ViewChild('fileInput', { static: false }) fileInput!: ElementRef;
  uploadSuccess = false;
  selectedUser: any;
  balanceForm!: FormGroup;
  modalRef?: BsModalRef;
  users: IUser[] = [];
  blocks: IBlockItem[] = [];
  laws: ILaw[] = [];
  groupedLaws: any[] = [];
  lessonResult: any = [];
  p1 = 1;
  p2 = 1;
  p3 = 1;

  activeMode: 'users' | 'documents' | 'laws' = 'users';

  navigation: INavigationItem[] = [
    { title: 'Пользователи', view: 'users', img: 'settings', isVisible: true},
    { title: 'Экзамены', view: 'exams', img: 'settings', isVisible: true},
    { title: 'Телефоны', view: 'phones', img: 'settings', isVisible: true},
  ];

  lawsBlockTitleMap = new Map<string, string>([
    ['1', 'Административная служба (КОРПУС Б)'],
    ['2', 'Правоохранительная служба'],
    ['3', 'Нотариат'],
    ['4', 'Адвокатура'],
    ['5', 'НАО «Правительство для граждан'],
    ['6', 'Руководитель организации образования'],
    ['7', 'Судебный корпус'],
    ['8', 'Частный судебный исполнитель'],
    ['9', 'КОРПУС А (Руководитель аппарата или Председатель)'],
  ])

  selectedFiles: (File | undefined | any)[] = [];

  allFilesLoaded = false;

  searchField = '';

  destroy$ = new Subject<void>();

  constructor(
    public afs: AngularFirestore,
    private loaderService: LoaderService,
    private userService: UserService,
    private databaseService: DatabaseService,
    private modalService: BsModalService,
  ) {
    this.userService.getUserData();
    this.balanceForm = new FormGroup({
      blockId: new FormControl('', Validators.required),
      balance: new FormControl([0, [Validators.required, Validators.min(0)]]),
    });
  }

  ngOnInit(): void {
    this.balanceForm.controls['blockId'].valueChanges.subscribe(value => {
      this.balanceForm.controls['balance'].setValue(this.selectedUser.balances[value].amount)
    })
    this.databaseService.getBlocks();
    this.databaseService.getAllUsers();
    this.databaseService.getAllLaws()

    combineLatest({
      users: this.databaseService.users$.pipe(),
      blocks: this.databaseService.blocks.pipe(),
      laws: this.databaseService.laws$.pipe(),
    }).pipe(takeUntil(this.destroy$)).subscribe({
      next: ({ users, blocks , laws}) => {
        this.users = users;
        this.blocks = blocks.sort((a, b) => a.order - b.order);
        this.blocks.pop(); // remove PDD block
        this.laws = laws;
        this.groupLawsByBlock();
      },
      error: (err) => console.error('Error loading data:', err),
      complete: () => this.loaderService.loading$.next(false),
    });
    setTimeout(() => {
      this.loaderService.loading$.next(false);
    }, 1500)
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onChangeMode(mode: 'users' | 'documents' | 'laws'): void {
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

  openBalanceModal(user: IUser, content: TemplateRef<any>) {
    this.selectedUser = user;
    this.balanceForm.controls['balance'].setValue(user.balances)
    this.modalRef = this.modalService.show(content);
  }

  deleteLaw(id: string): void {
    this.afs
      .collection('laws')
      .doc(id)
      .delete()
      .then(() => alert('Закон успішно видалено!'))
      .catch((error) => console.error('Помилка при видаленні:', error));
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
          if (this.lessonResult.length === Array.from(this.selectedFiles).length) {
            this.allFilesLoaded = true;
          }
        }
      };
      fileReader.onerror = (error) => {
        console.log(error);
      };
    });
  }

  onSuspendAccess(user: IUser, blockId: string): void {
    const temp = JSON.parse(JSON.stringify(user));
    temp.balances[blockId].expirationDate = null;

    this.afs
      .collection('users')
      .doc(user.uid)
      .set(temp)
      .then(() => {
        alert('Доступ приостановлен');
      });
  }

  addBalance(userId: string, blockId: string) {
    this.databaseService.users$.pipe(
      map((users) => users.find(user => user.uid === userId)),
      filter(user => !!user),
      takeUntil(this.destroy$),
    ).subscribe(async u => {
      u!.balances[blockId].amount = this.balanceForm.controls['balance'].value;
      await this.userService.updateUserData('balances', u!.balances, userId);
      this.modalRef?.hide();
    });
  }

  proceedAccess(blockId: string, userId: string): void {
    this.databaseService.users$.pipe(
      map((users) => users.find(user => user.uid === userId)),
      filter(user => !!user),
    ).subscribe(async u => {
      u!.balances[blockId].expirationDate = this.getExpirationDate();

      await this.userService.updateUserData('balances', u!.balances, userId);
    });
  }

  getExpirationDate(): any {
    const now = dayjs();
    const futureDate = now.add(2, 'month');
    const formattedDate = futureDate.format('YYYY-MM-DD HH:mm:ss');
    const dateInSeconds = dayjs(formattedDate).unix();
    return { seconds: dateInSeconds };
  }

  onDeleteUser(uid: string): void {
    this.afs.collection('users')
      .doc(uid)
      .delete()
      .then(() => {
        alert('Пользователь удален!');
      });
  }

  groupLawsByBlock() {
    const grouped = this.laws.reduce((acc: { [key: string]: any[] }, law) => {
      const blockNumber = law.id.split('-')[0];
      if (!acc[blockNumber]) {
        acc[blockNumber] = [];
      }
      acc[blockNumber].push(law);
      return acc;
    }, {});

    this.groupedLaws = Object.entries(grouped).map(([blockId, items]) => ({
      blockId,
      items
    }));
  }

  onRemoveFile(): void {
    this.lessonResult = [];
    this.selectedFiles = [];
    this.allFilesLoaded = false;
    this.fileInput.nativeElement.value = '';
  }

  onUpload(type: string): void {
    this.lessonResult.forEach((item: ILaw | ITest) => {
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

  /*onSortUsers(param: string): void {
    if (param === 'common') {
      this.users = this.commonUsers;
    } else {
      this.users = this.usersSortedByRequest;
    }
  }*/

  protected readonly Object = Object;
}
