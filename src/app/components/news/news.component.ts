import { Component } from '@angular/core';
import { LoaderService } from "../../shared/services/loader.service";

@Component({
  selector: 'app-news',
  standalone: true,
  imports: [],
  templateUrl: './news.component.html',
  styleUrl: './news.component.scss'
})
export class NewsComponent {
  constructor(
    private loaderService: LoaderService,
  ) {
    this.loaderService.loading$.next(false);
  }
}
