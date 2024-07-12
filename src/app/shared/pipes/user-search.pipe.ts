import { Pipe, PipeTransform } from '@angular/core';
import {IUser} from "../models/user.model";

@Pipe({
  name: 'userSearch',
  standalone: true
})
export class UserSearchPipe implements PipeTransform {

  transform(users: IUser[], value: string): IUser[] {
    return users.filter(user => user.email.toLowerCase().includes(value.toLowerCase()));
  }
}
