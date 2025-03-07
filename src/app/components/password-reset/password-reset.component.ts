import {Component, OnDestroy, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {LoaderService} from '../../shared/services/loader.service';
import {Router} from '@angular/router';
import {UserService} from '../../shared/services/user.service';
import {TranslateModule} from '@ngx-translate/core';
import {Subject, takeUntil} from 'rxjs';

@Component({
    selector: 'app-password-reset',
    standalone: true,
    imports: [
        ReactiveFormsModule,
        TranslateModule
    ],
    templateUrl: './password-reset.component.html',
    styleUrl: './password-reset.component.scss'
})
export class PasswordResetComponent implements OnInit, OnDestroy {
    passType = 'password';
    signInForm!: FormGroup;

    isPasswordIncorrect = false;
    showErrors = false;

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
        this.signInForm = this.fb.group({
            email: ['', [Validators.required, Validators.email]]
        });

        this.signInForm.get('email')?.valueChanges
            .pipe(takeUntil(this.destroy$))
            .subscribe(() => {
                if (this.showErrors) {
                    this.showErrors = false;
                }
            })
    }

    onReset() {
        if (!this.signInForm.valid) {
            this.showErrors = true;
            return;
        }

        this.loaderService.loading$.next(true);

        this.userService.resetPassword(this.signInForm.value).then(() => {
            this.router.navigate(['/login']).then();
        }).catch((error: any) => {
            if (error.code === 'auth/invalid-credential') {
                this.isPasswordIncorrect = true;
            }
            this.loaderService.loading$.next(false);
        })
    }

  protected readonly onreset = onreset;
}
