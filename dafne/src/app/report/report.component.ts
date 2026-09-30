import { AfterViewInit, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthenticationService } from '@app/services/authentication.service';
import { MessageService } from '@app/services/message.service';
import { ReportService } from '../services/report.service';
//import { AlertComponent } from '@app/alert/alert.component';
import { AlertService } from '../services/alert.service';
import { DateService } from '../services/date.service';
import { Centre } from '@app/models/models';
import { ReactiveFormsModule, FormsModule, Validators, FormGroup, FormControl } from '@angular/forms';

const updateValidationAction: any = 'change';

@Component({
  selector: 'app-report',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule
  ],
  templateUrl: './report.component.html',
  styleUrl: './report.component.scss'
})
export class ReportComponent implements AfterViewInit{
  public reportPeriodList = [
    "Week", "Month", "Year", "Custom"
  ];
  public currentYear: number = new Date().getFullYear();
  public lastYear: number = this.currentYear - 1;
  public reportWeekList = Array.from({ length: 53 }, (_, i) => i + 1);
  public reportMonthList = Array.from({ length: 12 }, (_, i) => i + 1);
  public reportYearList = [
    {year: this.currentYear - 2, disabled: false},
    {year: this.currentYear - 1, disabled: false},
    {year: this.currentYear, disabled: false}
  ];
  public selectedReportPeriod = this.reportPeriodList[0];
  private millisPerDay: number = 86400000;
  private maxDays: number = 6;  // set 30 for 31 days of period.
  private millisPerMaxPeriod = this.millisPerDay * this.maxDays;
  private today = new Date();
  public todayDate: string = this.today.toISOString().slice(0, 10);
  private initialStartDayMillis = Date.parse(this.todayDate) - this.millisPerMaxPeriod;
  private startDateTemp = new Date(this.initialStartDayMillis);
  public startDate: string = this.startDateTemp.toISOString().slice(0, 10);
  public stopDate: string = this.todayDate;
  private minDate: Date = new Date(Date.UTC(this.today.getFullYear() - 2, 0, 1));
  public minDateStr: string = this.minDate.toISOString().slice(0, 10);
  public lastWeek: number = -1;
  public lastMonth: number = -1;
  public maxWeekNumber: number = 53;
  public maxMonthNumber: number = 12;

  public reportList: any = {};
  private reportListPrec: any = {};
  private firstTimeLoadingReport: boolean = true;
  public reportGenerationResultMessage: string = "";
  public reportsFolderName = "";

  private ndLocalCentre: Centre = {
      id: -1,
      name: "N/D",
      latitude: "0.0",
      longitude: "0.0",
      local: true,
      icon: "home",
      color: "#555",
      description: ''
    };
  private localCentre: Centre = this.ndLocalCentre;

  generateReportForm: FormGroup = new FormGroup({
    reportStartDate: new FormControl(null, {
      validators: [],
      updateOn: updateValidationAction
    }),
    reportStopDate: new FormControl(null, {
      validators: [],
      updateOn: updateValidationAction
    }),
    chooseReportPeriod: new FormControl("Week", {
      validators: [],
      updateOn: updateValidationAction
    }),
    selectWeekNumber: new FormControl(null, {
      validators: [],
      updateOn: updateValidationAction
    }),
    selectMonthNumber: new FormControl(null, {
      validators: [],
      updateOn: updateValidationAction
    }),
    selectYearNumber: new FormControl(null, {
      validators: [],
      updateOn: updateValidationAction
    })
  });

  constructor(
    private authenticationService: AuthenticationService,
    private messageService: MessageService,
    private reportService: ReportService,
    //private alert: AlertComponent,
    private dateService: DateService,
    private alert: AlertService
  ) {}

