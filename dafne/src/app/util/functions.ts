import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class Functions {
  constructor() {}

  /* Function to sort arrays of object: */
  getSortOrder(prop: any) {
    return function (a: any, b: any) {
      if (a[prop] > b[prop]) {
        return 1;
      } else if (a[prop] < b[prop]) {
        return -1;
      }
      return 0;
    }
  }
}