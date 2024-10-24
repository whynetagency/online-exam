import {Component, OnInit} from '@angular/core';
import {DatabaseService} from "../../shared/services/database.service";
import {LoaderService} from "../../shared/services/loader.service";
import {IBlockItem} from "../../shared/models/exam.model";
import { TranslateModule, TranslateService } from "@ngx-translate/core";
import {UserService} from "../../shared/services/user.service";
import dayjs from 'dayjs';
import {Router} from "@angular/router";
import {first} from "rxjs";
import { FormControl, ReactiveFormsModule, Validators } from "@angular/forms";
import { CheckoutService } from "../../shared/services/checkout.service";
@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [
    TranslateModule,
    ReactiveFormsModule
  ],
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.scss'
})
export class CheckoutComponent implements OnInit {
  blocks: IBlockItem[] = [];

  selectedBlock?: IBlockItem;
  amount!: FormControl;

  selectedCheckoutItemId = '';
  noBlockSelectedError = false;

  constructor(
      private databaseService: DatabaseService,
      private loaderService: LoaderService,
      private userService: UserService,
      private router: Router,
      private translate: TranslateService,
      private checkOutService: CheckoutService,
  ) {
  }

  async ngOnInit() {
    this.userService.getUserData();
    this.databaseService.getBlocks();

    this.databaseService.blocks.subscribe(blocks => {
      this.blocks = blocks.sort((a, b) => a.order - b.order);
      this.blocks.pop(); // remove PDD block
    })

    setTimeout(() => {
      this.loaderService.loading$.next(false);
    }, 1500)
    this.amount = new FormControl(1000, [Validators.required, Validators.min(1000)]);
  }

  onSelectBlock(block: IBlockItem) {
    this.selectedBlock = block;
    this.noBlockSelectedError = false;
  }

  checkout(): void {
    if (!this.userService.user$.value) {
      this.router.navigate(['/login']).then();
      return;
    }
      let widget = new (window as any).tiptop.Widget();
      widget.pay('charge',
        {
          publicId: 'pk_33854c56351078e1f6228901bfd9d', //TODO: id из личного кабинета  pk_33854c56351078e1f6228901bfd9d
          description: `Пополнение баланса на сайте online-exam.com, для программы ${this.translate.instant(this.selectedBlock!.title.toString())}`,
          amount: this.amount.value,
          currency: 'KZT',
          accountId: `${this.userService.auth.currentUser?.uid}`, //идентификатор плательщика (необязательно)
          email: `${this.userService.auth.currentUser?.email}`, //email плательщика (необязательно)
          skin: "mini",
          autoClose: 3,
        },
        {
          onSuccess: () => {
            this.checkOutService.generateCheck(this.amount.value, this.userService.auth!.currentUser?.email as string, this.translate.instant(this.selectedBlock!.title.toString()))
            this.onCheckoutSuccess();
          },
          onFail: function () { // fail
            //действие при неуспешной оплате
          },
        }
      )
    };

  onCheckoutSuccess() {
    this.loaderService.loading$.next(true);
    const amount = this.amount.value;
    const blockId = this.selectedBlock?.id;

    if (blockId) {
      this.userService.user$.pipe(first()).subscribe(async u => {
        (u)!.balances[blockId].amount += amount;
        (u)!.balances[blockId].expirationDate = this.getExpirationDate();

        await this.userService.updateUserData('balances', u!.balances);
        this.router.navigate([`test/${blockId}`]).then(() => {
          localStorage.removeItem('selectedProgram');
        });
      })
     }
  }

  getExpirationDate(): any {
    const now = dayjs();
    const futureDate = now.add(2, 'month');
    const formattedDate = futureDate.format('YYYY-MM-DD HH:mm:ss');
    const dateInSeconds = dayjs(formattedDate).unix();
    return { seconds: dateInSeconds };
  }
}
