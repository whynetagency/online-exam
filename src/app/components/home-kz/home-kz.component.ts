import { Component, OnInit } from '@angular/core';
import { IBlockItem } from "../../shared/models/exam.model";
import { filter, Subject, takeUntil, tap } from "rxjs";
import { DatabaseService } from "../../shared/services/database.service";
import { LoaderService } from "../../shared/services/loader.service";
import { TranslateModule, TranslateService } from "@ngx-translate/core";
import { LanguageService } from "../../shared/services/language.service";
import { Router } from "@angular/router";

@Component({
  selector: 'app-home-kz',
  standalone: true,
  imports: [
    TranslateModule
  ],
  templateUrl: './home-kz.component.html',
  styleUrl: './home-kz.component.scss'
})
export class HomeKzComponent implements OnInit {
  blocks: IBlockItem[] = [];

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
        tap((blocks) => {
          this.blocks = blocks.sort((a, b) => a.order - b.order);
          this.loaderService.loading$.next(false);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe()

    this.languageService.getCurrentLanguageAsObservable().pipe(
      tap((lang) => {
        if (lang === 'ru') {
          this.router.navigate(['/home']);
        }
      }),
      takeUntil(this.destroy$)
    ).subscribe()
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
