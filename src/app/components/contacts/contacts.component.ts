import { Component, OnInit, TemplateRef } from '@angular/core';
import {DatabaseService} from "../../shared/services/database.service";
import {LoaderService} from "../../shared/services/loader.service";
import {TranslateModule} from "@ngx-translate/core";
import emailjs, { type EmailJSResponseStatus } from '@emailjs/browser';
import { BsModalRef, BsModalService, ModalModule } from "ngx-bootstrap/modal";
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";


@Component({
  selector: 'app-contacts',
  standalone: true,
  imports: [
    TranslateModule,
    ModalModule,
    ReactiveFormsModule,
  ],
  providers: [BsModalService],
  templateUrl: './contacts.component.html',
  styleUrl: './contacts.component.scss'
})
export class ContactsComponent implements OnInit {
  modalRef?: BsModalRef;
  contacts: any[] = [];
  contactUsForm!: FormGroup;

  constructor(
      private databaseService: DatabaseService,
      private loaderService: LoaderService,
      private modalService: BsModalService,
  ) {
  }

  async ngOnInit() {
    this.contacts = await this.databaseService.getContacts() as any[];

    this.loaderService.loading$.next(false);
  }

  openModal(template: TemplateRef<void>) {
    this.modalRef = this.modalService.show(template);
    this.contactUsForm = new FormGroup({
      Name: new FormControl('', Validators.required),
      Email: new FormControl('', [Validators.required, Validators.email]),
      Message: new FormControl('', Validators.required),
    });
  }

  public sendEmail() {

    emailjs
      .send('service_tvdph5s', 'template_rp133uj',{
        "from_name": this.contactUsForm.value.Name,
        "from_email": this.contactUsForm.value.Email,
        "message": this.contactUsForm.value.Message,
      }, {
        publicKey: 'lk9PrGO_l3NYaHZz5',
      })
      .then(
        () => {
          console.log('SUCCESS!');
          this.modalRef?.hide();
          this.contactUsForm.reset();
        },
        (error) => {
          console.log('FAILED...', (error as EmailJSResponseStatus).text);
        },
      );
  }
}
