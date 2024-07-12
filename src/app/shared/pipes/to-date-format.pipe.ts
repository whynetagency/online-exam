import { Pipe, PipeTransform } from '@angular/core';
import {DatePipe} from "@angular/common";

@Pipe({
  name: 'toDateFormat',
  standalone: true
})

export class ToDateFormatPipe implements PipeTransform {

  transform(value: any, type?: string): string | null {
    const timestamp = value.seconds * 1000;
    const formattedDate = new Date(timestamp);

    const datePipe = new DatePipe('en-US');
    return type === 'short' ? datePipe.transform(formattedDate, 'd.MM.yy') : datePipe.transform(formattedDate, 'd.MM.yy, HH:mm');
  }

}