  ngAfterViewInit(): void {
    //this.getLocalCentre();
    this.messageService.refreshLocalMessage.subscribe(() => {
      this.getLocalCentre();
    });
    this.messageService.loginMessage.subscribe(() => {
      this.getLocalCentre();
    });
    this.messageService.reportCurrentMessage.subscribe(show => {
      //show = true;
      if (show) {
        this.showReportModal();
      } else {
        this.onClosePressed();
      }
    });

    this.lastWeek = this.dateService.getWeekNumber(new Date().toString()) - 1;
    this.lastMonth = this.dateService.getMonthNumber(new Date().toString()) - 1;
    //console.log("this.lastWeek: ", this.lastWeek);
    if (this.lastWeek == 0) {
      this.lastWeek = this.maxWeekNumber;
      this.generateReportForm.get('selectYearNumber')?.setValue(this.lastYear);
    }
    //console.log("this.lastMonth: ", this.lastMonth);
    if (this.lastMonth == 0) {
      this.lastMonth = this.maxMonthNumber;
      this.generateReportForm.get('selectYearNumber')?.setValue(this.lastYear);
    }
    this.setDefaultYearReportDates();
    this.setDefaultMonthReportDates();
    this.setDefaultWeekReportDates();

    let selectYearContainer = document.querySelector('#select-year-container');
    this.generateReportForm.get('selectYearNumber')?.setValidators([
      Validators.required,
      Validators.min(this.lastYear -1),
      Validators.max(this.currentYear)
    ]);
    this.generateReportForm.get('selectYearNumber')?.updateValueAndValidity;

    let startDayEl: HTMLInputElement = <HTMLInputElement>document.querySelector('#start-date');
    let stopDayEl: HTMLInputElement = <HTMLInputElement>document.querySelector('#stop-date');
    startDayEl.disabled = true;
    stopDayEl.disabled = true;
  }

  isAdmin() {
    return this.authenticationService.currentUser.isAdmin;
  }

  async getLocalCentre() {
    if (await this.authenticationService.isUserAuthenticated()) {
      this.authenticationService.getAllCentres().subscribe(
        (res: object) => {
          if (Object.values(res).filter((x) => x.local == true)[0]) {
            this.localCentre = Object.values(res).filter((x) => x.local == true)[0];
          } else {
            this.localCentre = this.ndLocalCentre;
          }
        }
      );
    } else {
      this.localCentre = this.ndLocalCentre;
    }
  }

