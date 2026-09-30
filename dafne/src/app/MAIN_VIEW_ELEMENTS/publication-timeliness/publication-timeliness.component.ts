import { Component, OnInit, ElementRef, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, Validators, FormGroup, FormControl } from '@angular/forms';
import { AuthenticationService } from '@app/services/authentication.service';
import { MessageService } from '@app/services/message.service';
import { AlertService } from '@app/services/alert.service';
import { Timeliness, DayTimeliness, Centre, Service, Producer } from '@app/models/models';
import { CsvDataService } from '@app/services/csv-data.service';
import { ConfigService } from '@app/services/config.service';
import { DateService } from '@app/services/date.service';
import p5 from 'p5';

const updateValidationAction: any = 'change';

@Component({
  selector: 'app-publication-timeliness',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule
  ],
  templateUrl: './publication-timeliness.component.html',
  styleUrl: './publication-timeliness.component.scss'
})
export class PublicationTimelinessComponent {
  filterForm: FormGroup = new FormGroup({
    filterWeekly: new FormControl(false, {
      validators: [
        Validators.required
      ],
      updateOn: updateValidationAction
    }),
    timelinessFilter: new FormControl(false, {
      validators: [
        Validators.required
      ],
      updateOn: updateValidationAction
    }),
    filterStartDate: new FormControl(null, {
      validators: [
        Validators.required
      ],
      updateOn: updateValidationAction
    }),
    filterStopDate: new FormControl(null, {
      validators: [
        Validators.required
      ],
      updateOn: updateValidationAction
    })
  })

  public p5Chart: any;

  private startDateInput: any;
  private stopDateInput: any;

  public localCentre: Centre = {
    id: -1,
    name: "",
    latitude: '',
    longitude: '',
    local: false,
    color: "#ffffff",
    icon: '',
    description: ''
  };
  private allCentres: Centre[] = [];
  public calculatedTimelinessCentre: Centre = {
    id: -1,
    name: "N/D",
    latitude: '',
    longitude: '',
    local: false,
    color: "#444",
    icon: '',
    description: ''
  };

  public timelinessDaysNumber: number = 0;
  public timelinessWeeksNumber: number = 0;
  public requestedDaysNumber: number = 0;
  public requestedWeeksNumber: number = 0;
  public timelinessDetailNumber: number = 0;
  public millisPerDay: number = 86400000;
  public millisPerWeek: number = this.millisPerDay * 7;
  public maxDays: number = 30;  // set 30 for 31 days of timeliness.
  public millisPerMaxPeriod: number = this.millisPerDay * this.maxDays;
  public maxDaysWindow: number = 0;  // this should be retrieved from BE. set 89 for 90 days.
  public millisPerMaxWindow: number = 0;
  public weekdayShift: number = 0;
  public weekdayStopShift: number = 0;
  public millisPer72Hours: number = this.millisPerDay * 3 + 1;

  public today = new Date();
  public todayDate: string = this.today.toISOString().slice(0, 10);
  public initialStartDayMillis = Date.parse(this.todayDate) - this.millisPerMaxPeriod;
  public startDateTemp = new Date(this.initialStartDayMillis);
  public startDate: string = this.startDateTemp.toISOString().slice(0, 10);
  public stopDate = this.todayDate;

  public timelinessColors: any;
  public tempSelectedFilterLabel: string = "";
  public selectedFilterLabel: string = "";
  public precWeekly_selectedFilterLabel: string = "";
  public precWeekly_requestedPublicationTimelinessList: Array<Timeliness> = [];
  public precWeekly_startDate: string = "";
  public precWeekly_stopDate: string = "";
  public precWeekly_requestedWeeksNumber: number = 0;
  public precDaily_selectedFilterLabel: string = "";
  public precDaily_requestedPublicationTimelinessList: Array<Timeliness> = [];
  public precDaily_startDate: string = "";
  public precDaily_stopDate: string = "";
  public precDaily_requestedDaysNumber: number = 0;

  public isWeekly: boolean = false;
  public askForWeekly: boolean = false;
  public firstDailySubmitted: boolean = false;
  public firstWeeklySubmitted: boolean = false;

  private heightThreshold: number = 860;
  private heightLegendThreshold: number = 670;


  public selectorText = [
    "Bar Chart",
    "Line Chart"
  ];
  public chartType: string = this.selectorText[0];
  private doResetZoom: boolean = false;
  public publicationTimelinessList: Array<Timeliness> = [];
  public publicationDetailTimelinessList: Array<DayTimeliness> = [];
  public requestedPublicationTimelinessList: Array<Timeliness> = [];
  private mouseIsOnList: Array<boolean> = [];
  public showDetailTimeliness: boolean = false;
  public timelinessDetailDate: string = "";

  // ???
  public tempSelectedFilterId: number = 0;
  public filtersList = signal<{label: Producer['name'], filter: Producer['source']['filter'], serviceUrl: Producer['source']['serviceRootUrl'], centre: string}[]>([]);


  constructor(
    private authenticationService: AuthenticationService,
    private messageService: MessageService,
    private alert: AlertService,
    private el: ElementRef,
    private csvService: CsvDataService,
    public configService: ConfigService,
    private dateService: DateService
  ) {
    this.timelinessColors = this.configService.getConfig().timelinessColors;
  }

  ngOnInit(): void {
    this.messageService.hideSidebar(true);
    window.addEventListener("resize", () => {
      this.checkWindowHeight();
    });

    this.filterForm.patchValue({
      filterStartDate: this.startDate,
      filterStopDate: this.stopDate
    });

    this.startDateInput = document.querySelector('#start-date');
    this.stopDateInput = document.querySelector('#stop-date');

    this.authenticationService.getAllCentres().subscribe({
      next: (res) => {
        this.allCentres = res;
        /* Get Local Centre */
        this.localCentre = this.allCentres.find((x: Centre) => x.local == true)!;
        if (!this.localCentre) {
          this.localCentre = {
            id: -1,
            name: "",
            latitude: '',
            longitude: '',
            local: false,
            color: "#ffffff",
            icon: '',
            description: ''
          };
          this.alert.showAlert("No local Centre has been set", "Please setup one Centre as local");
          return;
        }
        this.authenticationService.getAllServices().subscribe({
          next: (resSERV) => {
            const servicesUrls = resSERV.map((service: any) => service.service_url);
            this.authenticationService.getProducers().subscribe({
              next: (resPROD) => {
                const filteredProducers = resPROD.filter(producer => producer.source && producer.source.serviceRootUrl && servicesUrls.includes(producer.source.serviceRootUrl));
                for (const producer of filteredProducers) {
                  if (producer.source && producer.source.filter && producer.source.serviceRootUrl) {
                    const service: Service = resSERV.find((s: any) => s.service_url === producer.source.serviceRootUrl);
                    const centreName = this.allCentres.find((c: Centre) => c.id === service.centre)!.name;
                    this.filtersList.update(current => [...current, { label: producer.name, filter: producer.source.filter, serviceUrl: producer.source.serviceRootUrl, centre: centreName }]);
                  }
                }
                if (this.filtersList().length > 0) {
                  this.tempSelectedFilterLabel = this.filtersList()[0].label;
                  this.filterForm.get('timelinessFilter')?.setValue(this.tempSelectedFilterLabel);
                  this.onFilterChange();
                }

                this.authenticationService.getTimelinessRollingPeriod().subscribe(
                  (resRP: any) => {
                    this.maxDaysWindow = resRP - 1;
                    this.millisPerMaxWindow = this.millisPerDay * this.maxDaysWindow;
                    let tempMinDate = new Date(Date.parse(this.todayDate) - this.millisPerMaxWindow).toISOString().slice(0, 10);
                    this.setMinDate(this.startDateInput, tempMinDate);
                    this.setMaxDate(this.startDateInput, this.todayDate);

                    this.setMinDate(this.stopDateInput, tempMinDate);
                    this.setMaxDate(this.stopDateInput, this.todayDate);

                    this.init_P5();
                  }
                );
              },
              error: (err) => {
                console.error("Error fetching producers:", err);
              }
            });
          },
          error: (err) => {
            console.error("Error fetching services:", err);
          }
        });
      },
      error: (err) => {
        console.error("Error getting local centre while fetching publication timeliness data:", err);
      },
    });
  }

  checkWindowHeight() {
    if (window.innerHeight < this.heightThreshold) {
      this.onDataTableHide();
      if (window.innerHeight < this.heightLegendThreshold) {
        (<HTMLElement>document.querySelector('#legend-container')!).classList.add('hidden');
      } else {
        (<HTMLElement>document.querySelector('#legend-container')!).classList.remove('hidden');
      }
    } else {
      this.onDataTableShow();
    }
  }

  setMinDate(inputEl: HTMLInputElement, date: string) {
    inputEl.min = date;
  }
  setMaxDate(inputEl: HTMLInputElement, date: string) {
    inputEl.max = date;
  }

  onDataTableHide() {
    (<HTMLElement>document.querySelector('.data-table-main-container')!).classList.add('hidden');
    setTimeout(() => {
      (<HTMLElement>document.querySelector('.data-table-down-arrow-container')!).classList.add('hidden');
      (<HTMLElement>document.querySelector('.data-table-up-arrow-container')!).classList.remove('hidden');
    }, 250);
  }

  onDataTableShow() {
    (<HTMLElement>document.querySelector('.data-table-main-container')!).classList.remove('hidden');
    setTimeout(() => {
      (<HTMLElement>document.querySelector('.data-table-up-arrow-container')!).classList.add('hidden');
      (<HTMLElement>document.querySelector('.data-table-down-arrow-container')!).classList.remove('hidden');
    }, 250);
  }



  onFilterChange() {
    this.tempSelectedFilterLabel = this.filterForm.value.timelinessFilter;
    this.calculatedTimelinessCentre = this.allCentres.find((c: Centre) => c.name === this.filtersList().find(f => f.label === this.tempSelectedFilterLabel)?.centre)!;
  }

