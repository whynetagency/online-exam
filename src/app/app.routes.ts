import {Routes} from '@angular/router';
import {HomeComponent} from './components/home/home.component';
import {TestComponent} from './components/test/test.component';
import {AdminComponent} from './components/admin/admin.component';
import {LoginComponent} from './components/login/login.component';
import {RegisterComponent} from './components/register/register.component';
import {logInGuard} from './shared/guards/log-in.guard';
import {CheckoutComponent} from './components/checkout/checkout.component';
import {ContactsComponent} from './components/contacts/contacts.component';
import {PrivacyPolicyComponent} from './components/static/privacy-policy/privacy-policy.component';
import {OfferAgreementComponent} from './components/static/offer-agreement/offer-agreement.component';
import {authGuard} from './shared/guards/auth.guard';
import {adminGuard} from './shared/guards/admin.guard';
import {PaymentsComponent} from './components/static/payments/payments.component';
import {PasswordResetComponent} from './components/password-reset/password-reset.component';

export const routes: Routes = [
    {path: 'home', component: HomeComponent, canActivate: []},
    {path: 'test/:id', component: TestComponent, canActivate: [authGuard]},
    {path: 'login', component: LoginComponent, canActivate: [logInGuard]},
    {path: 'password-reset', component: PasswordResetComponent, canActivate: [logInGuard]},
    {path: 'register', component: RegisterComponent, canActivate: [logInGuard]},
    {path: 'checkout', component: CheckoutComponent, canActivate: []},
    {path: 'contacts', component: ContactsComponent, canActivate: []},
    {path: 'privacy-policy', component: PrivacyPolicyComponent, canActivate: []},
    {path: 'offer-agreement', component: OfferAgreementComponent, canActivate: []},
    {path: 'payments', component: PaymentsComponent, canActivate: []},
    {path: 'admin', component: AdminComponent, canActivate: [adminGuard]},
    {path: '**', redirectTo: 'home', pathMatch: 'full'}
];
