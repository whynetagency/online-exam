import {Component, OnDestroy, OnInit, ViewEncapsulation} from '@angular/core';
import {TranslateModule, TranslateService} from "@ngx-translate/core";
import {DatabaseService} from "../../shared/services/database.service";
import {IBlockItem} from "../../shared/models/exam.model";
import {LoaderService} from "../../shared/services/loader.service";
import {filter, pipe, Subject, takeUntil} from "rxjs";
import {LanguageService} from "../../shared/services/language.service";
import {Router, RouterLink} from "@angular/router";

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    TranslateModule,
    RouterLink
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class HomeComponent implements OnInit, OnDestroy {

  blocks: IBlockItem[] = [];
  lg = this.translateService.currentLang;

  destroy$ = new Subject();

  constructor(
      private databaseService: DatabaseService,
      private loaderService: LoaderService,
      protected translateService: TranslateService,
      protected languageService: LanguageService,
      private router: Router
  ) {
    this.databaseService.getBlocks();
  }


  ngOnInit() {
    this.databaseService.blocks
        .pipe(
            filter((data: IBlockItem[]) => !!data.length),
            takeUntil(this.destroy$)
        )
        .subscribe(blocks => {
          this.blocks = blocks.sort((a, b) => a.order - b.order);

          this.loaderService.loading$.next(false);
        })
  }

  ngOnDestroy() {
    this.destroy$.next(true);
    this.destroy$.complete();
  }

  async onBlockSelect(id: string) {
    if (id !== 'pdd') {
      await this.router.navigate([`/test/${id}`]);
    } else {
      window.open('https://testpdd.kz/home', '_blank');
    }
  }
}
