import {Component, OnInit} from '@angular/core';
import {DatabaseService} from "../../shared/services/database.service";
import {LoaderService} from "../../shared/services/loader.service";
import {TranslateModule} from "@ngx-translate/core";

@Component({
  selector: 'app-contacts',
  standalone: true,
  imports: [
    TranslateModule
  ],
  templateUrl: './contacts.component.html',
  styleUrl: './contacts.component.scss'
})
export class ContactsComponent implements OnInit {

  contacts: any[] = [];

  constructor(
      private databaseService: DatabaseService,
      private loaderService: LoaderService
  ) {
  }

  async ngOnInit() {
    this.contacts = await this.databaseService.getContacts() as any[];

    this.loaderService.loading$.next(false);
  }
}