  onStartDateChanged() {
    this.startDate = this.filterForm.value.filterStartDate;
    this.stopDate = this.filterForm.value.filterStopDate;
    let tempMillisDate: number = 0;
    if (this.askForWeekly == true) {
      tempMillisDate = (Date.parse(this.startDate) + this.millisPerMaxWindow);
      if (Date.parse(this.stopDate) > tempMillisDate) {
        this.alert.showAlert("Check Date Range", "Please select a maximum range of 90 days");
        let tempDate = new Date(tempMillisDate);
        this.stopDate = tempDate.toISOString().slice(0, 10);
      }
      if (Date.parse(this.startDate) > Date.parse(this.stopDate)) {
        this.alert.showAlert("Check Date Range", "Start date cannot be later than stop date");
        this.stopDate = this.startDate;
      }
    } else {
      tempMillisDate = (Date.parse(this.startDate) + this.millisPerMaxPeriod);
      if (Date.parse(this.stopDate) > tempMillisDate) {
        this.alert.showAlert("Check Date Range", "Please select a maximum range of 31 days");
        let tempDate = new Date(tempMillisDate);
        this.stopDate = tempDate.toISOString().slice(0, 10);
      }
      if (Date.parse(this.startDate) > Date.parse(this.stopDate)) {
        this.alert.showAlert("Check Date Range", "Start date cannot be later than stop date");
        this.stopDate = this.startDate;
      }
    }
    this.filterForm.patchValue({
      filterStopDate: this.stopDate
    })
  }

  onStopDateChanged() {
    this.stopDate = this.filterForm.value.filterStopDate;
    this.startDate = this.filterForm.value.filterStartDate;
    if (this.askForWeekly == true) {
      let tempMillisDate = (Date.parse(this.stopDate) - this.millisPerMaxWindow);
      if (Date.parse(this.startDate) < tempMillisDate) {
        this.alert.showAlert("Check Date Range", "Please select a maximum range of 90 days");
        let tempDate = new Date(tempMillisDate);
        this.startDate = tempDate.toISOString().slice(0, 10);
      }
      if (Date.parse(this.stopDate) < Date.parse(this.startDate)) {
        this.alert.showAlert("Check Date Range", "Stop date cannot be earlier than start date");
        this.startDate = this.stopDate;
      }

    } else {
      let tempMillisDate = (Date.parse(this.stopDate) - this.millisPerMaxPeriod);
      if (Date.parse(this.startDate) < tempMillisDate) {
        this.alert.showAlert("Check Date Range", "Please select a maximum range of 31 days");
        let tempDate = new Date(tempMillisDate);
        this.startDate = tempDate.toISOString().slice(0, 10);
      }
      if (Date.parse(this.stopDate) < Date.parse(this.startDate)) {
        this.alert.showAlert("Check Date Range", "Stop date cannot be earlier than start date");
        this.startDate = this.stopDate;
      }
    }
    this.filterForm.patchValue({
      filterStartDate: this.startDate
    })
  }

  onWeeklyCheckboxChange() {
    var chkBox = <HTMLInputElement>document.getElementById('weekly-checkbox');
    if (chkBox.checked == true) {
      this.askForWeekly = true;
      let tempMillisDate = (Date.parse(this.stopDate) - this.millisPerMaxWindow);
      if (tempMillisDate < (Date.parse(this.todayDate) - this.millisPerMaxWindow)) {
        tempMillisDate = Date.parse(this.todayDate) - this.millisPerMaxWindow;
      }
      this.startDate = new Date(tempMillisDate).toISOString().slice(0, 10);
    } else {
      this.askForWeekly = false;
      let tempMillisDate = (Date.parse(this.stopDate) - this.millisPerMaxPeriod);
      if (tempMillisDate < (Date.parse(this.todayDate) - this.millisPerMaxWindow)) {
        tempMillisDate = Date.parse(this.todayDate) - this.millisPerMaxWindow;
      }
      this.startDate = new Date(tempMillisDate).toISOString().slice(0, 10);
    }
  }

  onFilterButtonSubmit(): void {
    this.startDate = this.filterForm.value.filterStartDate;
    this.stopDate = this.filterForm.value.filterStopDate;
    let weeklyCheckbox: HTMLInputElement = <HTMLInputElement>document.getElementById("weekly-checkbox");
    if (weeklyCheckbox.checked == true) {
      /* Weekly */
      this.firstDailySubmitted = false;
    } else {
      /* Daily */
      this.firstWeeklySubmitted = false;
    }
    this.onFilterSubmit();
  }

  onFilterSubmit(): void {
    if (this.localCentre.id == -1) {
      this.alert.showAlert("No local Centre is set", "Please setup one Centre as local");
    } else {
      this.timelinessDaysNumber = 0;
      this.timelinessWeeksNumber = 0;
      this.requestedDaysNumber = 0;
      this.requestedWeeksNumber = 0;
      let tempStopDate = new Date(this.stopDate);
      let tempStartDate = new Date(this.startDate);
      let tempTimeDifference = tempStopDate.getTime() - tempStartDate.getTime();

      let body: object = {
        "startDate": this.startDate.concat("T00:00:00"),
        "stopDate": this.stopDate.concat("T23:59:59"),
        "filterLabel": this.tempSelectedFilterLabel,
        "localUrl": this.filtersList().filter((x) => x.label == this.tempSelectedFilterLabel)[0].serviceUrl
      }
      
      let weeklyCheckbox: HTMLInputElement = <HTMLInputElement>document.getElementById("weekly-checkbox");
      if (weeklyCheckbox.checked == true) {
        /* Weekly */
        this.isWeekly = true;
        this.authenticationService.getPublicationTimelinessWeekly(this.localCentre.id, body).subscribe(
          (res) => {
            this.timelinessWeeksNumber = 0;
            if (res.centreId == this.localCentre.id) {
              this.selectedFilterLabel = this.tempSelectedFilterLabel;
              this.timelinessWeeksNumber = res.values.length;
              this.weekdayShift = (tempStartDate.getDay() == 0 ? 6 : (tempStartDate.getDay() - 1));
              this.weekdayStopShift = (tempStopDate.getDay() == 0 ? 0 : (7 - tempStopDate.getDay()));
              this.requestedWeeksNumber = Math.ceil((((tempTimeDifference + (this.weekdayShift + this.weekdayStopShift) * this.millisPerDay ) / this.millisPerDay) + 1) / 7);
              this.requestedPublicationTimelinessList = [];
              for (const valueObj of res.values) {
                if (valueObj.average_timeliness >= this.millisPer72Hours) {
                  valueObj.average_timeliness = this.millisPer72Hours;
                }
              }
              this.publicationTimelinessList = res.values;

              for (var i = 0; i < this.requestedWeeksNumber; i++) {
                this.requestedPublicationTimelinessList[i] = {
                  day: new Date(Date.parse(this.startDate) - (this.weekdayShift * this.millisPerDay) + (i * this.millisPerWeek)).toISOString().slice(0,10),
                  centre_id: -1,
                  filter_label: "",
                  average_timeliness: undefined,
                  number_of_measurements: 0,
                }
                for (var k = 0; k < this.timelinessWeeksNumber; k++) {
                  if (this.publicationTimelinessList[k].day == this.requestedPublicationTimelinessList[i].day) {
                    this.requestedPublicationTimelinessList[i] = this.publicationTimelinessList[k];
                  }
                }
              }
              this.showDetailTimeliness = false;
              this.p5Chart.setClickTimeoutId(undefined);
              this.p5Chart.windowResized();

              /* Save Last Data */
              this.precWeekly_selectedFilterLabel = this.selectedFilterLabel;
              this.precWeekly_requestedPublicationTimelinessList = this.requestedPublicationTimelinessList;
              this.precWeekly_startDate = this.startDate;
              this.precWeekly_stopDate = this.stopDate;
              this.precWeekly_requestedWeeksNumber = this.requestedWeeksNumber;
            }
            this.firstWeeklySubmitted = true;
          }
        );
      } else {
        /* Daily */
        this.isWeekly = false;
        this.authenticationService.getPublicationTimeliness(this.localCentre.id, body).subscribe(
          (res) => {
            this.timelinessDaysNumber = 0;
            if (res.centreId == this.localCentre.id) {
              this.selectedFilterLabel = this.tempSelectedFilterLabel;
              this.timelinessDaysNumber = res.values.length;
              this.requestedDaysNumber = tempTimeDifference / (1000 * 3600 * 24) + 1;
              this.requestedPublicationTimelinessList = [];
              for (const valueObj of res.values) {
                if (valueObj.average_timeliness >= this.millisPer72Hours) {
                  valueObj.average_timeliness = this.millisPer72Hours;
                }
              }
              this.publicationTimelinessList = res.values;
              console.log("this.publicationTimelinessList POST: ", this.publicationTimelinessList);

              for (var i = 0; i < this.requestedDaysNumber; i++) {
                this.requestedPublicationTimelinessList[i] = {
                  day: new Date(Date.parse(this.startDate) + (i * this.millisPerDay)).toISOString().slice(0,10),
                  centre_id: -1,
                  filter_label: "",
                  average_timeliness: undefined,
                  number_of_measurements: 0,
                }
                for (var k = 0; k < this.timelinessDaysNumber; k++) {
                  if (this.publicationTimelinessList[k].day == this.requestedPublicationTimelinessList[i].day) {
                    this.requestedPublicationTimelinessList[i] = this.publicationTimelinessList[k];
                  }
                }
              }
              this.showDetailTimeliness = false;
              this.p5Chart.setClickTimeoutId(undefined);
              this.p5Chart.windowResized();

              /* Save Last Data */
              this.precDaily_selectedFilterLabel = this.selectedFilterLabel;
              this.precDaily_requestedPublicationTimelinessList = this.requestedPublicationTimelinessList;
              this.precDaily_startDate = this.startDate;
              this.precDaily_stopDate = this.stopDate;
              this.precDaily_requestedDaysNumber = this.requestedDaysNumber;
            }
            this.firstDailySubmitted = true;
          }
        );
      }
      this.onDataTableShow();
    }
  }

