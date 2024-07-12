import {Component, OnInit} from '@angular/core';
import {DatabaseService} from "../../shared/services/database.service";
import {LoaderService} from "../../shared/services/loader.service";
import {IBlockItem} from "../../shared/models/exam.model";
import {TranslateModule} from "@ngx-translate/core";
import {UserService} from "../../shared/services/user.service";
import dayjs from 'dayjs';
import {Router} from "@angular/router";
import {first} from "rxjs";

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [
    TranslateModule
  ],
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.scss'
})
export class CheckoutComponent implements OnInit {

  checkoutItems: any[] = [];
  blocks: IBlockItem[] = [];

  selectedBlock?: IBlockItem;

  selectedCheckoutItemId = '';
  noBlockSelectedError = false;

  constructor(
      private databaseService: DatabaseService,
      private loaderService: LoaderService,
      private userService: UserService,
      private router: Router
  ) {
  }

  async ngOnInit() {
    this.userService.getUserData();
    this.databaseService.getBlocks();

    this.checkoutItems = (await this.databaseService.getCheckoutItems() as any[]).sort((a, b) => a.price - b.price);

    this.databaseService.blocks.subscribe(blocks => {
      this.blocks = blocks.sort((a, b) => a.order - b.order);
      this.blocks.pop(); // remove PDD block
    })

    setTimeout(() => {
      this.loaderService.loading$.next(false);
    }, 1500)
  }

  onSelectBlock(block: IBlockItem) {
    this.selectedBlock = block;
    this.noBlockSelectedError = false;
  }

  onSelectCard(id: string) {
    this.userService.user$.pipe(first()).subscribe(u => {
      if (u) {
        if (this.selectedBlock) {
          this.selectedCheckoutItemId = id; //TODO: this will be get from afterpayment queryParams, remove in future
          localStorage.setItem('selectedProgram', this.selectedBlock!.id);

          this.onCheckoutSuccess();
        } else {
          this.noBlockSelectedError = true;
        }
      } else {
        this.router.navigate(['/login']).then();
      }
    })

  }

  onCheckoutSuccess() {
    this.loaderService.loading$.next(true);
    const amount = this.checkoutItems.find(item => item.id === this.selectedCheckoutItemId).price;
    const blockId = localStorage.getItem('selectedProgram');

   if (blockId) {
     this.userService.user$.pipe(first()).subscribe(async u => {
       // @ts-ignore
       (u)!.balances[blockId].amount += amount;
       // @ts-ignore
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
