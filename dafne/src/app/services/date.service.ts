import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DateService {

  constructor() { }

  getWeekNumber(date: string) {
    // Copy date to not modify original
    let d: Date = new Date(date);
    // Set to nearest Thursday: current date + 4 - current day number
    // Make Sunday's day number 7
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay()||7));
    //console.log("Date: "+d);
    // Get first day of year
    var yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
    // Calculate full weeks to nearest Thursday
    var weekNo = Math.ceil(( ( (d.getTime() - yearStart.getTime()) / 86400000) + 1)/7);
    // Return array of year and week number
    return weekNo;
  }
  getMonthNumber(date: string) {
    let d: Date = new Date(date);
    return d.getMonth() + 1;
  }
  getFirstDayOfWeek(week: number, year: number): Date {
    //console.log("Calc first day of week " + week + " of year " + year);
    // 4th Jan is always in the first week ISO
    const fourthJan = new Date(Date.UTC(year, 0, 4));

    // get day of the week (ISO: Mon=0 ... Sun=6)
    const dayOfWeek = fourthJan.getUTCDay() === 0 ? 7 : fourthJan.getUTCDay();

    // Monday of week 1
    let mondayWeek1 = new Date(fourthJan);
    mondayWeek1.setUTCDate(fourthJan.getUTCDate() - (dayOfWeek - 1));

    // Monday of the requested week
    let mondayReqWeek = new Date(mondayWeek1);
    mondayReqWeek.setUTCDate(mondayWeek1.getUTCDate() + (week - 1) * 7);
    return mondayReqWeek;
  }
  getLastDayOfWeek(week: number, year: number): Date {
    const firstDay = this.getFirstDayOfWeek(week, year); // Lunedì in UTC
    const sunday = new Date(firstDay);
    sunday.setUTCDate(firstDay.getUTCDate() + 6);   // Domenica ISO
    return sunday;
  }
  getFirstDayOfMonth(month: number, year: number): Date {
    const d: Date = new Date(Date.UTC(year, month - 1, 1));
    return d;
  }
  getLastDayOfMonth(month: number, year: number): Date {
    const d: Date = new Date(Date.UTC(year, month, 0));
    return d;
  }
}
