import {Injectable} from '@angular/core';
import {telegramConfig} from '../../../assets/telegram.config';
import {HttpClient} from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})

export class TelegramApiService {
  public config = telegramConfig;
  API = `https://api.telegram.org`;

  constructor( private http: HttpClient ) {}

  sendMessage(msg: any): any {
    const token = this.config.token;
    const chatID = this.config.chatID;
    let message = `Оплата: %0A`;
    if (msg && msg.name) { message += `<b>Имя:</b> ${msg.name} %0A`; }
    if (msg && msg.email) { message += `<b>Email:</b> ${msg.email} %0A`; }
    if (msg && msg.product) { message += `<b>ID продукта:</b> ${msg.product} %0A`; }
    if (msg && msg.amount) { message += `<b>Сумма:</b> ${msg.amount}`; }
    return this.http.post<any>(`${this.API}/bot${token}/sendMessage?chat_id=${chatID}&parse_mode=html&text=${message}`, 'r');
  }
}