  onDetailTimelinessReq(date: string) {
    /* Retrieve Detailed Day Timeliness */
    let body: object = {
      "date": date,
      "filterLabel": this.tempSelectedFilterLabel,
      "localUrl": this.filtersList().filter((x) => x.label == this.tempSelectedFilterLabel)[0].serviceUrl
    }
    
    this.authenticationService.getPublicationTimelinessDetail(this.localCentre.id, body).subscribe(
      (res) => {
        this.timelinessDetailNumber = 0;
        this.selectedFilterLabel = this.tempSelectedFilterLabel;

        if (res.centreId == this.localCentre.id) {
          this.timelinessDetailNumber = res.values.length;
          for (const valueObj of res.values) {
            if (valueObj.timeliness >= this.millisPer72Hours) {
              valueObj.timeliness = this.millisPer72Hours;
            }
          }
          this.publicationDetailTimelinessList = res.values;          
          this.showDetailTimeliness = true;
          this.p5Chart.setClickTimeoutId(undefined);
          this.p5Chart.windowResized();
        }
      }
    );
  }

  onBackToPeriodClicked() {
    if (this.showDetailTimeliness) {
      this.showDetailTimeliness = false;
      this.p5Chart.setClickTimeoutId(undefined);
      this.p5Chart.windowResized();
      (<HTMLInputElement>document.getElementById("weekly-checkbox")).checked = false;
    }
  }

  onBackToDailyClicked() {
    this.showDetailTimeliness = false;
    this.askForWeekly = false;
    this.isWeekly = false;
    this.selectedFilterLabel = this.precDaily_selectedFilterLabel;
    this.tempSelectedFilterLabel = this.selectedFilterLabel;
    this.filterForm.get('timelinessFilter')?.setValue(this.tempSelectedFilterLabel);
    this.requestedPublicationTimelinessList = this.precDaily_requestedPublicationTimelinessList;
    this.startDate = this.precDaily_startDate;
    this.stopDate = this.precDaily_stopDate;
    this.requestedDaysNumber = this.precDaily_requestedDaysNumber;
    (<HTMLInputElement>document.getElementById("weekly-checkbox")).checked = false;
    this.p5Chart.setClickTimeoutId(undefined);
    this.p5Chart.windowResized();
  }

  onBackToWeeklyClicked() {
    this.showDetailTimeliness = false;
    this.askForWeekly = true;
    this.isWeekly = true;
    this.selectedFilterLabel = this.precWeekly_selectedFilterLabel;
    this.tempSelectedFilterLabel = this.selectedFilterLabel;
    console.log("this.tempSelectedFilterLabel: ", this.tempSelectedFilterLabel);
    this.filterForm.get('timelinessFilter')?.setValue(this.tempSelectedFilterLabel);
    this.requestedPublicationTimelinessList = this.precWeekly_requestedPublicationTimelinessList;
    this.startDate = this.precWeekly_startDate;
    this.stopDate = this.precWeekly_stopDate;
    this.requestedWeeksNumber = this.precWeekly_requestedWeeksNumber;
    (<HTMLInputElement>document.getElementById("weekly-checkbox")).checked = true;
    this.p5Chart.setClickTimeoutId(undefined);
    this.p5Chart.windowResized();
  }
  
  onResetZoomClicked() {
    this.p5Chart.resetZoom();
  }

  chartChangeTo(type: string) {
    this.chartType = type;
    this.doResetZoom = true;
  }

  onChartSidebarClick(event: Event) {
    event.stopPropagation();
  }

  saveAsCSV() {
    if (this.showDetailTimeliness) {
      /* Export Detail Timeliness */
      if (this.publicationDetailTimelinessList.length > 0) {
        var csvContent: string = '';
        var table = <HTMLTableElement>document.getElementById('data-table');
        for (var h = 0; h < table.tHead!.childElementCount; h++) {
          csvContent += table.tHead!.children[h].textContent;
          if (h != table.tHead!.childElementCount - 1) csvContent += ',';
        }
        csvContent += '\n';
        for (var r = 0; r < table.rows.length; r++) {
          for (var c = 0; c < table.rows[r].cells.length; c++) {
            csvContent += table.rows[r].cells[c].innerText;
            if (!(c == (table.rows[r].childElementCount - 1) && r == (table.childElementCount - 1))) csvContent += ',';
          }
          r < (table.childElementCount - 1) ? csvContent += '\n' : null;
        }
        this.csvService.exportToCsv(
          'DAFNE-Publication_Detail_Timeliness('
          + this.localCentre.name
          + ')_ProducerRef('
          + this.selectedFilterLabel 
          + ')_Date('
          + this.timelinessDetailDate
          + ').csv', csvContent
        );
      }
    } else {
      if (this.isWeekly == true) {
        /* Export Weekly Timeliness */
        if (this.requestedPublicationTimelinessList.length > 0) {
          var csvContent: string = '';
          var table = <HTMLTableElement>document.getElementById('data-table');
          for (var h = 0; h < table.tHead!.childElementCount; h++) {
            csvContent += table.tHead!.children[h].textContent;
            if (h != table.tHead!.childElementCount - 1) csvContent += ',';
          }
          csvContent += '\n';
          for (var r = 0; r < table.rows.length; r++) {
            for (var c = 0; c < table.rows[r].cells.length; c++) {
              csvContent += table.rows[r].cells[c].innerText;
              if (!(c == (table.rows[r].childElementCount - 1) && r == (table.childElementCount - 1))) csvContent += ',';
            }
            r < (table.childElementCount - 1) ? csvContent += '\n' : null;
          }          

          this.csvService.exportToCsv(
            'DAFNE-Publication_Weekly_Timeliness('
            + this.localCentre.name
            + ')_ProducerRef('
            + this.selectedFilterLabel 
            + ')_From('
            + this.startDate
            + ')_To('
            + this.stopDate
            + ').csv', csvContent
          );
        }
      } else {
        /* Export Daily Timeliness */
        if (this.requestedPublicationTimelinessList.length > 0) {
          var csvContent: string = '';
          var table = <HTMLTableElement>document.getElementById('data-table');
          for (var h = 0; h < table.tHead!.childElementCount; h++) {
            csvContent += table.tHead!.children[h].textContent;
            if (h != table.tHead!.childElementCount - 1) csvContent += ',';
          }
          csvContent += '\n';
          for (var r = 0; r < table.rows.length; r++) {
            for (var c = 0; c < table.rows[r].cells.length; c++) {
              csvContent += table.rows[r].cells[c].innerText;
              if (!(c == (table.rows[r].childElementCount - 1) && r == (table.childElementCount - 1))) csvContent += ',';
            }
            r < (table.childElementCount - 1) ? csvContent += '\n' : null;
          }          

          this.csvService.exportToCsv(
            'DAFNE-Publication_Daily_Timeliness('
            + this.localCentre.name
            + ')_ProducerRef('
            + this.selectedFilterLabel 
            + ')_From('
            + this.startDate
            + ')_To('
            + this.stopDate
            + ').csv', csvContent
          );
        }
      }
    }
  }