  checkReportListDifference(currList: any, precList: any) {
    currList.contents.forEach((yearFolderObj: any) => {

      // For each YEAR folder:
      if (yearFolderObj.name === 'custom_reports') {
        const custContentLength = yearFolderObj.contents.length;
        let precCustObjArr = precList.contents.filter((precYearFolder: any) => precYearFolder.name === yearFolderObj.name);
        if (precCustObjArr) {
          let precCustReportNamesList = [];
          let newReports = false;
          if (precCustObjArr.length > 0) {
            if (precCustObjArr[0].contents.length < custContentLength) {
              precCustReportNamesList = precCustObjArr[0].contents.map((obj: any) => obj.name);
              newReports = true;
            }
          } else {
            newReports = true;
          }

          if (newReports) {
            yearFolderObj.contents.forEach((custContentObj: any) => {
              if (!precCustReportNamesList.includes(custContentObj.name)) {
                // There is a new report:
                custContentObj.isNew = true;
                setTimeout(() => {
                  const reportsContainerEl = document.querySelector('.form-reports-files');
                  if (reportsContainerEl) {
                    const mainFolderEl = [...reportsContainerEl.querySelectorAll('.caret')].find(el => el.textContent?.trim() === currList.name);
                    if (mainFolderEl) {
                      const mainFolderListEl = mainFolderEl.nextElementSibling;
                      if (mainFolderListEl) {
                        mainFolderListEl.classList.add('active');
                        mainFolderEl.classList.add("caret-down");
                        setTimeout(() => {
                          const custFolderEl = [...mainFolderListEl.querySelectorAll('.caret')].find(el => el.textContent?.trim() === this.rewriteFolderName(yearFolderObj.name));
                          if (custFolderEl) {
                            const custFolderListEl = custFolderEl.nextElementSibling;
                            if (custFolderListEl) {
                              custFolderListEl.classList.add('active');
                              custFolderEl.classList.add("caret-down");
                              const custReportEl: HTMLElement | null = custFolderListEl.querySelector('.new-report');
                              if (custReportEl) {
                                custReportEl.scrollIntoView({ behavior: "smooth", block: "center" });
                              }
                            }
                          }
                        }, 10);
                      }
                    }
                  }
                }, 10);
              }
            });
          }
        }

      } else {
        // Each YEAR folder != custom:
        yearFolderObj.contents.forEach((periodFolderObj: any) => {

          // For each period folder:
          const periodContentLength = periodFolderObj.contents.length;
          const precYearObjArr = precList.contents.filter((precYearFolder: any) => precYearFolder.name === yearFolderObj.name);
          if (precYearObjArr) {
            let precPeriodFolderObjArr = [];
            if (precYearObjArr.length > 0) {
              precPeriodFolderObjArr = precYearObjArr[0].contents.filter((precPeriodFolder: any) => precPeriodFolder.name === periodFolderObj.name);
            }
            if (precPeriodFolderObjArr) {
              // There is a new report:
              let precPeriodReportNamesList = [];
              let newReports = false;
              if (precPeriodFolderObjArr.length > 0) {
                if (precPeriodFolderObjArr[0].contents.length < periodContentLength) {
                  precPeriodReportNamesList = precPeriodFolderObjArr[0].contents.map((obj: any) => obj.name);
                  newReports = true;
                }
              } else {
                newReports = true;
              }

              if (newReports) {
                periodFolderObj.contents.forEach((periodContentObj: any) => {
                  if (!precPeriodReportNamesList.includes(periodContentObj.name)) {
                    periodContentObj.isNew = true;
                    setTimeout(() => {
                      const reportsContainerEl = document.querySelector('.form-reports-files');
                      if (reportsContainerEl) {
                        const mainFolderEl = [...reportsContainerEl.querySelectorAll('.caret')].find(el => el.textContent?.trim() === currList.name);
                        if (mainFolderEl) {
                          const mainFolderListEl = mainFolderEl.nextElementSibling;
                          if (mainFolderListEl) {
                            mainFolderListEl.classList.add('active');
                            mainFolderEl.classList.add("caret-down");
                            setTimeout(() => {
                              //console.log("yearFolderObj.name: ", this.rewriteFolderName(yearFolderObj.name));
                              const yearFolderEl = [...mainFolderListEl.querySelectorAll('.caret')].find(el => el.textContent?.trim() === this.rewriteFolderName(yearFolderObj.name));
                              //console.log("yearFolderEl: ", yearFolderEl);
                              if (yearFolderEl) {
                                const yearFolderListEl = yearFolderEl.nextElementSibling;
                                if (yearFolderListEl) {
                                  yearFolderListEl.classList.add('active');
                                  yearFolderEl.classList.add("caret-down");
                                  setTimeout(() => {
                                    //console.log("yearFolderObj.name: ", this.rewriteFolderName(yearFolderObj.name));
                                    const periodFolderEl = [...yearFolderListEl.querySelectorAll('.caret')].find(el => el.textContent?.trim() === periodFolderObj.name);
                                    //console.log("periodFolderEl: ", periodFolderEl);
                                    if (periodFolderEl) {
                                      const periodFolderListEl = periodFolderEl.nextElementSibling;
                                      if (periodFolderListEl) {
                                        periodFolderListEl.classList.add('active');
                                        periodFolderEl.classList.add("caret-down");
                                        const periodReportEl: HTMLElement | null = periodFolderListEl.querySelector('.new-report');
                                        if (periodReportEl) {
                                          periodReportEl.scrollIntoView({ behavior: "smooth", block: "center"});
                                        }
                                      }
                                    }
                                  }, 10);
                                }
                              }
                            }, 10);
                          }
                        }
                      }
                    }, 10);
                  }
                });
              }
            }
          }
        });
      }
    });
  }

  onToggleClick(event: any) {
    const el = event.currentTarget as HTMLElement;
    el.parentElement?.querySelector(".nested")?.classList.toggle("active");
    el.classList.toggle("caret-down");
  }

  updateReportFileStructure() {
    // Get report file structure from Back-End
    this.reportService.getReportFileStructure().subscribe({
      next: (res) => {
        if (!this.firstTimeLoadingReport) {
          this.reportListPrec = this.reportList;
        }
        this.reportList = res;
        if (this.firstTimeLoadingReport) {
          this.reportListPrec = this.reportList;
          this.firstTimeLoadingReport = false;
        }
        //console.log("DEV - Got report file structure: ", this.reportList);
        //console.log("DEV - this.reportListPrec: ", this.reportListPrec);
        this.checkReportListDifference(this.reportList, this.reportListPrec);

        // Set file structure list behaviour
        setTimeout(() => {
          let togglerList = document.querySelectorAll(".caret");
          for (let i = 0; i < togglerList.length; i++) {
            // Set roll/unroll event on click:
            togglerList[i].removeEventListener('click', this.onToggleClick);
            togglerList[i].addEventListener("click", this.onToggleClick);
          }
        }, 50);
      },
      error: (err) => {
        console.log("Error getting report file structure from Back-End: ", err);
      }
    });
  }

