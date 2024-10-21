import {Component, OnDestroy, OnInit} from '@angular/core';
import {FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators} from "@angular/forms";
import {LoaderService} from "../../shared/services/loader.service";
import {Router} from "@angular/router";
import {UserService} from "../../shared/services/user.service";
import {TranslateModule} from "@ngx-translate/core";
import {Subject, takeUntil} from "rxjs";
import { LanguageService } from "../../shared/services/language.service";

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    TranslateModule,
    FormsModule
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit, OnDestroy {
  passType = 'password';
  signInForm!: FormGroup;

  isPasswordIncorrect = false;
  isResetPassword = false;
  showErrors = false;
  resetEmail: FormControl = new FormControl('', Validators.required);
  resetEmailMessage!: string;
  isResetError = false;

  destroy$ = new Subject();

  constructor(
      private loaderService: LoaderService,
      private fb: FormBuilder,
      private userService: UserService,
      protected router: Router,
      private languageService: LanguageService,
  ) {
  }

  ngOnInit() {
    this.createForm();

    this.loaderService.loading$.next(false);
  }

  ngOnDestroy() {
    this.destroy$.next(true);
    this.destroy$.complete();
  }

  createForm() {
    this.signInForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });

    this.signInForm.get('email')?.valueChanges
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => {
          if (this.showErrors) {
            this.showErrors = false;
          }
        })

    this.signInForm.get('password')?.valueChanges
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => {
          if (this.isPasswordIncorrect) {
            this.isPasswordIncorrect = false;
          }
        });
  }

  signIn() {
    if (!this.signInForm.valid) {
      this.showErrors = true;
      return;
    }

    this.loaderService.loading$.next(true);

    this.userService.signIn(this.signInForm.value).then(() => {
      this.router.navigate(['/']).then();
    }).catch((error) => {
      if (error.code === 'auth/invalid-credential') {
        this.isPasswordIncorrect = true;
      }
      this.loaderService.loading$.next(false);
    })
  }

  resetPassword() {
    this.isResetError = false;
    this.userService.passwordReset(this.resetEmail.value).then(() => {
      this.languageService.getCurrentLanguageAsObservable().pipe().subscribe(value => value === 'ru' ?
      this.resetEmailMessage = `На адрес ${this.resetEmail.value} было отправлено письмо с инструкциями по сбросу пароля.` :
      this.resetEmailMessage = `${this.resetEmail.value} мекенжайына құпия сөзді ысыру жолы туралы нұсқаулары бар электрондық хат жіберілді.`
      );

      setTimeout(() => {
        this.resetEmailMessage = '';
        this.isResetPassword = false;
        this.resetEmail.setValue('');
      }, 10000)

    }).catch((error) => {
      this.isResetError = true;
    })
  }
}