  init_P5() {
    let canvas = document.getElementById("p5PublicationTimelinessCanvas")!;
    if (!canvas) return;
    let canvasSpace;
    let canvasWidth = canvas.clientWidth;
    let canvasHeight = canvas.clientHeight;

    this.p5Chart = new p5(p => {
      let blankXDim = 180;
      let blankYDim = 160;
      let xCenter = canvasWidth / 2;
      let yCenter = canvasHeight / 2;
      let chartXDim = canvasWidth - blankXDim;
      let chartYDim = canvasHeight - blankYDim;
      let chartXDim2 = chartXDim / 2;
      let chartYDim2 = chartYDim / 2;
      let nLines = 4;

      let backgroundColor = p.color('#12222f');
      let labelBackgroundColor = p.color('#12222fcc')
      let lineColor = p.color('#aaaaaa');
      let valuesColor = p.color(200);
      let dateFontSize = 10;
      let valueFontSize = 14;

      let barGapScale = 30.0;
      let sectionScaleSingle = 1.4;
      let maxValue = 100;

      let sf = 1.0;
      let tx = 0;
      let ty = 0;

      let clickTimerId: any;

      p.setup = () => {
        canvasSpace = p.createCanvas(canvasWidth, canvasHeight).parent('p5PublicationTimelinessCanvas');
        p.pixelDensity(1.0);
        p.smooth();
        p.frameRate(30);
        p.textFont('NotesESA-Reg');
        canvasSpace.mouseWheel((e: any) => wheelZoom(e));
        canvasSpace.doubleClicked(resetZoom);        
      };

      p.draw = () => {
        p.background(backgroundColor);
        p.windowResized();
        p.translate(tx, ty);

        this.mouseIsOnList = Array(60).fill(false);
        if (this.chartType == this.selectorText[0]) {
          if (this.showDetailTimeliness) {
            p.fillDayBarChart();
          } else {
            p.fillBarChart();
          }
        } else if (this.chartType == this.selectorText[1]) {
          if (this.showDetailTimeliness) {
            p.fillDayLineChart();
          } else {
            p.fillLineChart();
          }
        }
      
        if (p.mouseIsPressed) {
          if (p.mouseButton === p.CENTER) {
            tx -= p.pmouseX - p.mouseX;
            ty -= p.pmouseY - p.mouseY;
          }
        }
        
        if (this.doResetZoom) {
          this.doResetZoom = false;
          resetZoom();
        }
      }

      p.doubleClicked = () => {
        if (clickTimerId) {
          clearTimeout(clickTimerId);
          clickTimerId = undefined;
        }
        resetZoom();
      }

      p.mouseClicked = () => {
        if (p.mouseX > xCenter - chartXDim2 + tx && p.mouseX < xCenter + chartXDim2 + tx
          && p.mouseY > yCenter - chartYDim2 + ty && p.mouseY < yCenter + chartYDim2 + ty) {
          if (!clickTimerId) {
            clickTimerId = setTimeout(() => {    
              if (this.showDetailTimeliness == false) {
                if (this.isWeekly == true) {
                  for (var i = 0; i < this.requestedWeeksNumber; i++) {
                    if (this.mouseIsOnList[i] == true) {
                      this.startDate = this.requestedPublicationTimelinessList[i].day;
                      let tempStopDateToCalendar = Date.parse(this.requestedPublicationTimelinessList[i].day) + 6*this.millisPerDay;
                      if (tempStopDateToCalendar < Date.parse(this.stopDate)) {
                        this.stopDate = new Date(Date.parse(this.requestedPublicationTimelinessList[i].day) + 6*this.millisPerDay).toISOString().slice(0, 10);
                      }
                      let weeklyCheckbox: HTMLInputElement = <HTMLInputElement>document.getElementById("weekly-checkbox");
                      weeklyCheckbox.checked = false;
                      this.askForWeekly = false;
                      this.onFilterSubmit();
                    }
                  }
                } else {
                  for (var i = 0; i < this.requestedDaysNumber; i++) {
                    if (this.mouseIsOnList[i] == true) {
                      this.timelinessDetailDate = this.requestedPublicationTimelinessList[i].day;
                      this.onDetailTimelinessReq(this.timelinessDetailDate);
                    }
                  }
                }
              }
            }, 500)
          }      
        }  
      }

      p.setClickTimeoutId = (id: any) => {
        clickTimerId = id;    
      }

      function applyScale(s: any) {
        sf = sf * s;
        if (sf < 0.65) {
          sf = 0.65;
        } else {
          tx = p.mouseX * (1-s) + tx * s;
          ty = p.mouseY * (1-s) + ty * s;
        }        
      }

      function wheelZoom(e: any) {
        applyScale(e.deltaY < 0 ? 1.1 : 0.9);
        return false;
      }

      function resetZoom() {
        sf = 1.0;
        tx = 0;
        ty = 0;
      }

      p.resetZoom = () => {
        resetZoom();
      }


      p.windowResized = () => {
        canvasWidth = canvas.clientWidth;
        canvasHeight = canvas.clientHeight;
        p.resizeCanvas(canvasWidth, canvasHeight);
        canvasWidth = canvas.clientWidth * sf;
        canvasHeight = canvas.clientHeight * sf;
        if (canvasHeight < 240) canvasHeight = 240;
        xCenter = canvasWidth / 2;
        yCenter = canvasHeight / 2;
        chartXDim = (canvasWidth - blankXDim);
        chartYDim = (canvasHeight - blankYDim);
        chartXDim2 = chartXDim / 2;
        chartYDim2 = chartYDim / 2;
      };

      p.fillBarChart = () => {
        maxValue = 0;
        if (this.isWeekly == true) {
          /* Weekly */
          for (var i = 0; i < this.requestedWeeksNumber; i++) {
            if (this.requestedPublicationTimelinessList[i].average_timeliness! > maxValue) {
              maxValue = this.requestedPublicationTimelinessList[i].average_timeliness!;
            }
          }
          if (maxValue == 0) maxValue = this.timelinessColors[0].threshold;
  
          let sectionXFilledDim = (chartXDim / this.requestedWeeksNumber) / sectionScaleSingle;
          let sectionXFilledDim2 = sectionXFilledDim / 2;
          let barGap = sectionXFilledDim / barGapScale;
  
          /* Threshold Lines */
          for (var i = 0; i < this.timelinessColors.length - 1; i++) {
            p.noFill();
            p.stroke(this.rgbConvertToArray(this.timelinessColors[i+1].color));
            if (this.timelinessColors[i].threshold * chartYDim / maxValue <= chartYDim) {
              p.line(xCenter - chartXDim2, yCenter + chartYDim2 - this.timelinessColors[i].threshold * chartYDim / maxValue, xCenter + chartXDim2, yCenter + chartYDim2 - this.timelinessColors[i].threshold * chartYDim / maxValue);
            }
          }
  
          for (var i = 0; i < this.requestedWeeksNumber; i++) {
            let sectionXCenter = xCenter - chartXDim2 + chartXDim / (2 * this.requestedWeeksNumber) + i * chartXDim / this.requestedWeeksNumber;
  
            /* xAxis Text */
            p.textAlign(p.CENTER, p.CENTER);
            p.fill(lineColor);
            p.noStroke();
            p.textSize(dateFontSize);

            /* Rotate Dates */
            let tempText;
            let preText = "Week\n";
            let weekStartText = "from: " + this.requestedPublicationTimelinessList[i].day + "\nto: ";
            let weekEndText = this.getWeekEndDateText(this.requestedPublicationTimelinessList[i].day);
            tempText = preText + weekStartText + weekEndText;
            let tempRadium = (sectionXFilledDim - (2 * barGap) - dateFontSize);
            let angle = 0;
            if (tempRadium > p.textWidth(weekEndText)) tempRadium = p.textWidth(weekEndText);
            if (tempRadium > 0) angle = p.acos(tempRadium / p.textWidth(weekEndText));
            else angle = p.PI/2;
            let sinOfAngleTemp = p.sin(angle);
            if (sinOfAngleTemp < 0.001) {
              sinOfAngleTemp = 0.001;
            }
            let sinOfAngle = sinOfAngleTemp * (p.textWidth(weekEndText) / 2);            
            p.push();
            p.translate(sectionXCenter, yCenter + chartYDim2 + sinOfAngle + 3 * dateFontSize);
            if (angle > p.PI / 2) angle = p.PI / 2;
            if (angle < 0) angle = 0;
            p.rotate(-angle);
            tempText = tempText + "\n";
            p.text(tempText, 0, 0);
            p.pop();
            
            p.noFill();
            p.stroke(lineColor);
            p.line(xCenter - chartXDim2 + (i + 1) * chartXDim / this.requestedWeeksNumber, yCenter + chartYDim2 + 5, xCenter - chartXDim2 + (i + 1) * chartXDim / this.requestedWeeksNumber, yCenter + chartYDim2);
            /* Bars */
            p.rectMode(p.CORNER);
            if (this.requestedPublicationTimelinessList[i].average_timeliness! > this.timelinessColors[0].threshold) {
              p.fill(this.rgbConvertToArray(this.timelinessColors[0].color));
            } else if (this.requestedPublicationTimelinessList[i].average_timeliness! > this.timelinessColors[1].threshold && this.requestedPublicationTimelinessList[i].average_timeliness! <= this.timelinessColors[0].threshold) {
              p.fill(this.rgbConvertToArray(this.timelinessColors[1].color));
            } else if (this.requestedPublicationTimelinessList[i].average_timeliness! > this.timelinessColors[2].threshold && this.requestedPublicationTimelinessList[i].average_timeliness! <= this.timelinessColors[1].threshold) {
              p.fill(this.rgbConvertToArray(this.timelinessColors[2].color));
            } else if (this.requestedPublicationTimelinessList[i].average_timeliness! > this.timelinessColors[3].threshold && this.requestedPublicationTimelinessList[i].average_timeliness! <= this.timelinessColors[2].threshold) {
              p.fill(this.rgbConvertToArray(this.timelinessColors[3].color));
            } else if (this.requestedPublicationTimelinessList[i].average_timeliness! >= this.timelinessColors[4].threshold && this.requestedPublicationTimelinessList[i].average_timeliness! <= this.timelinessColors[3].threshold) {
              p.fill(this.rgbConvertToArray(this.timelinessColors[4].color));
            }
            
            if (this.requestedPublicationTimelinessList[i].average_timeliness! == 0) {
              p.stroke(this.rgbConvertToArray(this.timelinessColors[4].color));
              p.line(sectionXCenter - sectionXFilledDim2, yCenter + chartYDim2, sectionXCenter + sectionXFilledDim2, yCenter + chartYDim2);
            }
            
            p.noStroke();
            p.rect(sectionXCenter - sectionXFilledDim2, yCenter + chartYDim2, sectionXFilledDim, -((this.requestedPublicationTimelinessList[i].average_timeliness! < 0 ? 0 : this.requestedPublicationTimelinessList[i].average_timeliness! * chartYDim / maxValue)));
  
            /* If mouse on bars */
            if (p.mouseX > sectionXCenter - (chartXDim / this.requestedWeeksNumber)/2 + tx && p.mouseX < sectionXCenter + (chartXDim / this.requestedWeeksNumber)/2 + tx
                && p.mouseY > yCenter - chartYDim2 + ty && p.mouseY < yCenter + chartYDim2 + sinOfAngle + 4 * dateFontSize + ty) {
              /* Selector box */
              p.stroke(230);
              p.fill(255, 30);
              p.rect(sectionXCenter - sectionXFilledDim2, yCenter - chartYDim2, sectionXFilledDim, chartYDim + 2 * sinOfAngle + 4 * dateFontSize);
              this.mouseIsOnList[i] = true;

              /* Tooltip */
              p.textSize(valueFontSize);
              p.noStroke();
              p.fill(lineColor);
              p.text((this.requestedPublicationTimelinessList[i].average_timeliness! == null || this.requestedPublicationTimelinessList[i].average_timeliness! == -1) ? "NaN" : this.requestedPublicationTimelinessList[i].average_timeliness! < this.millisPer72Hours ? this.millisToHHMMSS(this.requestedPublicationTimelinessList[i].average_timeliness!) : ">72h",
                      sectionXCenter, yCenter - chartYDim2 - 2 * dateFontSize);
            }
          } 
          /* Scheme */
          p.rectMode(p.CENTER);
          p.textAlign(p.RIGHT, p.CENTER);
          p.noFill();
          p.stroke(lineColor);
          p.line(xCenter - chartXDim2, yCenter + chartYDim2, xCenter - chartXDim2, yCenter - chartYDim2);
          p.line(xCenter - chartXDim2, yCenter + chartYDim2, xCenter + chartXDim2, yCenter + chartYDim2);
          /* Zero text */
          p.fill(lineColor);
          p.noStroke();
          p.textSize(dateFontSize);
          p.text("0s", xCenter - chartXDim2 - 10, yCenter + chartYDim2);
          p.stroke(lineColor);
          p.line(xCenter - chartXDim2 - 5, yCenter + chartYDim2, xCenter - chartXDim2, yCenter + chartYDim2);
          p.line(xCenter - chartXDim2, yCenter + chartYDim2 + 5, xCenter - chartXDim2, yCenter + chartYDim2);
          /* yAxis text */
          for (var i = 0; i < nLines; i++) {
            p.fill(lineColor);
            p.noStroke();
            p.text(this.millisToHHMMSS(maxValue / (nLines / (i + 1))), xCenter - chartXDim2 - 15, yCenter + chartYDim2 - (i + 1) * chartYDim / nLines + 1);
            p.stroke(lineColor);
            p.line(xCenter - chartXDim2 - 5, yCenter + chartYDim2 - (i + 1) * chartYDim / nLines, xCenter - chartXDim2, yCenter + chartYDim2 - (i + 1) * chartYDim / nLines)
          }
        } else {
          /* Daily */          
          for (var i = 0; i < this.requestedDaysNumber; i++) {
            if (this.requestedPublicationTimelinessList[i].average_timeliness! > maxValue) {
              maxValue = this.requestedPublicationTimelinessList[i].average_timeliness!;
            }
          }
          if (maxValue == 0) maxValue = this.timelinessColors[0].threshold;

          let sectionXFilledDim = (chartXDim / this.requestedDaysNumber) / sectionScaleSingle;
          let sectionXFilledDim2 = sectionXFilledDim / 2;
          let barGap = sectionXFilledDim / barGapScale;

          /* Threshold Lines */
          for (var i = 0; i < this.timelinessColors.length - 1; i++) {
            p.noFill();
            p.stroke(this.rgbConvertToArray(this.timelinessColors[i+1].color));
            if (this.timelinessColors[i].threshold * chartYDim / maxValue <= chartYDim) {
              p.line(xCenter - chartXDim2, yCenter + chartYDim2 - this.timelinessColors[i].threshold * chartYDim / maxValue, xCenter + chartXDim2, yCenter + chartYDim2 - this.timelinessColors[i].threshold * chartYDim / maxValue);
            }
          }

          for (var i = 0; i < this.requestedDaysNumber; i++) {
            let sectionXCenter = xCenter - chartXDim2 + chartXDim / (2 * this.requestedDaysNumber) + i * chartXDim / this.requestedDaysNumber;

            /* xAxis Text */
            p.textAlign(p.CENTER, p.CENTER);
            p.fill(lineColor);
            p.noStroke();
            p.textSize(dateFontSize);

            /* Rotate Dates */
            let tempText;
            tempText = this.requestedPublicationTimelinessList[i].day;
            let tempRadium = (sectionXFilledDim - (2 * barGap) - dateFontSize);
            let angle = 0;
            if (tempRadium > p.textWidth(tempText)) tempRadium = p.textWidth(tempText);
            if (tempRadium > 0) angle = p.acos(tempRadium / p.textWidth(tempText));
            else angle = p.PI/2;
            let sinOfAngleTemp = p.sin(angle);
            if (sinOfAngleTemp < 0.001) {
              sinOfAngleTemp = 0.001;
            }
            let sinOfAngle = sinOfAngleTemp * (p.textWidth(tempText) / 2);
            p.push();
            p.translate(sectionXCenter, yCenter + chartYDim2 + sinOfAngle + 2 * dateFontSize);
            if (angle > p.PI / 2) angle = p.PI / 2;
            if (angle < 0) angle = 0;
            p.rotate(-angle);
            tempText = tempText + "\n";
            
            p.text(tempText, 0, 0);
            p.pop();
            
            p.noFill();
            p.stroke(lineColor);
            p.line(xCenter - chartXDim2 + (i + 1) * chartXDim / this.requestedDaysNumber, yCenter + chartYDim2 + 5, xCenter - chartXDim2 + (i + 1) * chartXDim / this.requestedDaysNumber, yCenter + chartYDim2);
            
            /* Bars */
            p.rectMode(p.CORNER);
            if (this.requestedPublicationTimelinessList[i].average_timeliness! > this.timelinessColors[0].threshold) {
              p.fill(this.rgbConvertToArray(this.timelinessColors[0].color));
            } else if (this.requestedPublicationTimelinessList[i].average_timeliness! > this.timelinessColors[1].threshold && this.requestedPublicationTimelinessList[i].average_timeliness! <= this.timelinessColors[0].threshold) {
              p.fill(this.rgbConvertToArray(this.timelinessColors[1].color));
            } else if (this.requestedPublicationTimelinessList[i].average_timeliness! > this.timelinessColors[2].threshold && this.requestedPublicationTimelinessList[i].average_timeliness! <= this.timelinessColors[1].threshold) {
              p.fill(this.rgbConvertToArray(this.timelinessColors[2].color));
            } else if (this.requestedPublicationTimelinessList[i].average_timeliness! > this.timelinessColors[3].threshold && this.requestedPublicationTimelinessList[i].average_timeliness! <= this.timelinessColors[2].threshold) {
              p.fill(this.rgbConvertToArray(this.timelinessColors[3].color));
            } else if (this.requestedPublicationTimelinessList[i].average_timeliness! >= this.timelinessColors[4].threshold && this.requestedPublicationTimelinessList[i].average_timeliness! <= this.timelinessColors[3].threshold) {
              p.fill(this.rgbConvertToArray(this.timelinessColors[4].color));
            }
            
            if (this.requestedPublicationTimelinessList[i].average_timeliness == 0) {
              p.stroke(this.rgbConvertToArray(this.timelinessColors[4].color));
              p.line(sectionXCenter - sectionXFilledDim2, yCenter + chartYDim2, sectionXCenter + sectionXFilledDim2, yCenter + chartYDim2);
            }
            
            p.noStroke();
            p.rect(sectionXCenter - sectionXFilledDim2, yCenter + chartYDim2, sectionXFilledDim, -(this.requestedPublicationTimelinessList[i].average_timeliness! < 0 ? 0 : this.requestedPublicationTimelinessList[i].average_timeliness! * chartYDim / maxValue));

            /* if mouse is on bar */
            if (p.mouseX > sectionXCenter - (chartXDim / this.requestedDaysNumber)/2 + tx && p.mouseX < sectionXCenter + (chartXDim / this.requestedDaysNumber)/2 + tx
                && p.mouseY > yCenter - chartYDim2 + ty && p.mouseY < yCenter + chartYDim2 + sinOfAngle + 2 * dateFontSize + ty) {
              /* Selector box */
              p.stroke(230);
              p.fill(255, 30);
              p.rect(sectionXCenter - sectionXFilledDim2, yCenter - chartYDim2, sectionXFilledDim, chartYDim + 2 * sinOfAngle + 3 * dateFontSize);
              this.mouseIsOnList[i] = true;

              /* Tooltip */
              p.textSize(valueFontSize);
              p.noStroke();
              p.fill(lineColor);
              p.text((this.requestedPublicationTimelinessList[i].average_timeliness == null || this.requestedPublicationTimelinessList[i].average_timeliness == -1) ? "NaN" : this.requestedPublicationTimelinessList[i].average_timeliness! < this.millisPer72Hours ? this.millisToHHMMSS(this.requestedPublicationTimelinessList[i].average_timeliness!) : ">72h",
                      sectionXCenter, yCenter - chartYDim2 - 2 * dateFontSize);
            }
          } 
          /* Scheme */
          p.rectMode(p.CENTER);
          p.textAlign(p.RIGHT, p.CENTER);
          p.noFill();
          p.stroke(lineColor);
          p.line(xCenter - chartXDim2, yCenter + chartYDim2, xCenter - chartXDim2, yCenter - chartYDim2);
          p.line(xCenter - chartXDim2, yCenter + chartYDim2, xCenter + chartXDim2, yCenter + chartYDim2);
          /* Zero text */
          p.fill(lineColor);
          p.noStroke();
          p.textSize(dateFontSize);
          p.text("0s", xCenter - chartXDim2 - 10, yCenter + chartYDim2);
          p.stroke(lineColor);
          p.line(xCenter - chartXDim2 - 5, yCenter + chartYDim2, xCenter - chartXDim2, yCenter + chartYDim2);
          p.line(xCenter - chartXDim2, yCenter + chartYDim2 + 5, xCenter - chartXDim2, yCenter + chartYDim2);
          /* yAxis text */
          for (var i = 0; i < nLines; i++) {
            p.fill(lineColor);
            p.noStroke();
            p.text(this.millisToHHMMSS(maxValue / (nLines / (i + 1))), xCenter - chartXDim2 - 15, yCenter + chartYDim2 - (i + 1) * chartYDim / nLines + 1);
            p.stroke(lineColor);
            p.line(xCenter - chartXDim2 - 5, yCenter + chartYDim2 - (i + 1) * chartYDim / nLines, xCenter - chartXDim2, yCenter + chartYDim2 - (i + 1) * chartYDim / nLines)
          }
        }
      }

      p.fillLineChart = () => {
        maxValue = 0;
        if (this.isWeekly == true) {
          /* Weekly */
          for (var i = 0; i < this.requestedWeeksNumber; i++) {
            if (this.requestedPublicationTimelinessList[i].average_timeliness! > maxValue) {
              maxValue = this.requestedPublicationTimelinessList[i].average_timeliness!;
            }
          }
          if (maxValue == 0) maxValue = this.timelinessColors[0].threshold;
          
          let xpoint: Array<number> = [];
          let ypoint: Array<number> = [];
          let sectionXFilledDim = (chartXDim / this.requestedWeeksNumber) / sectionScaleSingle;
          let sectionXFilledDim2 = sectionXFilledDim / 2;
          let barGap = sectionXFilledDim / barGapScale;

          /* Threshold Lines */
          for (var i = 0; i < this.timelinessColors.length - 1; i++) {
            p.noFill();
            p.stroke(this.rgbConvertToArray(this.timelinessColors[i + 1].color));
            if (this.timelinessColors[i].threshold * chartYDim / maxValue <= chartYDim) {
              p.line(xCenter - chartXDim2, yCenter + chartYDim2 - this.timelinessColors[i].threshold * chartYDim / maxValue, xCenter + chartXDim2, yCenter + chartYDim2 - this.timelinessColors[i].threshold * chartYDim / maxValue);
            }
          }

          p.curveTightness(1.0);
          p.beginShape();
          p.rectMode(p.CORNER);

          for (var i = 0; i < this.requestedWeeksNumber; i++) {
            let sectionXCenter = xCenter - chartXDim2 + chartXDim / (2 * this.requestedWeeksNumber) + i * chartXDim / this.requestedWeeksNumber;
            xpoint[i] = sectionXCenter;
            ypoint[i] = yCenter + chartYDim2 -((this.requestedPublicationTimelinessList[i].average_timeliness! < 0 ? 0 : this.requestedPublicationTimelinessList[i].average_timeliness!) * chartYDim / maxValue);
            
            /* Draw Curve */
            p.stroke(0,255,255);
            if (i == 0) p.curveVertex(xpoint[i], ypoint[i]);
            p.curveVertex(xpoint[i], ypoint[i]);          
            if (i == this.requestedWeeksNumber - 1) p.curveVertex(xpoint[i], ypoint[i]);
          }
          p.endShape();

          for (var i = 0; i < this.requestedWeeksNumber; i++) {
            let sectionXCenter = xCenter - chartXDim2 + chartXDim / (2 * this.requestedWeeksNumber) + i * chartXDim / this.requestedWeeksNumber;
            
            /* xAxis Text */
            p.textAlign(p.CENTER, p.CENTER);
            p.fill(lineColor);
            p.noStroke();
            p.textSize(dateFontSize);

            /* Rotate Dates */
            let tempText;
            let preText = "Week\n";
            let weekStartText = "from: " + this.requestedPublicationTimelinessList[i].day + "\nto: ";
            let weekEndText = this.getWeekEndDateText(this.requestedPublicationTimelinessList[i].day);
            tempText = preText + weekStartText + weekEndText;
            let tempRadium = (sectionXFilledDim - (2 * barGap) - dateFontSize);
            let angle = 0;
            if (tempRadium > p.textWidth(weekEndText)) tempRadium = p.textWidth(weekEndText);
            if (tempRadium > 0) angle = p.acos(tempRadium / p.textWidth(weekEndText));
            else angle = p.PI/2;
            let sinOfAngleTemp = p.sin(angle);
            if (sinOfAngleTemp < 0.001) {
              sinOfAngleTemp = 0.001;
            }
            let sinOfAngle = sinOfAngleTemp * (p.textWidth(weekEndText) / 2);  
            p.push();
            p.translate(sectionXCenter, yCenter + chartYDim2 + sinOfAngle + 3 * dateFontSize);
            if (angle > p.PI / 2) angle = p.PI / 2;
            if (angle < 0) angle = 0;
            p.rotate(-angle);
            tempText = tempText + "\n";
            
            p.text(tempText, 0, 0);
            p.pop();

            /* If mouse on bars */
            if (p.mouseX > sectionXCenter - (chartXDim / this.requestedWeeksNumber)/2 + tx && p.mouseX < sectionXCenter + (chartXDim / this.requestedWeeksNumber)/2 + tx
                && p.mouseY > yCenter - chartYDim2 + ty && p.mouseY < yCenter + chartYDim2 + sinOfAngle + 4 * dateFontSize + ty) {
              /* Selector box */
              p.stroke(230);
              p.fill(255, 30);
              p.line(sectionXCenter, yCenter - chartYDim2, sectionXCenter, yCenter + chartYDim2);
              this.mouseIsOnList[i] = true;

              /* Tooltip */
              p.textSize(valueFontSize);
              p.noStroke();
              p.fill(lineColor);
              p.text((this.requestedPublicationTimelinessList[i].average_timeliness! == null || this.requestedPublicationTimelinessList[i].average_timeliness! == -1) ? "NaN" : this.requestedPublicationTimelinessList[i].average_timeliness! < this.millisPer72Hours ? this.millisToHHMMSS(this.requestedPublicationTimelinessList[i].average_timeliness!) : ">72h",
                      sectionXCenter, yCenter - chartYDim2 - 2 * dateFontSize);
            }

            /* xAxis Lines */
            p.fill(255, 255, 255, 20);
            p.stroke(lineColor);
            p.line(xCenter - chartXDim2 + (i + 1) * chartXDim / this.requestedWeeksNumber, yCenter + chartYDim2 + 5, xCenter - chartXDim2 + (i + 1) * chartXDim / this.requestedWeeksNumber, yCenter + chartYDim2);
          }

          /* Scheme */
          p.textAlign(p.RIGHT, p.CENTER);
          p.noFill();
          p.stroke(lineColor);
          p.line(xCenter - chartXDim2, yCenter + chartYDim2, xCenter - chartXDim2, yCenter - chartYDim2);
          p.line(xCenter - chartXDim2, yCenter + chartYDim2, xCenter + chartXDim2, yCenter + chartYDim2);
          /* Zero text */
          p.fill(lineColor);
          p.noStroke();
          p.textSize(dateFontSize);
          p.text("0s", xCenter - chartXDim2 - 10, yCenter + chartYDim2);
          p.stroke(lineColor);
          p.line(xCenter - chartXDim2 - 5, yCenter + chartYDim2, xCenter - chartXDim2, yCenter + chartYDim2);
          p.line(xCenter - chartXDim2, yCenter + chartYDim2 + 5, xCenter - chartXDim2, yCenter + chartYDim2);
          /* yAxis text */
          for (var i = 0; i < nLines; i++) {
            p.fill(lineColor);
            p.noStroke();
            p.text(this.millisToHHMMSS(maxValue / (nLines / (i + 1))), xCenter - chartXDim2 - 15, yCenter + chartYDim2 - (i + 1) * chartYDim / nLines + 1);
            p.stroke(lineColor);
            p.line(xCenter - chartXDim2 - 5, yCenter + chartYDim2 - (i + 1) * chartYDim / nLines, xCenter - chartXDim2, yCenter + chartYDim2 - (i + 1) * chartYDim / nLines)
          }
        } else {
          /* Daily */
          for (var i = 0; i < this.requestedDaysNumber; i++) {
            if (this.requestedPublicationTimelinessList[i].average_timeliness! > maxValue) {
              maxValue = this.requestedPublicationTimelinessList[i].average_timeliness!;
            }
          }
          if (maxValue == 0) maxValue = this.timelinessColors[0].threshold;
          
          let xpoint: Array<number> = [];
          let ypoint: Array<number> = [];
          let sectionXFilledDim = (chartXDim / this.requestedDaysNumber) / sectionScaleSingle;
          let sectionXFilledDim2 = sectionXFilledDim / 2;
          let barGap = sectionXFilledDim / barGapScale;

          /* Threshold Lines */
          for (var i = 0; i < this.timelinessColors.length - 1; i++) {
            p.noFill();
            p.stroke(this.rgbConvertToArray(this.timelinessColors[i + 1].color));
            if (this.timelinessColors[i].threshold * chartYDim / maxValue <= chartYDim) {
              p.line(xCenter - chartXDim2, yCenter + chartYDim2 - this.timelinessColors[i].threshold * chartYDim / maxValue, xCenter + chartXDim2, yCenter + chartYDim2 - this.timelinessColors[i].threshold * chartYDim / maxValue);
            }
          }

          p.curveTightness(1.0);
          p.beginShape();
          p.rectMode(p.CORNER);

          for (var i = 0; i < this.requestedDaysNumber; i++) {
            let sectionXCenter = xCenter - chartXDim2 + chartXDim / (2 * this.requestedDaysNumber) + i * chartXDim / this.requestedDaysNumber;
            xpoint[i] = sectionXCenter;
            ypoint[i] = yCenter + chartYDim2 -((this.requestedPublicationTimelinessList[i].average_timeliness! < 0 ? 0 : this.requestedPublicationTimelinessList[i].average_timeliness!) * chartYDim / maxValue);
            
            /* Draw Curve */
            p.stroke(0,255,255);
            if (i == 0) p.curveVertex(xpoint[i], ypoint[i]);
            p.curveVertex(xpoint[i], ypoint[i]);          
            if (i == this.requestedDaysNumber - 1) p.curveVertex(xpoint[i], ypoint[i]);
          }
          p.endShape();

          for (var i = 0; i < this.requestedDaysNumber; i++) {
            let sectionXCenter = xCenter - chartXDim2 + chartXDim / (2 * this.requestedDaysNumber) + i * chartXDim / this.requestedDaysNumber;
            
            /* xAxis Text */
            p.textAlign(p.CENTER, p.CENTER);
            p.fill(lineColor);
            p.noStroke();
            p.textSize(dateFontSize);

            /* Rotate Dates */
            let tempText = this.requestedPublicationTimelinessList[i].day;
            let tempRadium = (sectionXFilledDim - (2 * barGap) - dateFontSize);
            let angle = 0;
            if (tempRadium > p.textWidth(tempText)) tempRadium = p.textWidth(tempText);
            if (tempRadium > 0) angle = p.acos(tempRadium / p.textWidth(tempText));
            else angle = p.PI/2;
            let sinOfAngleTemp = p.sin(angle);
            if (sinOfAngleTemp < 0.001) {
              sinOfAngleTemp = 0.001;
            }
            let sinOfAngle = sinOfAngleTemp * (p.textWidth(tempText) / 2);
            p.push();
            p.translate(sectionXCenter, yCenter + chartYDim2 + sinOfAngle + 2 * dateFontSize);
            if (angle > p.PI / 2) angle = p.PI / 2;
            if (angle < 0) angle = 0;
            p.rotate(-angle);
            tempText = tempText + "\n";
            
            p.text(tempText, 0, 0);
            p.pop();

            /* If mouse on bars */
            if (p.mouseX > sectionXCenter - (chartXDim / this.requestedDaysNumber)/2 + tx && p.mouseX < sectionXCenter + (chartXDim / this.requestedDaysNumber)/2 + tx
                && p.mouseY > yCenter - chartYDim2 + ty && p.mouseY < yCenter + chartYDim2 + sinOfAngle + 2*dateFontSize + ty) {
              p.stroke(230);
              p.fill(255, 30);
              p.line(sectionXCenter, yCenter - chartYDim2, sectionXCenter, yCenter + chartYDim2);
              this.mouseIsOnList[i] = true;

              /* Tooltip */
              p.textSize(valueFontSize);
              p.noStroke();
              p.fill(lineColor);
              p.text((this.requestedPublicationTimelinessList[i].average_timeliness! == null || this.requestedPublicationTimelinessList[i].average_timeliness! == -1) ? "NaN" : this.requestedPublicationTimelinessList[i].average_timeliness! < this.millisPer72Hours ? this.millisToHHMMSS(this.requestedPublicationTimelinessList[i].average_timeliness!) : ">72h",
                      sectionXCenter, yCenter - chartYDim2 - 2 * dateFontSize);
            }

            /* xAxis Lines */
            p.fill(255, 255, 255, 20);
            p.stroke(lineColor);
            p.line(xCenter - chartXDim2 + (i + 1) * chartXDim / this.requestedDaysNumber, yCenter + chartYDim2 + 5, xCenter - chartXDim2 + (i + 1) * chartXDim / this.requestedDaysNumber, yCenter + chartYDim2);
          }

          /* Scheme */
          p.textAlign(p.RIGHT, p.CENTER);
          p.noFill();
          p.stroke(lineColor);
          p.line(xCenter - chartXDim2, yCenter + chartYDim2, xCenter - chartXDim2, yCenter - chartYDim2);
          p.line(xCenter - chartXDim2, yCenter + chartYDim2, xCenter + chartXDim2, yCenter + chartYDim2);
          /* Zero text */
          p.fill(lineColor);
          p.noStroke();
          p.textSize(dateFontSize);
          p.text("0s", xCenter - chartXDim2 - 10, yCenter + chartYDim2);
          p.stroke(lineColor);
          p.line(xCenter - chartXDim2 - 5, yCenter + chartYDim2, xCenter - chartXDim2, yCenter + chartYDim2);
          p.line(xCenter - chartXDim2, yCenter + chartYDim2 + 5, xCenter - chartXDim2, yCenter + chartYDim2);
          /* yAxis text */
          for (var i = 0; i < nLines; i++) {
            p.fill(lineColor);
            p.noStroke();
            p.text(this.millisToHHMMSS(maxValue / (nLines / (i + 1))), xCenter - chartXDim2 - 15, yCenter + chartYDim2 - (i + 1) * chartYDim / nLines + 1);
            p.stroke(lineColor);
            p.line(xCenter - chartXDim2 - 5, yCenter + chartYDim2 - (i + 1) * chartYDim / nLines, xCenter - chartXDim2, yCenter + chartYDim2 - (i + 1) * chartYDim / nLines)
          }
        }
      }


      p.fillDayBarChart = () => {
        maxValue = 0;
        for (var i = 0; i < this.timelinessDetailNumber; i++) {
          if (this.publicationDetailTimelinessList[i].timeliness! > maxValue) {
            maxValue = this.publicationDetailTimelinessList[i].timeliness!;
          }
        }
        if (maxValue == 0) maxValue = this.timelinessColors[0].threshold;
        
        let sectionXFilledDim = (chartXDim / this.timelinessDetailNumber) / sectionScaleSingle;
        let sectionXFilledDim2 = sectionXFilledDim / 2;
        let barGap = sectionXFilledDim / barGapScale;

        /* Threshold Lines */
        for (var i = 0; i < this.timelinessColors.length - 1; i++) {
          p.noFill();
          p.stroke(this.rgbConvertToArray(this.timelinessColors[i + 1].color));
          if (this.timelinessColors[i].threshold * chartYDim / maxValue <= chartYDim) {
            p.line(xCenter - chartXDim2, yCenter + chartYDim2 - this.timelinessColors[i].threshold * chartYDim / maxValue, xCenter + chartXDim2, yCenter + chartYDim2 - this.timelinessColors[i].threshold * chartYDim / maxValue);
          }
        }

        let datePrintAddendum = Math.ceil(((this.timelinessDetailNumber * 2) / 100) * (1/sf));
        for (var i = 0; i < this.timelinessDetailNumber; i = i + datePrintAddendum) {
          let sectionXCenter = xCenter - chartXDim2 + chartXDim / (2 * this.timelinessDetailNumber) + i * chartXDim / this.timelinessDetailNumber;

          /* xAxis Text */
          p.textAlign(p.CENTER, p.CENTER);
          p.fill(lineColor);
          p.noStroke();
          p.textSize(dateFontSize);
          /* Rotate Dates */
          let tempText = this.publicationDetailTimelinessList[i].timezone.slice(11, 16);
          let tempRadium = (sectionXFilledDim - (2 * barGap) - dateFontSize);
          let angle = 0;
          if (tempRadium > p.textWidth(tempText)) tempRadium = p.textWidth(tempText);
          if (tempRadium > 0) angle = p.acos(tempRadium / p.textWidth(tempText));
          else angle = p.PI/2;
          let sinOfAngleTemp = p.sin(angle);
          if (sinOfAngleTemp < 0.001) {
            sinOfAngleTemp = 0.001;
          }
          let sinOfAngle = sinOfAngleTemp * (p.textWidth(tempText) / 2);
          p.push();
          p.translate(sectionXCenter, yCenter + chartYDim2 + sinOfAngle + dateFontSize*2);
          if (angle > p.PI / 2) angle = p.PI / 2;
          if (angle < 0) angle = 0;
          p.rotate(-angle);
          tempText = tempText + "\n";
          
          p.text(tempText, 0, 0);
          p.pop();
        }
        for (var i = 0; i < this.timelinessDetailNumber; i++) {
          let sectionXCenter = xCenter - chartXDim2 + chartXDim / (2 * this.timelinessDetailNumber) + i * chartXDim / this.timelinessDetailNumber;

          p.noFill();
          p.stroke(lineColor);
          p.line(xCenter - chartXDim2 + (i + 1) * chartXDim / this.timelinessDetailNumber, yCenter + chartYDim2 + 5, xCenter - chartXDim2 + (i + 1) * chartXDim / this.timelinessDetailNumber, yCenter + chartYDim2);
          /* Bars */
          p.rectMode(p.CORNER);
          if (this.publicationDetailTimelinessList[i].timeliness! > this.timelinessColors[0].threshold) {
            p.fill(this.rgbConvertToArray(this.timelinessColors[0].color));
          } else if (this.publicationDetailTimelinessList[i].timeliness! > this.timelinessColors[1].threshold && this.publicationDetailTimelinessList[i].timeliness! <= this.timelinessColors[0].threshold) {
            p.fill(this.rgbConvertToArray(this.timelinessColors[1].color));
          } else if (this.publicationDetailTimelinessList[i].timeliness! > this.timelinessColors[2].threshold && this.publicationDetailTimelinessList[i].timeliness! <= this.timelinessColors[1].threshold) {
            p.fill(this.rgbConvertToArray(this.timelinessColors[2].color));
          } else if (this.publicationDetailTimelinessList[i].timeliness! > this.timelinessColors[3].threshold && this.publicationDetailTimelinessList[i].timeliness! <= this.timelinessColors[2].threshold) {
            p.fill(this.rgbConvertToArray(this.timelinessColors[3].color));
          } else if (this.publicationDetailTimelinessList[i].timeliness! >= this.timelinessColors[4].threshold && this.publicationDetailTimelinessList[i].timeliness! <= this.timelinessColors[3].threshold) {
            p.fill(this.rgbConvertToArray(this.timelinessColors[4].color));
          }
          p.noStroke();
          p.rect(sectionXCenter - sectionXFilledDim2, yCenter + chartYDim2, sectionXFilledDim, -((this.publicationDetailTimelinessList[i].timeliness! < 0 ? 0 : this.publicationDetailTimelinessList[i].timeliness!) * chartYDim / maxValue));

          /* If mouse on bars */
          if (p.mouseX > sectionXCenter - (chartXDim / this.timelinessDetailNumber)/2 + tx && p.mouseX < sectionXCenter + (chartXDim / this.timelinessDetailNumber)/2 + tx
                && p.mouseY > yCenter - chartYDim2 + ty && p.mouseY < yCenter + chartYDim2 + 2 * dateFontSize + ty) {

            /* Selector box */
            p.stroke(230);
            p.fill(255, 30);
            p.rect(sectionXCenter - sectionXFilledDim2, yCenter - chartYDim2, sectionXFilledDim, chartYDim + 3 * dateFontSize);

            /* Tooltip */
            p.textSize(valueFontSize);
            p.noStroke();
            p.fill(lineColor);
            p.text((this.publicationDetailTimelinessList[i].timeliness! == null || this.publicationDetailTimelinessList[i].timeliness! == -1) ? "NaN" : this.publicationDetailTimelinessList[i].timeliness! < this.millisPer72Hours ? this.millisToHHMMSS(this.publicationDetailTimelinessList[i].timeliness!) : ">72h",
                    sectionXCenter, yCenter - chartYDim2 - 2 * dateFontSize);
          }
        } 

        /* Scheme */
        p.rectMode(p.CENTER);
        p.textAlign(p.RIGHT, p.CENTER);
        p.noFill();
        p.stroke(lineColor);
        p.line(xCenter - chartXDim2, yCenter + chartYDim2, xCenter - chartXDim2, yCenter - chartYDim2);
        p.line(xCenter - chartXDim2, yCenter + chartYDim2, xCenter + chartXDim2, yCenter + chartYDim2);
        /* Zero text */
        p.fill(lineColor);
        p.noStroke();
        p.textSize(dateFontSize);
        p.text("0s", xCenter - chartXDim2 - 10, yCenter + chartYDim2);
        p.stroke(lineColor);
        p.line(xCenter - chartXDim2 - 5, yCenter + chartYDim2, xCenter - chartXDim2, yCenter + chartYDim2);
        p.line(xCenter - chartXDim2, yCenter + chartYDim2 + 5, xCenter - chartXDim2, yCenter + chartYDim2);
        /* yAxis text */
        for (var i = 0; i < nLines; i++) {
          p.fill(lineColor);
          p.noStroke();
          p.text(this.millisToHHMMSS(maxValue / (nLines / (i + 1))), xCenter - chartXDim2 - 15, yCenter + chartYDim2 - (i + 1) * chartYDim / nLines + 1);
          p.stroke(lineColor);
          p.line(xCenter - chartXDim2 - 5, yCenter + chartYDim2 - (i + 1) * chartYDim / nLines, xCenter - chartXDim2, yCenter + chartYDim2 - (i + 1) * chartYDim / nLines)
        }
      }

      p.fillDayLineChart = () => {
        maxValue = 0;
        for (var i = 0; i < this.timelinessDetailNumber; i++) {
          if (this.publicationDetailTimelinessList[i].timeliness! > maxValue) {
            maxValue = this.publicationDetailTimelinessList[i].timeliness!;
          }
        }
        if (maxValue == 0) maxValue = this.timelinessColors[0].threshold;
        
        let xpoint: Array<number> = [];
        let ypoint: Array<number> = [];
        
        let sectionXFilledDim = chartXDim / this.timelinessDetailNumber;
        let sectionXFilledDim2 = sectionXFilledDim / 2;
        let barGap = sectionXFilledDim / barGapScale;

        /* Threshold Lines */
        for (var i = 0; i < this.timelinessColors.length - 1; i++) {
          p.noFill();
          p.stroke(this.rgbConvertToArray(this.timelinessColors[i + 1].color));
          if (this.timelinessColors[i].threshold * chartYDim / maxValue <= chartYDim) {
            p.line(xCenter - chartXDim2, yCenter + chartYDim2 - this.timelinessColors[i].threshold * chartYDim / maxValue, xCenter + chartXDim2, yCenter + chartYDim2 - this.timelinessColors[i].threshold * chartYDim / maxValue);
          }
        }

        p.curveTightness(1.0);
        p.beginShape();
        p.stroke(255,255,0);
        p.noFill();
        p.rectMode(p.CORNER);

        for (var i = 0; i < this.timelinessDetailNumber; i++) {
          let sectionXCenter = xCenter - chartXDim2 + chartXDim / (2 * this.timelinessDetailNumber) + i * chartXDim / this.timelinessDetailNumber;
          xpoint[i] = sectionXCenter;
          ypoint[i] = yCenter + chartYDim2 -((this.publicationDetailTimelinessList[i].timeliness! < 0 ? 0 : this.publicationDetailTimelinessList[i].timeliness!) * chartYDim / maxValue);
          
          /* Draw Curve */
          p.stroke(0,255,255);
          p.noFill();
          if (i == 0) p.curveVertex(xpoint[i], ypoint[i]);
          p.curveVertex(xpoint[i], ypoint[i]);          
          if (i == this.timelinessDetailNumber - 1) p.curveVertex(xpoint[i], ypoint[i]);
        }
        p.endShape();

        for (var i = 0; i < this.timelinessDetailNumber; i++) {
          let sectionXCenter = xCenter - chartXDim2 + chartXDim / (2 * this.timelinessDetailNumber) + i * chartXDim / this.timelinessDetailNumber;
          /* xAxis Lines */
          p.stroke(lineColor);
          p.line(xCenter - chartXDim2 + (i + 1) * chartXDim / this.timelinessDetailNumber, yCenter + chartYDim2 + 5, xCenter - chartXDim2 + (i + 1) * chartXDim / this.timelinessDetailNumber, yCenter + chartYDim2);
        }

        let datePrintAddendum = Math.ceil(((this.timelinessDetailNumber * 2) / 100) * (1/sf));
        for (var i = 0; i < this.timelinessDetailNumber; i = i + datePrintAddendum) {
          let sectionXCenter = xCenter - chartXDim2 + chartXDim / (2 * this.timelinessDetailNumber) + i * chartXDim / this.timelinessDetailNumber;
          /* Rotate Dates */
          let tempText = this.publicationDetailTimelinessList[i].timezone.slice(11, 16);
          let tempRadium = (sectionXFilledDim - (2 * barGap) - dateFontSize);
          let angle = 0;
          if (tempRadium > p.textWidth(tempText)) tempRadium = p.textWidth(tempText);
          if (tempRadium > 0) angle = p.acos(tempRadium / p.textWidth(tempText));
          else angle = p.PI/2;
          let sinOfAngleTemp = p.sin(angle);
          if (sinOfAngleTemp < 0.001) {
            sinOfAngleTemp = 0.001;
          }
          let sinOfAngle = sinOfAngleTemp * (p.textWidth(tempText) / 2);
          p.push();
          p.translate(sectionXCenter, yCenter + chartYDim2 + sinOfAngle + 2 * dateFontSize);
          if (angle > p.PI / 2) angle = p.PI / 2;
          if (angle < 0) angle = 0;
          p.rotate(-angle);
          p.fill(lineColor);
          p.noStroke();
          p.textSize(dateFontSize);
          tempText = tempText + "\n";
          
          p.text(tempText, 0, 0);
          p.pop();
        }
        for (var i = 0; i < this.timelinessDetailNumber; i++) {
          let sectionXCenter = xCenter - chartXDim2 + chartXDim / (2 * this.timelinessDetailNumber) + i * chartXDim / this.timelinessDetailNumber;
          /* if mouse is on bar */
          if (p.mouseX > sectionXCenter - (chartXDim / this.timelinessDetailNumber)/2 + tx && p.mouseX < sectionXCenter + (chartXDim / this.timelinessDetailNumber)/2 + tx
                && p.mouseY > yCenter - chartYDim2 + ty && p.mouseY < yCenter + chartYDim2 + 2 * dateFontSize + ty) {

            /* Tooltip line */
            p.stroke(230);
            p.line(sectionXCenter, yCenter - chartYDim2, sectionXCenter, yCenter + chartYDim2);

            /* Tooltip */
            p.textSize(valueFontSize);
            p.noStroke();
            p.fill(lineColor);
            p.textAlign(p.CENTER, p.CENTER);
            p.text((this.publicationDetailTimelinessList[i].timeliness! == null || this.publicationDetailTimelinessList[i].timeliness! == -1) ? "NaN" : this.publicationDetailTimelinessList[i].timeliness! < this.millisPer72Hours ? this.millisToHHMMSS(this.publicationDetailTimelinessList[i].timeliness!) : ">72h",
                    sectionXCenter, yCenter - chartYDim2 - 2 * dateFontSize);
          }
        }

        /* Scheme */
        p.textAlign(p.RIGHT, p.CENTER);
        p.noFill();
        p.stroke(lineColor);
        p.line(xCenter - chartXDim2, yCenter + chartYDim2, xCenter - chartXDim2, yCenter - chartYDim2);
        p.line(xCenter - chartXDim2, yCenter + chartYDim2, xCenter + chartXDim2, yCenter + chartYDim2);
        /* Zero text */
        p.fill(lineColor);
        p.noStroke();
        p.textSize(dateFontSize);
        p.text("0s", xCenter - chartXDim2 - 10, yCenter + chartYDim2);
        p.stroke(lineColor);
        p.line(xCenter - chartXDim2 - 5, yCenter + chartYDim2, xCenter - chartXDim2, yCenter + chartYDim2);
        p.line(xCenter - chartXDim2, yCenter + chartYDim2 + 5, xCenter - chartXDim2, yCenter + chartYDim2);
        /* yAxis text */
        for (var i = 0; i < nLines; i++) {
          p.fill(lineColor);
          p.noStroke();
          p.text(this.millisToHHMMSS(maxValue / (nLines / (i + 1))), xCenter - chartXDim2 - 15, yCenter + chartYDim2 - (i + 1) * chartYDim / nLines + 1);
          p.stroke(lineColor);
          p.line(xCenter - chartXDim2 - 5, yCenter + chartYDim2 - (i + 1) * chartYDim / nLines, xCenter - chartXDim2, yCenter + chartYDim2 - (i + 1) * chartYDim / nLines)
        }
      }

      p.getBaseLog = (x: number, y: number) => {
        return Math.log(y) / Math.log(x);
      }

    }, this.el.nativeElement);
  }