  setDefaultWeekReportDates() {
    this.generateReportForm.get('selectWeekNumber')?.setValue(this.rewritePeriodNumber(this.lastWeek));
    if (this.lastWeek == this.maxWeekNumber) {
      this.generateReportForm.get('selectYearNumber')?.setValue(this.currentYear - 1);
    } else {
      this.generateReportForm.get('selectYearNumber')?.setValue(this.currentYear);
    }
    this.updateWeekDays(this.lastWeek, this.currentYear);
  }
  setDefaultMonthReportDates() {
    this.generateReportForm.get('selectMonthNumber')?.setValue(this.rewritePeriodNumber(this.lastMonth));
    if (this.lastMonth == this.maxMonthNumber) {
      this.generateReportForm.get('selectYearNumber')?.setValue(this.currentYear - 1);
    } else {
      this.generateReportForm.get('selectYearNumber')?.setValue(this.currentYear);
    }
    this.updateMonthDays(this.lastMonth, this.currentYear);
  }
  setDefaultYearReportDates() {
    this.generateReportForm.get('selectYearNumber')?.setValue(this.lastYear);
    this.updateYearDays(this.lastYear);
  }
  setDefaultCustomReportDates() {
    this.updateWeekDays(this.lastWeek, this.lastWeek == this.maxWeekNumber ? this.currentYear - 1 : this.currentYear);
  }

