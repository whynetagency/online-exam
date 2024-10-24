import {AfterViewInit, Component, OnDestroy, OnInit, TemplateRef, ViewChild} from '@angular/core';
import {LoaderService} from "../../shared/services/loader.service";
import {TranslateModule, TranslateService} from "@ngx-translate/core";
import {ActivatedRoute, Router} from "@angular/router";
import {IBlockItem, ILaw, IQuestion, ITest} from "../../shared/models/exam.model";
import {DatabaseService} from "../../shared/services/database.service";
import {LanguageService} from "../../shared/services/language.service";
import {IBreadcrumb} from "../../shared/models/structures.model";
import {FormBuilder, FormGroup, ReactiveFormsModule} from "@angular/forms";
import {Subject, takeUntil} from "rxjs";
import {UserService} from "../../shared/services/user.service";
import {IUser} from "../../shared/models/user.model";
import {BsModalRef, BsModalService} from "ngx-bootstrap/modal";
import {ToDateFormatPipe} from "../../shared/pipes/to-date-format.pipe";

@Component({
  selector: 'app-test',
  standalone: true,
  imports: [
    TranslateModule,
    ReactiveFormsModule,
    ToDateFormatPipe
  ],
  providers: [BsModalService],
  templateUrl: './test.component.html',
  styleUrl: './test.component.scss'
})
export class TestComponent implements OnInit, OnDestroy {
  @ViewChild('confirmModal', {static: true}) confirmModal!: TemplateRef<any>;

  modalRef?: BsModalRef;

  user?: IUser | null;

  blockId = '';
  test!: ITest | null;
  testsData: ITest[] = [];
  block!: IBlockItem | null;

  examBuilderForm!: FormGroup;
  totalExamPrice = 0;
  userTestBalance!: number;
  userTestExpirationDate: any;

  testStarted = false;
  testFinished = false;
  activeLaw = '';
  activeQuestion = 0;

  maxFormHeight = 0;

  public testFailed = false;
  public testPassed = false;
  public isTimedOut = false;

  correctAnswers: any[] = [];
  correctAnswersSumm = 0;
  totalQuestionsAmount = 0;

  breadcrumb: IBreadcrumb[] = []

  showSelectTests = false;
  answersVisibleMode = false;

  isNoMoneyError = false;
  isNoLawsSelected = false;

  activeLanguage!: string;

  destroy$ = new Subject();

  constructor(
      private loaderService: LoaderService,
      private translateService: TranslateService,
      protected languageService: LanguageService,
      private router: Router,
      private route: ActivatedRoute,
      private databaseService: DatabaseService,
      private fb: FormBuilder,
      private userService: UserService,
      private modalService: BsModalService
  ) {
  }

  ngOnInit() {
    this.activeLanguage = this.languageService.lg;

    this.blockId = this.route.snapshot.paramMap.get('id')!;

    this.userService.user$.pipe(takeUntil(this.destroy$)).subscribe(u => {
      this.user = u;

      if (this.user) {
        // @ts-ignore
        this.userTestBalance = this.user.balances[this.blockId].amount;
        // @ts-ignore
        this.userTestExpirationDate = this.user.balances[this.blockId].expirationDate;

        this.userService.onCheckUserExpirationDated();
      }
    });

    this.databaseService.blocks.pipe(takeUntil(this.destroy$)).subscribe(async blocks => {
      if (!blocks.length) {
        this.databaseService.getBlocks();
      } else {
        this.block = blocks.find(block => block.id === this.blockId) || null;

        this.testsData = await this.databaseService.getTestsData(this.block!.exams);

        if (this.testsData.length === 1) {
          this.test = this.testsData[0];

          this.onCreateExamForm();
        } else {
          this.showSelectTests = true;
        }

        this.generateBreadcrumb();

        this.loaderService.loading$.next(false);
      }
    })
  }

  ngOnDestroy() {
    this.destroy$.next(true);
    this.destroy$.complete();
  }

