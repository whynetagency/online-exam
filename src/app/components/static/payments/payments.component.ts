import {Component} from '@angular/core';
import {TranslateModule} from '@ngx-translate/core';

@Component({
    selector: 'app-payments',
    standalone: true,
    imports: [
        TranslateModule
    ],
    templateUrl: './payments.component.html',
    styleUrl: './payments.component.scss'
})
export class PaymentsComponent {
}