  updateWeekDays(week: number, year: number) {
    this.generateReportForm.get('reportStartDate')?.setValue(this.dateService.getFirstDayOfWeek(week, year).toISOString().split('T')[0]);
    this.generateReportForm.get('reportStopDate')?.setValue(this.dateService.getLastDayOfWeek(week, year).toISOString().split('T')[0]);
  }
  updateMonthDays(month: number, year: number) {
    this.generateReportForm.get('reportStartDate')?.setValue(this.dateService.getFirstDayOfMonth(month, year).toISOString().split('T')[0]);
    this.generateReportForm.get('reportStopDate')?.setValue(this.dateService.getLastDayOfMonth(month, year).toISOString().split('T')[0]);
  }
  updateYearDays(year: number) {
    this.generateReportForm.get('reportStartDate')?.setValue(this.dateService.getFirstDayOfMonth(1, year).toISOString().split('T')[0]);
    this.generateReportForm.get('reportStopDate')?.setValue(this.dateService.getLastDayOfMonth(12, year).toISOString().split('T')[0]);
  }
  onChooseReportPeriodChange() {
    this.selectedReportPeriod = this.generateReportForm.controls['chooseReportPeriod'].value;
    let selectWeekContainer = document.querySelector('#select-week-container');
    let selectMonthContainer = document.querySelector('#select-month-container');
    let selectYearContainer = document.querySelector('#select-year-container');
    let yearEl: HTMLSelectElement = (<HTMLSelectElement>selectYearContainer?.querySelector('#choose-report-year'));
    switch (this.selectedReportPeriod) {
      case this.reportPeriodList[0]: // Week
        selectWeekContainer?.classList.remove('hidden');
        selectMonthContainer?.classList.add('hidden');
        selectYearContainer?.classList.remove('hidden');
        this.reportYearList.forEach(yearEl => {
          yearEl.disabled = false;
        });
        this.generateReportForm.get('selectYearNumber')?.setValidators([
          Validators.required,
          Validators.min(this.lastYear -1),
          Validators.max(this.currentYear)
        ]);
        this.generateReportForm.get('selectYearNumber')?.updateValueAndValidity;
        yearEl.disabled = false;
        this.generateReportForm.get('reportStartDate')?.disable();
        this.generateReportForm.get('reportStopDate')?.disable();
        this.setDefaultWeekReportDates();
        break;
      case this.reportPeriodList[1]: // Month
        selectWeekContainer?.classList.add('hidden');
        selectMonthContainer?.classList.remove('hidden');
        selectYearContainer?.classList.remove('hidden');
        this.reportYearList.forEach(yearEl => {
          yearEl.disabled = false;
        });
        this.generateReportForm.get('selectYearNumber')?.setValidators([
          Validators.required,
          Validators.min(this.lastYear -1),
          Validators.max(this.currentYear)
        ]);
        this.generateReportForm.get('selectYearNumber')?.updateValueAndValidity;
        yearEl.disabled = false;
        this.generateReportForm.get('reportStartDate')?.disable();
        this.generateReportForm.get('reportStopDate')?.disable();
        this.setDefaultMonthReportDates();
        break;
      case this.reportPeriodList[2]: // Year
        selectWeekContainer?.classList.add('hidden');
        selectMonthContainer?.classList.add('hidden');
        selectYearContainer?.classList.remove('hidden');
        this.reportYearList[2].disabled = true;
        this.generateReportForm.get('selectYearNumber')?.setValidators([
          Validators.required,
          Validators.min(this.lastYear -1),
          Validators.max(this.lastYear)
        ]);
        this.generateReportForm.get('selectYearNumber')?.updateValueAndValidity;
        yearEl.disabled = false;
        this.generateReportForm.get('reportStartDate')?.disable();
        this.generateReportForm.get('reportStopDate')?.disable();
        this.setDefaultYearReportDates();
        break;
      case this.reportPeriodList[3]: // Custom
        selectWeekContainer?.classList.add('hidden');
        selectMonthContainer?.classList.add('hidden');
        selectYearContainer?.classList.add('hidden');
        this.generateReportForm.get('reportStartDate')?.enable();
        this.generateReportForm.get('reportStopDate')?.enable();
        this.setDefaultCustomReportDates();
        break;
    }
  }
  onReportWeekChange() {
    if (this.generateReportForm.valid) {
      const week = this.generateReportForm.controls['selectWeekNumber'].value;
      const year = this.generateReportForm.controls['selectYearNumber'].value;
      this.updateWeekDays(week, year);
    } else {
      //console.log("Form is not valid!");
    }
  }
  onReportMonthChange() {
    if (this.generateReportForm.valid) {
      const month = this.generateReportForm.controls['selectMonthNumber'].value;
      const year = this.generateReportForm.controls['selectYearNumber'].value;
      this.updateMonthDays(month, year);
    } else {
      //console.log("Form is not valid!");
    }
  }
  onReportYearChange() {
    if (this.generateReportForm.valid) {
      const year = this.generateReportForm.controls['selectYearNumber'].value;
      switch (this.selectedReportPeriod) {
        case this.reportPeriodList[0]:  // Week
          const week = this.generateReportForm.controls['selectWeekNumber'].value;
          this.updateWeekDays(week, year);
          break;
        case this.reportPeriodList[1]:  // Month
          const month = this.generateReportForm.controls['selectMonthNumber'].value;
          this.updateMonthDays(month, year);
          break;
        case this.reportPeriodList[2]:  // Year
          this.updateYearDays(year);
          break;
        case this.reportPeriodList[3]:  // Custom
          this.updateWeekDays(this.lastWeek, this.lastWeek == this.maxWeekNumber ? this.currentYear - 1 : this.currentYear);
          break;
      }
    } else {
      //console.log("Form is not valid!");
    }
  }
  onStartDateChanged(event: any) {
    if (event.target.value < event.target.min) event.target.value = event.target.min;
    if (event.target.value > event.target.max) event.target.value = event.target.max;
    let tempStartDate = this.generateReportForm.value.reportStartDate;
    let tempStopDate = this.generateReportForm.value.reportStopDate;
    this.startDate = tempStartDate;
    //console.log("startDate: ", tempStartDate);
    let tempMillisDate: number = 0;
    if (this.selectedReportPeriod == this.reportPeriodList[3]) { // Custom
      if (this.checkStartDateToChangeYearDaysNumber(tempStartDate)) {
        this.maxDays = 365;
        //console.log("Date " + tempStartDate + " IS Leap!");
      } else {
        this.maxDays = 364;
        //console.log("Date " + tempStartDate + " is NOT Leap!");
      }

      this.millisPerMaxPeriod = this.millisPerDay * this.maxDays;
      tempMillisDate = (Date.parse(tempStartDate) + this.millisPerMaxPeriod);
      if (Date.parse(tempStopDate) > tempMillisDate) {
        console.log("Check Date Range. Please select a maximum range of 1 year");
        this.alert.showAlert("Check Date Range", "Please select a maximum range of 1 year");
        let tempDate = new Date(tempMillisDate);
        this.stopDate = tempStopDate = tempDate.toISOString().slice(0, 10);
      }
      if (Date.parse(tempStartDate) > Date.parse(tempStopDate)) {
        console.log("Check Date Range. Start date cannot be later than stop date");
        this.alert.showAlert("Check Date Range", "Start date cannot be later than stop date");
        this.stopDate = tempStopDate = tempStartDate;
      }
    }
    this.generateReportForm.patchValue({
      reportStopDate: this.stopDate
    })
  }

