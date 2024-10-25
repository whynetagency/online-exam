import { Component, ElementRef, OnDestroy, OnInit, TemplateRef, ViewChild, ViewEncapsulation } from '@angular/core';
import {INavigationItem} from "../../shared/models/structures.model";
import {AngularFirestore} from "@angular/fire/compat/firestore";
import { DatePipe, NgClass, NgForOf, NgIf } from "@angular/common";
import { FormArray, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from "@angular/forms";
import {LoaderService} from "../../shared/services/loader.service";
import {NgxJsonViewerModule} from "ngx-json-viewer";
import {UserService} from "../../shared/services/user.service";
import {DatabaseService} from "../../shared/services/database.service";
import { combineLatest, filter, map, Subject, switchMap, take, takeUntil } from "rxjs";
import {IUser} from "../../shared/models/user.model";
import {ToDateFormatPipe} from "../../shared/pipes/to-date-format.pipe";
import { IBlockItem, ILaw, ITest } from "../../shared/models/exam.model";
import {TranslateModule} from "@ngx-translate/core";
import {NgxPaginationModule} from "ngx-pagination";
import { UserSearchPipe } from "../../shared/pipes/user-search.pipe";
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
  tests: ITest[] = [];
  groupedLaws: any[] = [];
  lessonResult: any = [];
  selectedBlock!: ITest;
  isLoading = false;
  p1 = 1;
  p2 = 1;
  p3 = 1;

  testForm = new FormGroup({
    title: new FormControl('', Validators.required),
    titleKz: new FormControl('', Validators.required),
    topics: new FormArray([]),  // Масив тем
    pricePerTest: new FormControl(0, Validators.required),
    pricePerTestHigh: new FormControl(0, Validators.required)
  });


  activeMode: 'users' | 'documents' | 'laws' | 'tests' = 'documents';

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
    this.databaseService.getAllLaws();
    this.databaseService.getAllTest();

    combineLatest({
      users: this.databaseService.users$.pipe(takeUntil(this.destroy$)),
      blocks: this.databaseService.blocks.pipe(takeUntil(this.destroy$)),
      laws: this.databaseService.laws$.pipe(takeUntil(this.destroy$)),
      tests: this.databaseService.tests$.pipe(takeUntil(this.destroy$)),
    }).pipe(takeUntil(this.destroy$)).subscribe({
      next: ({ users, blocks , laws, tests}) => {
        this.users = users;
        this.blocks = [...blocks.sort((a, b) => a.order - b.order)];
        this.blocks.pop(); // remove PDD block
        this.laws = laws;
        this.groupLawsByBlock();
        this.tests = tests;
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

  onChangeMode(mode: 'users' | 'documents' | 'laws' | 'tests'): void {
    this.loaderService.loading$.next(true);
    this.activeMode = mode;
    setTimeout(() => {
      this.loaderService.loading$.next(false);
    }, 1500)
  }

  openBalanceModal(user: IUser, content: TemplateRef<any>) {
    this.selectedUser = user;
    this.balanceForm.controls['balance'].setValue(user.balances)
    this.modalRef = this.modalService.show(content);
  }

  openAddLawModal(content: TemplateRef<any>) {
    this.modalRef = this.modalService.show(content);
  }

  deleteLaw(id: string): void {
    this.afs
      .collection('laws')
      .doc(id)
      .delete()
      .then(() => {
        alert('Закон успешно удалён!');
        this.deleteLawFromTopics(id);
      })
      .catch((error) => console.error('Ошибка при удалении:', error));
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

  onSuspendAccess(userId: string, blockId: string): void {
    this.databaseService.users$.pipe(
      map(users => users.find(user => user.uid === userId)),
      filter(user => !!user),
      take(1),
      switchMap(async (user) => {
        user!.balances[blockId].expirationDate = null;
        await this.userService.updateUserData('balances', user!.balances, userId);
        return this.databaseService.getAllUsers();  // Онови дані після змін
      })
    ).subscribe(() => {
      alert('Доступ приостановлен');
    });
  }

  proceedAccess(blockId: string, userId: string): void {
    this.databaseService.users$.pipe(
      map(users => users.find(user => user.uid === userId)),
      filter(user => !!user),
      take(1),
      switchMap(async (user) => {
        user!.balances[blockId].expirationDate = this.getExpirationDate();
        await this.userService.updateUserData('balances', user!.balances, userId);
        return this.databaseService.getAllUsers();  // Онови дані після змін
      })
    ).subscribe();
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

  filterLaw(laws: ILaw[]): ILaw[] {
    return laws.filter(law => !law.id.includes('kz'));
  }

  deleteLawFromTopics(lawId: string): void {
    this.afs.collection<ITest>('tests').get().subscribe(snapshot => {
      const batch = this.afs.firestore.batch();

      snapshot.forEach(doc => {
        const testData = doc.data();
        const updatedTopics = testData.topics.filter(topic => topic.id !== lawId);

        if (updatedTopics.length !== testData.topics.length) {
          const testRef = this.afs.collection('tests').doc(doc.id).ref;

          batch.update(testRef, { topics: updatedTopics });
        }
      });

      batch.commit()
        .then(() => console.log('Topics updated successfully'))
        .catch(error => console.error('Error with updates topics:', error));
    });
  }

  get topics(): FormArray {
    return this.testForm.get('topics') as FormArray;
  }

  selectedTest(test: ITest): void {
    this.selectedBlock = test;
      this.testForm.patchValue({
        title: test.title,
        titleKz: test["title-kz"],
        pricePerTest: test.pricePerTest,
        pricePerTestHigh: test.pricePerTestHigh
      });

      test.topics.forEach(topic => {
        this.topics.push(new FormGroup({
          id: new FormControl(topic.id, [Validators.required]),
          title: new FormControl(topic.title),
          'title-kz': new FormControl(topic['title-kz']),
          questionsCount: new FormControl(topic.questionsCount),
          questions: new FormControl(topic.questions)
        }));
      });
  }

  selectedLawIds: string[] = [];
  onLawChange(event: any, lawId: string): void {
    if (event.target.checked) {
      this.selectedLawIds.push(lawId);
    } else {
      this.selectedLawIds = this.selectedLawIds.filter(id => id !== lawId);
    }
  }

  addLawsToTopics(): void {
    this.selectedLawIds.forEach(lawId => {
      const matchedLaw = this.laws.filter(law => law.id === lawId);
      const matchedLawKz = this.laws.filter(law => law.id === `${lawId}-kz`)
      this.topics.push(
        new FormGroup({
          id: new FormControl(lawId, [Validators.required]),
          title: new FormControl(matchedLaw[0].title, [Validators.required]),
          'title-kz': new FormControl(matchedLawKz[0].title ?? '', [Validators.required]),
          questionsCount: new FormControl(matchedLaw[0]?.questionsTotal, [Validators.required]),
          questions: new FormControl([], [Validators.required])
        })
      )
    });

    this.selectedLawIds = [];
    this.modalRef?.hide();
  }

  removeTopic(index: number, lawId: string): void {
    this.topics.removeAt(index);
  }

  onUpdateTest() {
    this.isLoading = true;
    const testData: Partial<ITest> = {
      id: this.selectedBlock.id, // залишаємо id при оновленні
      title: <string>this.testForm.value.title, // дозволяє null
      'title-kz': <string>this.testForm.value.titleKz, // дозволяє null
      pricePerTest: +<number>this.testForm.value.pricePerTest, // дозволяє null
      pricePerTestHigh: <number>this.testForm.value.pricePerTestHigh,
      topics: this.topics.value // переконайтеся, що topics є масивом
    };

    if (this.selectedBlock.id) {
      this.afs
        .collection('tests')
        .doc(this.selectedBlock.id)
        .set(testData)
        .then(() => {
          this.uploadSuccess = true;
          setTimeout(() => this.uploadSuccess = false, 2000);
        });
      this.afs.collection<ITest>('tests').doc(this.selectedBlock.id).update(testData).then(() => this.isLoading = false);
    }
  }

  protected readonly Object = Object;
}
