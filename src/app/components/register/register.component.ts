import {Component, OnDestroy, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from "@angular/forms";
import {TranslateModule} from "@ngx-translate/core";
import {Subject, takeUntil} from "rxjs";
import {Router} from "@angular/router";
import {LoaderService} from "../../shared/services/loader.service";
import {UserService} from "../../shared/services/user.service";

@Component({
  selector: 'app-register',
  standalone: true,
    imports: [
        ReactiveFormsModule,
        TranslateModule
    ],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent implements OnInit, OnDestroy {
    passType = 'password';
    registerForm!: FormGroup;

    isPasswordIncorrect = false;
    showErrors = false;
    passwordLengthError = false;
    emailAlreadyUsed = false

    destroy$ = new Subject();

    constructor(
        private loaderService: LoaderService,
        private fb: FormBuilder,
        private userService: UserService,
        protected router: Router
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
        this.registerForm = this.fb.group({
            email: ['', [Validators.required, Validators.email]],
            password: ['', [Validators.required, Validators.minLength(6)]],
            phone: ['', [Validators.required]],
            name: ['', [Validators.required]]
        });

        this.registerForm.get('email')?.valueChanges
            .pipe(takeUntil(this.destroy$))
            .subscribe(() => {
                if (this.showErrors) {
                    this.showErrors = false;
                }
            })

        this.registerForm.get('password')?.valueChanges
            .pipe(takeUntil(this.destroy$))
            .subscribe(() => {
                if (this.isPasswordIncorrect) {
                    this.isPasswordIncorrect = false;
                }
            });
    }

    onCheckEnteredValue(event: any) {
        const invalidChars = ["-", "e", "E"];
        if (invalidChars.includes(event.key)) {
            event.preventDefault();
        }
        if (event.key === '0' && !this.registerForm.get('phone')?.value) {
            event.preventDefault();
        }
    }

    createAccount() {
        this.loaderService.loading$.next(true);

        this.userService.createUser({
            email: this.registerForm.value.email,
            name: this.registerForm.value.name,
            phone: this.registerForm.value.phone,
            password: this.registerForm.value.password
        }).then(async () => {
            this.router.navigate(['/home']);
        }).catch(error => {
          this.showErrors = true;
          if (error.code === 'auth/email-already-in-use') {
            this.emailAlreadyUsed = true;
          }
          if (error.code === 'auth/weak-password') {
            this.passwordLengthError = true;
            this.isPasswordIncorrect = true;
          }
          this.loaderService.loading$.next(false)
          console.log(error);
        })
    }
}