  onStopDateChanged(event: any) {
    if (event.target.value < event.target.min) event.target.value = event.target.min;
    if (event.target.value > event.target.max) event.target.value = event.target.max;
    let tempStartDate = this.generateReportForm.value.reportStartDate;
    let tempStopDate = this.generateReportForm.value.reportStopDate;
    this.stopDate = tempStopDate;
    if (this.selectedReportPeriod == this.reportPeriodList[3]) { // Custom
      if (this.checkStopDateToChangeYearDaysNumber(tempStopDate)) {
        this.maxDays = 365;
        //console.log("Date " + tempStartDate + " IS Leap!");
      } else {
        this.maxDays = 364;
        //console.log("Date " + tempStartDate + " is NOT Leap!");
      }
      this.millisPerMaxPeriod = this.millisPerDay * this.maxDays;
      let tempMillisDate = (Date.parse(tempStopDate) - this.millisPerMaxPeriod);
      if (Date.parse(tempStartDate) < tempMillisDate) {
        console.log("Check Date Range. Please select a maximum range of 1 year");
        this.alert.showAlert("Check Date Range", "Please select a maximum range of 1 year");
        let tempDate = new Date(tempMillisDate);
        this.startDate = tempStartDate = tempDate.toISOString().slice(0, 10);
      }
      if (Date.parse(tempStopDate) < Date.parse(tempStartDate)) {
        console.log("Check Date Range. Stop date cannot be earlier than start date");
        this.alert.showAlert("Check Date Range", "Stop date cannot be earlier than start date");
        this.startDate = tempStartDate = tempStopDate;
      }
    }
    this.generateReportForm.patchValue({
      reportStartDate: this.startDate
    });
  }