  onCreateExamForm() {
    this.examBuilderForm = this.fb.group({});

    const savedForm = JSON.parse(localStorage.getItem(`testForm-${this.blockId}`)!);
    console.log(this.test?.topics)
    this.test?.topics.forEach(law => {
      this.examBuilderForm.addControl(law.id, this.fb.control(savedForm && savedForm[law.id] ? savedForm[law.id] : false));
    });

    this.calculateExamPrice();

    this.examBuilderForm.valueChanges
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => {
          this.calculateExamPrice();
        });
  }

  onStartTest() {
    if (!this.user) {
      this.router.navigate(['/login']).then();
      this.saveFormToLs();
      return;
    }

    if (this.totalExamPrice === 0) {
      this.saveFormToLs();
      this.isNoLawsSelected = true;
      return;
    } else {
      this.isNoLawsSelected = false
    }

    if (this.userTestBalance < this.totalExamPrice) {
      this.saveFormToLs();
      this.isNoMoneyError = true;
      return;
    }

    if (this.user && (this.userTestBalance >= this.totalExamPrice)) {
      this.onOpenStartConfirmationModal();
    }
  }

  saveFormToLs() {
    localStorage.setItem(`testForm-${this.blockId}`, JSON.stringify(this.examBuilderForm.value));
  }

  onOpenStartConfirmationModal() {
    this.modalRef = this.modalService.show(this.confirmModal, { class: 'modal-sm' });
  }

  async confirm() {
    this.loaderService.loading$.next(true);
    this.modalRef?.hide();

    // @ts-ignore
    this.test!.topics = (await this.onBuildExamData())?.filter(item => item !== null);
    this.activeLaw = this.test!.topics[0].id;

    const userBalances = this.user!.balances;
    // @ts-ignore
    userBalances[this.blockId].amount = userBalances[this.blockId].amount - this.totalExamPrice;
    await this.userService.updateUserData('balances', userBalances);

    this.userService.getUserData();
    localStorage.removeItem(`testForm-${this.blockId}`);

    this.testStarted = true;
    this.loaderService.loading$.next(false);
  }

  decline(): void {
    this.modalRef?.hide();
  }

  async onBuildExamData() {
    // @ts-ignore
    const lawsData = await this.databaseService.getLawsData(Object.keys(this.examBuilderForm.value).filter(key => this.examBuilderForm.value[key]));

    return this.test?.topics
        .map((law) => {
          if (this.examBuilderForm.value[law.id]) {
            console.log('here')
            law.questions =
                this.shuffleArray(lawsData.find(lawItem => lawItem.id === law.id)?.questions)
                    .slice(0, law.questionsCount);

            law.questions.map(q => this.shuffleArray(q.choices))

            return law;
          } else {
            console.log('here2')
            return null;
          }
        });
  }

  public onSelectLaw(law: string) {
    this.activeLaw = law;
    //this.onSelectQuestion(1);
  }

  public onPrevQuestion(): void {
    --this.activeQuestion;
  }

  public onNextQuestion(): void {
    const TOPIC = this.topicById(this.activeLaw);
    const notAnsweredQuestion = TOPIC.questions.findIndex(q => !q.selectedAnswer);

    if (this.activeQuestion < TOPIC.questionsCount - 1) {
      this.activeQuestion = notAnsweredQuestion;
    } else if (notAnsweredQuestion === -1) {
        TOPIC.isSectionCompleted = true;
        if (this.test!.topics.find(t => !t.isSectionCompleted)) {
          this.activeLaw = this.test!.topics.find(t => !t.isSectionCompleted)!.id;
        } else {
          this.onStop();
        }
        this.activeQuestion = 0;
      }
  }

  onSetAnswer(law: ILaw) {
    law.questions[this.activeQuestion].selectedAnswer = law.questions[this.activeQuestion].tempSelectedAnswer!;
    delete law.questions[this.activeQuestion].tempSelectedAnswer;
  }

  public onSelectQuestion(question: number) {
    this.activeQuestion = question;
  }
  public onSelectTopic(law: string): void {
    this.activeLaw = law;
    this.onSelectQuestion(1);
  }

  public topicById(str: any): ILaw {
    return this.test!.topics.find(t => t.id === str)!;
  }

  public onStop(): void {
    this.testFinished = true;
    /*if (reason === 'time') { this.isTimedOut = true; }
    if (reason === 'failed') { this.testFailed = true; }*/

    this.calculateCorrectAnswersByTopic();

    /*if ((this.getCorrectAnswersCount >= this.test!.passingScore) && this.onCheckPassExamByTopics(this.exam.topics)) {
      this.isPassed = true;
      this.isFailed = false;
    } else {
      this.isPassed = false;
      this.isFailed = true;
    }*/
  }

  calculateCorrectAnswersByTopic(): void {
    this.test!.topics.forEach(top => {
      let correctAnswersInTopic = 0;
      this.totalQuestionsAmount += top.questions.length;

      top.questions.forEach(question => {
        if (question.correctAnswer === question.selectedAnswer ) {
          correctAnswersInTopic++;
        }
      });
      this.correctAnswers.push(correctAnswersInTopic);
    });

    this.correctAnswersSumm = this.correctAnswers.reduce((acc, curr) => acc + curr, 0);
  }

  calculateExamPrice() {
    const trueCount = Object.values(this.examBuilderForm.value).filter(value => value === true).length;

    this.totalExamPrice = trueCount * (!this.answersVisibleMode ? this.test!.pricePerTest : this.test!.pricePerTestHigh);
  }

  generateBreadcrumb() {
    this.breadcrumb = [];

    this.breadcrumb = [
        {
          link: '/',
          name: 'HEADER.NAV.HOME',
        },
        {
          type: 'block',
          link: '',
          name: this.translateService.instant(this.block!.title),
          handler: () => {
            this.test = null;
            this.showSelectTests = true;
          }
        }
    ]
  }

  onSelectExam(test: ITest) {
    this.test = test;

    if (this.user) {
      // @ts-ignore
      this.userTestBalance = this.user.balances[this.blockId].amount;
    }

    this.onCreateExamForm();

    const existingTestItemIndex = this.breadcrumb.findIndex(item => item.type === 'test');

    const newBreadCrumb = {
      link: '',
      name: this.languageService.lg === 'ru' ? this.test!.title : this.test!["title-kz"],
      type: 'test'
    }

    if (existingTestItemIndex === -1) {
      this.breadcrumb.push(newBreadCrumb)
    } else {
      this.breadcrumb.splice(existingTestItemIndex, 1, newBreadCrumb)
    }

    this.showSelectTests = false;
  }

  breadcrumbNavigate(item: IBreadcrumb, index: number) {
    if (item.handler) {
      item.handler();
    }
    if (item.link) {
      this.router.navigate([item.link]).then();
    }
    this.breadcrumb.splice(index, this.breadcrumb.length - index);
  }

  onSwitchTestMode(event: any) {
    this.answersVisibleMode = event.target.checked;
    this.calculateExamPrice();
  }

  shuffleArray(array: any): [] {
    let currentIndex = array.length;
    let randomIndex;
    while (currentIndex !== 0) {
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
      [array[currentIndex], array[randomIndex]] = [
        array[randomIndex], array[currentIndex]];
    }
    return array;
  }

  public onSelectVariant(e: any, l: ILaw): void {
    if (!this.answersVisibleMode) {
      l.questions[e.target.name.substring(1) - 1].selectedAnswer = e.target.value;
    } else {
      l.questions[e.target.name.substring(1) - 1].tempSelectedAnswer = e.target.value;
    }
  }

  public get isLastQuestion(): boolean {
    const TOPIC = this.topicById(this.activeLaw);
    const LAST_TOPIC = this.test!.topics[this.test!.topics.length - 1];
    return (LAST_TOPIC.id === this.activeLaw && TOPIC.questionsCount === this.activeQuestion);
  }

  backToTest() {
    location.reload();
  }
}
