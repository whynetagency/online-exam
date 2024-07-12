import { Component } from '@angular/core';
import {TranslateModule} from "@ngx-translate/core";
import {BottomSectionComponent} from "./bottom-section/bottom-section.component";

@Component({
  selector: 'app-footer',
  standalone: true,
    imports: [
        TranslateModule,
        BottomSectionComponent
    ],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss'
})
export class FooterComponent {

}