  showReportModal() {
    // Service to get the Reports folder name from back-end
    this.reportService.getReportsFolderName().subscribe({
      next: (res) => {
        this.reportsFolderName = res;
        //console.log("DEV - Received folder name: ", this.reportsFolderName);
        this.updateReportFileStructure();
        document.querySelector("#generateReportModal")!.classList.remove('hidden');
      },
      error: (err) => {
        console.log("ERROR while getting reports folder name from back end: ", err);
      }
    });
  }
  onClosePressed() {
    let modals = document.querySelectorAll('.modal');
    const reportResultEl = document.querySelector(".report-generation-status");
    reportResultEl?.classList.add('hidden');
    [].forEach.call(modals, (modal: HTMLElement) => {
      modal.classList.add('hidden');
    })
  }
  checkStartDateToChangeYearDaysNumber(strDate: string) {
    const d = new Date(strDate);
    const year = d.getFullYear();
    const limit = new Date(`${year}-02-28`);

    // 1) Leap year and date ≤ 28 feb
    if (this.isLeap(year) && d <= limit) return true;

    // 2) date > 28 feb and next year is leap
    if (d > limit && this.isLeap(year + 1)) return true;

    return false;
  }
  checkStopDateToChangeYearDaysNumber(strDate: string) {
    const d = new Date(strDate);
    const year = d.getFullYear();
    const limit = new Date(`${year}-02-28`);

    // 1) Leap year and date > 28 feb
    if (this.isLeap(year) && d > limit) return true;

    // 2) date <= 28 feb and precedent year is leap
    if (d <= limit && this.isLeap(year - 1)) return true;

    return false;
  }
  isLeap(y: number) {
    return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
  }
  onGenerateReportSubmit() {
    if (this.localCentre.id == -1) {
      this.alert.showAlert("No local Centre is set", "Please select first a local centre to generate the report");
      return;
    }
    const year = this.generateReportForm.controls['selectYearNumber'].value;
    const month = this.generateReportForm.controls['selectMonthNumber'].value;
    const week = this.generateReportForm.controls['selectWeekNumber'].value;
    const period = this.generateReportForm.controls['chooseReportPeriod'].value;
    let folder = "";
    let filenameString = "";
    switch (period) {
      case this.reportPeriodList[0]: // Week
        // '2024_W48_report.xlsx'
        folder = year + "/Weekly";
        filenameString = year + "_W" + week;
        break;
      case this.reportPeriodList[1]: // Month
        // '2024_M01_report.xlsx'
        folder = year + "/Monthly";
        filenameString = year + "_M" + month;
        break;
      case this.reportPeriodList[2]: // Year
        // '2024_annual_report.xlsx'
        folder = year + "/Annual";
        filenameString = year + "_annual_report";
        break;
      case this.reportPeriodList[3]: // Custom
        // '2025-02-23_2025-05-22_report.xlsx'
        folder = "custom_reports";
        filenameString = "_report";
        break;
      default:
        console.log("Error: wrong period selected: " + period);
        return;
    }
    console.log("Requesting generation of report for period: " + period + " - in folder: " + folder + " - using filenameString: " + filenameString);
    const rawFormValue = this.generateReportForm.getRawValue();
    //console.log("StartDate: " + rawFormValue.reportStartDate + ", StopDate: " + rawFormValue.reportStopDate);
    this.reportService.getReportJsonForPeriod(new Date(rawFormValue.reportStartDate), new Date(rawFormValue.reportStopDate), period, folder, filenameString).subscribe({
      next: (res: any) => {
        console.log("Generation response: ", res);
        const reportResultEl = document.querySelector(".report-generation-status");
        if (reportResultEl) {
          if (res.status == "error") {
            this.reportGenerationResultMessage = "&#10008; ERROR: There was an unexpected error writing the file.<br>&#9888; " + res.message[0].error + "<br><span class='report-filename'>- " + this.extractPathFromFilename(res.filename) + "</span>";
            reportResultEl.classList.remove("warning");
            reportResultEl.classList.add("error");
          } else if (res.status == "warning") {
            this.reportGenerationResultMessage = "&#9888; WARNING: The output file already exists.<br><span class='report-filename'>- " + this.extractPathFromFilename(res.filename) + "</span>";
            reportResultEl.classList.remove("error");
            reportResultEl.classList.add("warning");
          } else if (res.status == "success") {
            this.reportGenerationResultMessage = "&#10004; SUCCESS: The output file has been correctly created.<br><span class='report-filename'>- " + this.extractPathFromFilename(res.filename) + "</span>";
            reportResultEl.classList.remove("error");
            reportResultEl.classList.remove("warning");
            if (res.message && res.message.length > 0) {
              this.reportGenerationResultMessage = "&#10004; SUCCESS (with warnings): The output file has been correctly created.<br><span class='report-warning'>&#9888; " + res.message[0].error + "</span><br><span class='report-filename'>- " + this.extractPathFromFilename(res.filename) + "</span>";
            }
          }
          reportResultEl.classList.remove('hidden');
        }
      },
      error: (err: any) => {
        console.error(err);
      },
      complete: () => {
        this.updateReportFileStructure();
      }
    });
  }

  downloadReport(filename: string) {
    console.log("Downloading: ", filename);
    this.reportService.downloadReport(filename).subscribe({
      next: blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: err => {
        console.error('Download failed', err);
      }
    });
  }

  async deleteGeneratedReport(filename: string) {

    const ret = await this.alert.showConfirm("<span style='color:"+this.localCentre.color+";'>"+this.localCentre.name+"</span>", "Deleting report: <span style='color:#fff;'>"+filename+"</span><br>Are you sure?");

    //if (confirm("Deleting generated report "+ filename +".\n\nAre You Sure?")) {
    if (ret) {
      this.reportService.deleteGeneratedReport(filename).subscribe({
        next: () => {
          this.updateReportFileStructure();
          console.log("Generated report " + filename + " has been correctly deleted.");
        },
        error: (err) => {
          console.log("Error while deleting: " + filename + " generated report.");
          this.alert.showAlert("Unexpected error deleting " + filename, "Please check into back-end logs for detailed info.");
        }
      });
    }

  }

  rewritePeriodNumber(period: number) {
    return (period < 10 ? "0"+period : period);
  }

  rewriteFolderName(folderName: string) {
    return folderName
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, c => c.toUpperCase());
  }

  extractPathFromFilename(filename: string): string {
    return filename.slice(filename.lastIndexOf(this.reportsFolderName));
  }
}
