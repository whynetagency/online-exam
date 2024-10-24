import { Injectable } from "@angular/core";

@Injectable({
  providedIn: 'root',
})
export class CheckoutService {
  constructor() {

  }

  generateCheck(amount: number, email: string, blockName: string): void {
    const receiptData = {
      "Inn": "870307450031", // ИИН/БИН
      "Type": "Income", // Признак расчета
      "CustomerReceipt": {
        "Items": // Товарные позициии
        [
          {
            "label": blockName, // Наименование товара или услуги
            "price": amount, // Цена
            "quantity": 1.00, // Количество
            "amount": amount, // Сумма
            "vat": 0, // Ставка НДС
            "measurementUnit": "шт" // Единица измерения
          },
        ],
        "calculationPlace": "www.online-exam.kz", //Место осуществления расчёта
        "taxationSystem": 0, // Система налогообложения; необязательный, если у вас одна система налогообложения
        "email": email, // e-mail покупателя, если нужно отправить письмо с чеком
        "isBso": false, // Чек является бланком строгой отчётности
        "amounts": {
          "electronic": amount, // Сумма оплаты электронными деньгами
        },
      }
    }

    const publicId = 'pk_33854c56351078e1f6228901bfd9d';
    const apiSecret = 'd27e289a0eb5f0d0f97476dabea2a783';

    // Base64
    const headers = new Headers();
    const authString = btoa(`${publicId}:${apiSecret}`);

    headers.append('Authorization', `Basic ${authString}`);
    headers.append('Content-Type', 'application/json');

    fetch('https://satoshi-cors.herokuapp.com/https://api.tiptoppay.kz/kkt/receipt', {
      method: 'POST',
      headers,
      body: JSON.stringify(receiptData),
    }).then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    })
      .then(data => {
        console.log('Чек успешно згенерировано:', data);
      })
      .catch((error) => {
        console.error('Ошибка при генерации чека:', error);
      });
  }
}