  /* Function to convert [r, g, b] colors to html string: "#rrggbb" */
  rgbConvertToString(col: [number, number, number]) {
    let color: string = "#" + col[0].toString(16).padStart(2, '0') + col[1].toString(16).padStart(2, '0') + col[2].toString(16).padStart(2, '0');
    return color;
  }

  /* Function to convert #rrggbb colors to array: [r, g, b] */
  rgbConvertToArray(col: string) {
    if (col.length != 7) {
      return [100, 200, 250];
    }
    if (col.charAt(0) != '#') return [200, 0, 0];
    var r = parseInt(col.slice(1, 3), 16);
    var g = parseInt(col.slice(3, 5), 16);
    var b = parseInt(col.slice(5, 7), 16);
    let color = [r, g, b];
    return color;
  }

  getTimelinessHexColorFromSeconds(seconds: number) {
    if (seconds > this.timelinessColors[0].threshold) {
      return this.timelinessColors[0].color;
    }
    for (var i = 1; i < this.timelinessColors.length - 1; i++) {
      if (seconds > this.timelinessColors[i].threshold && seconds <= this.timelinessColors[i-1].threshold) {
        return this.timelinessColors[i].color;
      }
    }
    if (seconds <= this.timelinessColors[this.timelinessColors.length - 2].threshold) {
      return this.timelinessColors[this.timelinessColors.length - 1].color;
    }
    return "#000000";
  }
  getTimelinessIntsColorFromSeconds(seconds: number) {
    if (seconds > this.timelinessColors[0].threshold) {
      return this.rgbConvertToArray(this.timelinessColors[0].color);
    }
    for (var i = 1; i < this.timelinessColors.length; i++) {
      if (seconds > this.timelinessColors[i].threshold && seconds <= this.timelinessColors[i-1].threshold) {
        return this.rgbConvertToArray(this.timelinessColors[i].color);
      }
    }
    return [0, 0, 0];
  }

  secondsToHHMMSS(secondsTot: any) {
    if (typeof secondsTot === "string") {
      secondsTot = parseInt(secondsTot, 10);
    }
    var sec_num = secondsTot;
    var hours   = Math.floor(sec_num / 3600);
    var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
    var seconds = sec_num - (hours * 3600) - (minutes * 60);
    var timeStr = hours.toString(10).padStart(2, '0') + "h:" + minutes.toString(10).padStart(2, '0') + "m:" + seconds.toString(10).padStart(2, '0') + "s";
    return timeStr;
  }

  millisToHHMMSS(millisTot: any) {
    if (typeof millisTot === "string") {
      millisTot = parseInt(millisTot, 10);
    }
    var millis_num = millisTot;
    var sec_num = millis_num/1000;
    var hours   = Math.floor(sec_num / 3600);
    var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
    var seconds = Math.floor(sec_num) - (hours * 3600) - (minutes * 60);
    var timeStr = hours.toString(10).padStart(2, '0') + "h:" + minutes.toString(10).padStart(2, '0') + "m:" + seconds.toString(10).padStart(2, '0') + "s";
    return timeStr;
  }

  millisToHHMM(millisTot: any) {
    if (typeof millisTot === "string") {
      millisTot = parseInt(millisTot, 10);
    }
    var millis_num = millisTot;
    var sec_num = millis_num/1000;
    var hours   = Math.floor(sec_num / 3600);
    var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
    var timeStr = hours.toString(10).padStart(2, '0') + "h:" + minutes.toString(10).padStart(2, '0') + "m";
    return timeStr;
  }

  getWeekEndDateText(weekStartText: string) {
    return new Date(Date.parse(weekStartText) + (this.millisPerDay * 6)).toISOString().slice(0, 10)
  }

  getWeekNumber(date: string) {
    return this.dateService.getWeekNumber(date);
  }
}
