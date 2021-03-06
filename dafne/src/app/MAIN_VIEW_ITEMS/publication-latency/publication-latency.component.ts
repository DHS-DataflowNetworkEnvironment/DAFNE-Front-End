import { Component, OnInit, ElementRef } from '@angular/core';
import { AuthenticationService } from '../../services/authentication.service';
import { AlertComponent } from '../../alert/alert.component';
import { IDatePickerConfig } from 'ng2-date-picker';
import { Latency, DayLatency } from '../../models/latency';
import { AppConfig } from '../../services/app.config';
import { CsvDataService } from '../../services/csv-data.service';
import * as p5 from 'p5';

@Component({
  selector: 'app-publication-latency',
  templateUrl: './publication-latency.component.html',
  styleUrls: ['./publication-latency.component.css']
})
export class PublicationLatencyComponent implements OnInit {

  public p5Chart;

  public localCentre = {
    id: -1,
    name: "",
    color: "#ffffff"
  };

  public latencyDaysNumber: number = 0;
  public latencyWeeksNumber: number = 0;
  public requestedDaysNumber: number = 0;
  public requestedWeeksNumber: number = 0;
  public latencyDetailNumber: number = 0;
  public millisPerDay = 86400000;
  public millisPerWeek:number = this.millisPerDay * 7;
  public maxDays: number = 30;  // set 30 for 31 days of latency.
  public millisPerMaxPeriod = this.millisPerDay * this.maxDays;
  public maxDaysWindow: number;  // this should be retrieved from BE. set 89 for 90 days.
  public millisPerMaxWindow: number;
  public weekdayShift: number = 0;
  public weekdayStopShift: number = 0;

  public today = new Date();
  public todayDate: string = this.today.toISOString().slice(0, 10);

  public initialStartDayMillis = Date.parse(this.todayDate) - this.millisPerMaxPeriod;
  public startDateTemp = new Date(this.initialStartDayMillis);
  public startDate: string = this.startDateTemp.toISOString().slice(0, 10);

  public stopDate = this.todayDate;
  public startDatePickerConfig: IDatePickerConfig = {
    format: "YYYY-MM-DD",
    firstDayOfWeek: "mo",
    min: "2010-01-01",
    max: this.todayDate,
    unSelectOnClick: false
  };
  public stopDatePickerConfig: IDatePickerConfig = {
    format: "YYYY-MM-DD",
    firstDayOfWeek: "mo",
    min: "2010-01-01",
    max: this.todayDate,
    unSelectOnClick: false
  };
  public selectorText = [
    "Bar Chart",
    "Line Chart"
  ];
  public chartType: string = this.selectorText[0];
  public doResetZoom: boolean = false;

  public publicationLatencyList: Array<Latency> = [];
  public publicationDetailLatencyList: Array<DayLatency> = [];
  public requestedPublicationLatencyList: Array<Latency> = [];

  public mouseIsOnList: Array<boolean> = Array.apply(false, Array(30)).map(function () {});
  public showDetailLatency: boolean = false;
  public latencyDetailDate: string = "";

  public latencyColors;
  public tempSelectedFilterSyncLabel;
  public selectedFilterSyncLabel;
  public precWeekly_selectedFilterSyncLabel;
  public precWeekly_requestedPublicationLatencyList: Array<Latency> = [];
  public precWeekly_startDate;
  public precWeekly_stopDate;
  public precWeekly_requestedWeeksNumber;
  public precDaily_selectedFilterSyncLabel;
  public precDaily_requestedPublicationLatencyList: Array<Latency> = [];
  public precDaily_startDate;
  public precDaily_stopDate;
  public precDaily_requestedDaysNumber;

  public syncServiceUrl: Array<string>;
  public syncList;
  public tempSelectedSyncId: number;

  public isWeekly: boolean = false;
  public askForWeekly: boolean = false;
  public firstDailySubmitted: boolean = false;
  public firstWeeklySubmitted: boolean = false;

  constructor(
    public authenticationService: AuthenticationService,
    private csvService: CsvDataService,
    private el: ElementRef,
    private alert: AlertComponent,
  ) {
    this.latencyColors = AppConfig.settings.latencyColors;
  }

  ngOnInit(): void {
    this.authenticationService.getAllCentres().subscribe(
      (res: object) => {
        /* Get Local Centre */
        if (Object.values(res).filter((x) => x.local == true)[0]) {
          this.localCentre = Object.values(res).filter((x) => x.local == true)[0];
          /* Get Synchronizers to fill the filter */
          this.authenticationService.getSynchronizersV2().subscribe(
            (res: object) => {
              this.syncList = [];              
              for (var i = 0, j = 0; i < Object.keys(res).length; i++) {
                var tempList = res[i].synchronizers;
                this.syncList = this.syncList.concat(tempList);
                for (var k = j; k < Object.keys(this.syncList).length; k++) {                  
                  this.syncList[k]["serviceUrl"] = res[i].serviceUrl;
                }
                j = Object.keys(this.syncList).length;
              }
              this.tempSelectedFilterSyncLabel = this.syncList[0].Label;
              this.authenticationService.getLatencyRollingPeriod().subscribe(
                (res: any) => {
                  this.maxDaysWindow = res - 1;
                  this.millisPerMaxWindow = this.millisPerDay * this.maxDaysWindow;
                  let tempMinDate = new Date(Date.parse(this.todayDate) - this.millisPerMaxWindow).toISOString().slice(0, 10);

                  this.startDatePickerConfig = {
                    format: "YYYY-MM-DD",
                    firstDayOfWeek: "mo",
                    min: tempMinDate,
                    max: this.todayDate,
                    unSelectOnClick: false
                  };
                  this.stopDatePickerConfig = {
                    format: "YYYY-MM-DD",
                    firstDayOfWeek: "mo",
                    min: tempMinDate,
                    max: this.todayDate,
                    unSelectOnClick: false
                  };
                }
              );
            }
          );
        } else {
          this.localCentre = {
            id: -1,
            name: "No Local",
            color: "#ffffff"
          };
          this.alert.showErrorAlert("No local Centre is set", "Please setup one Centre as local");
        }
      }
    );
    this.init_P5();
  }

  onFilterSyncChange(sync) {
    this.tempSelectedFilterSyncLabel = sync.target.value;
  }

  onDateClick(event) {
    event.stopPropagation();
  }
  onStartDateChanged(date) {
    let tempMillisDate: number = 0;
    if (this.askForWeekly == true) {
      tempMillisDate = (Date.parse(date) + this.millisPerMaxWindow);
      if (Date.parse(this.stopDate) > tempMillisDate) {
        this.alert.showErrorAlert("Check Date Range", "Please select a maximum range of 90 days");
        let tempDate = new Date(tempMillisDate);
        this.stopDate = tempDate.toISOString().slice(0, 10);
      }
      if (Date.parse(date) > Date.parse(this.stopDate)) {
        this.alert.showErrorAlert("Check Date Range", "Start date cannot be later than stop date");
        this.stopDate = date;
      }
    } else {
      tempMillisDate = (Date.parse(date) + this.millisPerMaxPeriod);
      if (Date.parse(this.stopDate) > tempMillisDate) {
        this.alert.showErrorAlert("Check Date Range", "Please select a maximum range of 31 days");
        let tempDate = new Date(tempMillisDate);
        this.stopDate = tempDate.toISOString().slice(0, 10);
      }
      if (Date.parse(date) > Date.parse(this.stopDate)) {
        this.alert.showErrorAlert("Check Date Range", "Start date cannot be later than stop date");
        this.stopDate = date;
      }
    }
  }

  onStopDateChanged(date) {
    let tempMillisDate: number = 0;
    if (this.askForWeekly == true) {
      tempMillisDate = (Date.parse(date) - this.millisPerMaxWindow);
      if (Date.parse(this.startDate) < tempMillisDate) {
        this.alert.showErrorAlert("Check Date Range", "Please select a maximum range of 90 days");
        let tempDate = new Date(tempMillisDate);
        this.startDate = tempDate.toISOString().slice(0, 10);
      }
      if (Date.parse(date) < Date.parse(this.startDate)) {
        this.alert.showErrorAlert("Check Date Range", "Stop date cannot be earlier than start date");
        this.startDate = date;
      }
    } else {
      tempMillisDate = (Date.parse(date) - this.millisPerMaxPeriod);
      if (Date.parse(this.startDate) < tempMillisDate) {
        this.alert.showErrorAlert("Check Date Range", "Please select a maximum range of 31 days");
        let tempDate = new Date(tempMillisDate);
        this.startDate = tempDate.toISOString().slice(0, 10);
      }
      if (Date.parse(date) < Date.parse(this.startDate)) {
        this.alert.showErrorAlert("Check Date Range", "Stop date cannot be earlier than start date");
        this.startDate = date;
      }
    }
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
      this.alert.showErrorAlert("No local Centre is set", "Please setup one Centre as local");
    } else {
      this.latencyDaysNumber = 0;
      this.latencyWeeksNumber = 0;
      this.requestedDaysNumber = 0;
      this.requestedWeeksNumber = 0;
      let tempStopDate = new Date(this.stopDate);
      let tempStartDate = new Date(this.startDate);
      let tempTimeDifference = tempStopDate.getTime() - tempStartDate.getTime();

      this.tempSelectedSyncId = this.syncList.filter((x) => x.Label == this.tempSelectedFilterSyncLabel)[0].Id;
      let body: object = {
        "startDate": this.startDate.concat("T00:00:00"),
        "stopDate": this.stopDate.concat("T23:59:59"),
        "synchId": this.tempSelectedSyncId,
        "synchLabel": this.tempSelectedFilterSyncLabel,
        "backendUrl": this.syncList.filter((x) => x.Label == this.tempSelectedFilterSyncLabel)[0].serviceUrl
      }
      
      let weeklyCheckbox: HTMLInputElement = <HTMLInputElement>document.getElementById("weekly-checkbox");
      if (weeklyCheckbox.checked == true) {
        /* Weekly */
        this.isWeekly = true;
        this.authenticationService.getPublicationLatencyWeekly(this.localCentre.id, body).subscribe(
          (res) => {
            this.latencyWeeksNumber = 0;
            if (res.centreId == this.localCentre.id) {
              this.selectedFilterSyncLabel = this.tempSelectedFilterSyncLabel;
              this.latencyWeeksNumber = res.values.length;
              this.weekdayShift = (tempStartDate.getDay() == 0 ? 6 : (tempStartDate.getDay() - 1));
              this.weekdayStopShift = (tempStopDate.getDay() == 0 ? 0 : (7 - tempStopDate.getDay()));
              this.requestedWeeksNumber = Math.ceil((((tempTimeDifference + (this.weekdayShift + this.weekdayStopShift) * this.millisPerDay ) / this.millisPerDay) + 1) / 7);
              this.requestedPublicationLatencyList = [];
              this.publicationLatencyList = res.values;

              for (var i = 0; i < this.requestedWeeksNumber; i++) {
                this.requestedPublicationLatencyList[i] = {
                  day: new Date(Date.parse(this.startDate) - (this.weekdayShift * this.millisPerDay) + (i * this.millisPerWeek)).toISOString().slice(0,10),
                  centre_id: -1,
                  synch_id: -1,
                  synch_label: "",
                  average_fe: null,
                  average_be: null,
                  average_latency: null,
                  number_of_measurements: 0,
                  source: ""
                }
                for (var k = 0; k < this.latencyWeeksNumber; k++) {
                  if (this.publicationLatencyList[k].day == this.requestedPublicationLatencyList[i].day) {
                    if (this.publicationLatencyList[k].average_fe == null) {
                      if (this.publicationLatencyList[k].average_be == null) {
                        this.publicationLatencyList[k].source = "null";
                        this.publicationLatencyList[k].average_latency = -1;
                      } else {
                        this.publicationLatencyList[k].source = "BE";
                      }                  
                    } else if (this.publicationLatencyList[k].average_fe > this.publicationLatencyList[k].average_latency) {
                      this.publicationLatencyList[k].source = "FE+BE";
                    } else {
                      this.publicationLatencyList[k].source = "FE";
                    }
                    this.requestedPublicationLatencyList[i] = this.publicationLatencyList[k];
                  }
                }
              }
              this.showDetailLatency = false;
              this.p5Chart.setClickTimeoutId(undefined);
              this.p5Chart.windowResized();

              /* Save Last Data */
              this.precWeekly_selectedFilterSyncLabel = this.selectedFilterSyncLabel;
              this.precWeekly_requestedPublicationLatencyList = this.requestedPublicationLatencyList;
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
        this.authenticationService.getPublicationLatency(this.localCentre.id, body).subscribe(
          (res) => {
            this.latencyDaysNumber = 0;
            if (res.centreId == this.localCentre.id) {
              this.selectedFilterSyncLabel = this.tempSelectedFilterSyncLabel;
              this.latencyDaysNumber = res.values.length;
              this.requestedDaysNumber = tempTimeDifference / (1000 * 3600 * 24) + 1;
              this.requestedPublicationLatencyList = [];
              this.publicationLatencyList = res.values;

              for (var i = 0; i < this.requestedDaysNumber; i++) {
                this.requestedPublicationLatencyList[i] = {
                  day: new Date(Date.parse(this.startDate) + (i * this.millisPerDay)).toISOString().slice(0,10),
                  centre_id: -1,
                  synch_id: -1,
                  synch_label: "",
                  average_fe: null,
                  average_be: null,
                  average_latency: null,
                  number_of_measurements: 0,
                  source: ""
                }
                for (var k = 0; k < this.latencyDaysNumber; k++) {
                  if (this.publicationLatencyList[k].day == this.requestedPublicationLatencyList[i].day) {
                    if (this.publicationLatencyList[k].average_fe == null) {
                      if (this.publicationLatencyList[k].average_be == null) {
                        this.publicationLatencyList[k].source = "null";
                        this.publicationLatencyList[k].average_latency = -1;
                      } else {
                        this.publicationLatencyList[k].source = "BE";
                      }                  
                    } else if (this.publicationLatencyList[k].average_fe > this.publicationLatencyList[k].average_latency) {
                      this.publicationLatencyList[k].source = "FE+BE";
                    } else {
                      this.publicationLatencyList[k].source = "FE";
                    }
                    this.requestedPublicationLatencyList[i] = this.publicationLatencyList[k];
                  }
                }
              }
              this.showDetailLatency = false;
              this.p5Chart.setClickTimeoutId(undefined);
              this.p5Chart.windowResized();

              /* Save Last Data */
              this.precDaily_selectedFilterSyncLabel = this.selectedFilterSyncLabel;
              this.precDaily_requestedPublicationLatencyList = this.requestedPublicationLatencyList;
              this.precDaily_startDate = this.startDate;
              this.precDaily_stopDate = this.stopDate;
              this.precDaily_requestedDaysNumber = this.requestedDaysNumber;
            }
            this.firstDailySubmitted = true;
          }
        );
      }
    }
  }

  onDetailLatencyReq(date: string) {
    /* Retrieve Detailed Day Latency */
    this.tempSelectedSyncId = this.syncList.filter((x) => x.Label == this.tempSelectedFilterSyncLabel)[0].Id;
    let body: object = {
      "date": date,
      "synchId": this.tempSelectedSyncId,
      "synchLabel": this.tempSelectedFilterSyncLabel,
      "backendUrl": this.syncList.filter((x) => x.Label == this.tempSelectedFilterSyncLabel)[0].serviceUrl
    }
    
    this.authenticationService.getPublicationLatencyDetail(this.localCentre.id, body).subscribe(
      (res) => {
        this.latencyDetailNumber = 0;
        this.selectedFilterSyncLabel = this.tempSelectedFilterSyncLabel;

        if (res.centreId == this.localCentre.id) {
          this.latencyDetailNumber = res.values.length;
          this.publicationDetailLatencyList = res.values;

          for (var i = 0; i < this.latencyDetailNumber; i++) {
            if (this.publicationDetailLatencyList[i].latency_fe != null) {
              this.publicationDetailLatencyList[i].source = 'FE';
              this.publicationDetailLatencyList[i].latency = this.publicationDetailLatencyList[i].latency_fe;
            } else if (this.publicationDetailLatencyList[i].latency_fe == null 
              && this.publicationDetailLatencyList[i].latency_be != null) {
                this.publicationDetailLatencyList[i].source = 'BE';
                this.publicationDetailLatencyList[i].latency = this.publicationDetailLatencyList[i].latency_be;
            } else {
              this.publicationDetailLatencyList[i].source = 'null';
              this.publicationDetailLatencyList[i].latency = null;
            }
          }
          
          this.showDetailLatency = true;
          this.p5Chart.setClickTimeoutId(undefined);
          this.p5Chart.windowResized();
        }
      }
    );
  }

  onBackToPeriodClicked() {
    if (this.showDetailLatency) {
      this.showDetailLatency = false;
      this.p5Chart.setClickTimeoutId(undefined);
      this.p5Chart.windowResized();
      (<HTMLInputElement>document.getElementById("weekly-checkbox")).checked = false;
    }
  }

  onBackToDailyClicked() {
    this.showDetailLatency = false;
    this.askForWeekly = false;
    this.isWeekly = false;
    this.selectedFilterSyncLabel = this.precDaily_selectedFilterSyncLabel;
    this.tempSelectedFilterSyncLabel = this.selectedFilterSyncLabel;
    this.requestedPublicationLatencyList = this.precDaily_requestedPublicationLatencyList;
    this.startDate = this.precDaily_startDate;
    this.stopDate = this.precDaily_stopDate;
    this.requestedDaysNumber = this.precDaily_requestedDaysNumber;
    (<HTMLInputElement>document.getElementById("weekly-checkbox")).checked = false;
    (<HTMLSelectElement>document.getElementById("synchronizer-select")).value = this.selectedFilterSyncLabel;
    this.p5Chart.setClickTimeoutId(undefined);
    this.p5Chart.windowResized();
  }

  onBackToWeeklyClicked() {
    this.showDetailLatency = false;
    this.askForWeekly = true;
    this.isWeekly = true;
    this.selectedFilterSyncLabel = this.precWeekly_selectedFilterSyncLabel;
    this.tempSelectedFilterSyncLabel = this.selectedFilterSyncLabel;
    this.requestedPublicationLatencyList = this.precWeekly_requestedPublicationLatencyList;
    this.startDate = this.precWeekly_startDate;
    this.stopDate = this.precWeekly_stopDate;
    this.requestedWeeksNumber = this.precWeekly_requestedWeeksNumber;
    (<HTMLInputElement>document.getElementById("weekly-checkbox")).checked = true;
    (<HTMLSelectElement>document.getElementById("synchronizer-select")).value = this.selectedFilterSyncLabel;
    this.p5Chart.setClickTimeoutId(undefined);
    this.p5Chart.windowResized();
  }

  toggleTable() {
    if (document.getElementById("data-table-container").style.display == "none") {
      /* Show */
      document.getElementById("main-column-container").style.height = "calc(100vh - 9rem - 12rem)";
      document.getElementById("p5PublicationLatencyCanvas-column-div").style.height = "calc(100vh - 25.5rem)";
      document.getElementById("data-table-container").style.display = "block";
    } else {
      /* Hide */
      document.getElementById("main-column-container").style.height = "calc(100vh - 9rem)";
      document.getElementById("p5PublicationLatencyCanvas-column-div").style.height = "calc(100vh - 13.5rem)"; 
      document.getElementById("data-table-container").style.display = "none";
    }
  }

  chartChangeTo(type: string) {
    this.chartType = type;
    this.doResetZoom = true;
  }

  saveAsCSV() {
    if (this.showDetailLatency) {
      /* Export Detail Latency */
      if (this.publicationDetailLatencyList.length > 0) {
        var csvContent: string = '';
        var table = <HTMLTableElement>document.getElementById('data-table');
        for (var h = 0; h < table.tHead.childElementCount; h++) {
          csvContent += table.tHead.children[h].textContent;
          if (h != table.tHead.childElementCount - 1) csvContent += ',';
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
          'DAFNE-Publication_Detail_Latency('
          + this.localCentre.name
          + ')_Sync('
          + this.selectedFilterSyncLabel 
          + ')_Date('
          + this.latencyDetailDate
          + ').csv', csvContent
        );
      }
    } else {
      if (this.isWeekly == true) {
        /* Export Weekly Latency */
        if (this.requestedPublicationLatencyList.length > 0) {
          var csvContent: string = '';
          var table = <HTMLTableElement>document.getElementById('data-table');
          for (var h = 0; h < table.tHead.childElementCount; h++) {
            csvContent += table.tHead.children[h].textContent;
            if (h != table.tHead.childElementCount - 1) csvContent += ',';
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
            'DAFNE-Publication_Weekly_Latency('
            + this.localCentre.name
            + ')_Sync('
            + this.selectedFilterSyncLabel 
            + ')_From('
            + this.startDate
            + ')_To('
            + this.stopDate
            + ').csv', csvContent
          );
        }
      } else {
        /* Export Daily Latency */
        if (this.requestedPublicationLatencyList.length > 0) {
          var csvContent: string = '';
          var table = <HTMLTableElement>document.getElementById('data-table');
          for (var h = 0; h < table.tHead.childElementCount; h++) {
            csvContent += table.tHead.children[h].textContent;
            if (h != table.tHead.childElementCount - 1) csvContent += ',';
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
            'DAFNE-Publication_Daily_Latency('
            + this.localCentre.name
            + ')_Sync('
            + this.selectedFilterSyncLabel 
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
    let canvas = document.getElementById("p5PublicationLatencyCanvas");
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

      let clickTimerId;

      p.setup = () => {
        canvasSpace = p.createCanvas(canvasWidth, canvasHeight).parent('p5PublicationLatencyCanvas');
        p.pixelDensity(1.0);
        p.smooth();
        p.frameRate(10);
        p.textFont('NotesESA-Reg');
        canvasSpace.mouseWheel(e => wheelZoom(e));
        
      };

      p.draw = () => {
        p.background(backgroundColor);
        p.windowResized();
        p.translate(tx, ty);

        this.mouseIsOnList = Array.apply(false, Array(31)).map(function () {});
        if (this.chartType == this.selectorText[0]) {
          if (this.showDetailLatency) {
            p.fillDayBarChart();
          } else {
            p.fillBarChart();
          }
        } else if (this.chartType == this.selectorText[1]) {
          if (this.showDetailLatency) {
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
              if (this.showDetailLatency == false) {
                if (this.isWeekly == true) {
                  for (var i = 0; i < this.requestedWeeksNumber; i++) {
                    if (this.mouseIsOnList[i] == true) {
                      this.startDate = this.requestedPublicationLatencyList[i].day;
                      let tempStopDateToCalendar = Date.parse(this.requestedPublicationLatencyList[i].day) + 6*this.millisPerDay;
                      if (tempStopDateToCalendar < Date.parse(this.stopDate)) {
                        this.stopDate = new Date(Date.parse(this.requestedPublicationLatencyList[i].day) + 6*this.millisPerDay).toISOString().slice(0, 10);
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
                      this.latencyDetailDate = this.requestedPublicationLatencyList[i].day;
                      this.onDetailLatencyReq(this.latencyDetailDate);
                    }
                  }
                }
              }
            }, 500)
          }      
        }  
      }

      p.setClickTimeoutId = (id) => {
        clickTimerId = id;    
      }

      function applyScale(s) {
        sf = sf * s;
        if (sf < 0.65) {
          sf = 0.65;
        } else {
          tx = p.mouseX * (1-s) + tx * s;
          ty = p.mouseY * (1-s) + ty * s;
        }        
      }

      function wheelZoom(e) {
        applyScale(e.deltaY < 0 ? 1.1 : 0.9);
        return false;
      }

      function resetZoom() {
        sf = 1.0;
        tx = 0;
        ty = 0;
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
            if (this.requestedPublicationLatencyList[i].average_latency > maxValue) {
              maxValue = this.requestedPublicationLatencyList[i].average_latency;
            }
          }
          if (maxValue == 0) maxValue = this.latencyColors[0].threshold;
  
          let sectionXFilledDim = (chartXDim / this.requestedWeeksNumber) / sectionScaleSingle;
          let sectionXFilledDim2 = sectionXFilledDim / 2;
          let barGap = sectionXFilledDim / barGapScale;
  
          /* Threshold Lines */
          for (var i = 0; i < this.latencyColors.length - 1; i++) {
            p.noFill();
            p.stroke(this.rgbConvertToArray(this.latencyColors[i+1].color));
            if (this.latencyColors[i].threshold * chartYDim / maxValue <= chartYDim) {
              p.line(xCenter - chartXDim2, yCenter + chartYDim2 - this.latencyColors[i].threshold * chartYDim / maxValue, xCenter + chartXDim2, yCenter + chartYDim2 - this.latencyColors[i].threshold * chartYDim / maxValue);
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
            let weekStartText = "from: " + this.requestedPublicationLatencyList[i].day + "\nto: ";
            let weekEndText = this.getWeekEndDateText(this.requestedPublicationLatencyList[i].day);
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
            if (this.requestedPublicationLatencyList[i].source == "BE") {
              tempText = tempText + "\n( BE )";
            } else if (this.requestedPublicationLatencyList[i].source == "FE+BE") {
              tempText = tempText + "\n( FE+BE )";
            } else {
              tempText = tempText + "\n";
            }
            p.text(tempText, 0, 0);
            p.pop();
            
            p.noFill();
            p.stroke(lineColor);
            p.line(xCenter - chartXDim2 + (i + 1) * chartXDim / this.requestedWeeksNumber, yCenter + chartYDim2 + 5, xCenter - chartXDim2 + (i + 1) * chartXDim / this.requestedWeeksNumber, yCenter + chartYDim2);
            /* Bars */
            p.rectMode(p.CORNER);
            if (this.requestedPublicationLatencyList[i].average_latency > this.latencyColors[0].threshold) {
              p.fill(this.rgbConvertToArray(this.latencyColors[0].color));
            } else if (this.requestedPublicationLatencyList[i].average_latency > this.latencyColors[1].threshold && this.requestedPublicationLatencyList[i].average_latency <= this.latencyColors[0].threshold) {
              p.fill(this.rgbConvertToArray(this.latencyColors[1].color));
            } else if (this.requestedPublicationLatencyList[i].average_latency > this.latencyColors[2].threshold && this.requestedPublicationLatencyList[i].average_latency <= this.latencyColors[1].threshold) {
              p.fill(this.rgbConvertToArray(this.latencyColors[2].color));
            } else if (this.requestedPublicationLatencyList[i].average_latency > this.latencyColors[3].threshold && this.requestedPublicationLatencyList[i].average_latency <= this.latencyColors[2].threshold) {
              p.fill(this.rgbConvertToArray(this.latencyColors[3].color));
            } else if (this.requestedPublicationLatencyList[i].average_latency >= this.latencyColors[4].threshold && this.requestedPublicationLatencyList[i].average_latency <= this.latencyColors[3].threshold) {
              p.fill(this.rgbConvertToArray(this.latencyColors[4].color));
            }
            
            if (this.requestedPublicationLatencyList[i].average_latency == 0) {
              p.stroke(this.rgbConvertToArray(this.latencyColors[4].color));
              p.line(sectionXCenter - sectionXFilledDim2, yCenter + chartYDim2, sectionXCenter + sectionXFilledDim2, yCenter + chartYDim2);
            }
            
            p.noStroke();
            p.rect(sectionXCenter - sectionXFilledDim2, yCenter + chartYDim2, sectionXFilledDim, -((this.requestedPublicationLatencyList[i].average_latency < 0 ? 0 : this.requestedPublicationLatencyList[i].average_latency * chartYDim / maxValue)));
  
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
              p.text((this.requestedPublicationLatencyList[i].average_latency == null || this.requestedPublicationLatencyList[i].average_latency == -1) ? "NaN" : this.millisToHHMMSS(this.requestedPublicationLatencyList[i].average_latency), 
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
            if (this.requestedPublicationLatencyList[i].average_latency > maxValue) {
              maxValue = this.requestedPublicationLatencyList[i].average_latency;
            }
          }
          if (maxValue == 0) maxValue = this.latencyColors[0].threshold;

          let sectionXFilledDim = (chartXDim / this.requestedDaysNumber) / sectionScaleSingle;
          let sectionXFilledDim2 = sectionXFilledDim / 2;
          let barGap = sectionXFilledDim / barGapScale;

          /* Threshold Lines */
          for (var i = 0; i < this.latencyColors.length - 1; i++) {
            p.noFill();
            p.stroke(this.rgbConvertToArray(this.latencyColors[i+1].color));
            if (this.latencyColors[i].threshold * chartYDim / maxValue <= chartYDim) {
              p.line(xCenter - chartXDim2, yCenter + chartYDim2 - this.latencyColors[i].threshold * chartYDim / maxValue, xCenter + chartXDim2, yCenter + chartYDim2 - this.latencyColors[i].threshold * chartYDim / maxValue);
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
            tempText = this.requestedPublicationLatencyList[i].day;
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
            if (this.requestedPublicationLatencyList[i].source == "BE") {
              tempText = tempText + "\n( BE )";
            } else if (this.requestedPublicationLatencyList[i].source == "FE+BE") {
              tempText = tempText + "\n( FE+BE )";
            } else {
              tempText = tempText + "\n";
            }
            p.text(tempText, 0, 0);
            p.pop();
            
            p.noFill();
            p.stroke(lineColor);
            p.line(xCenter - chartXDim2 + (i + 1) * chartXDim / this.requestedDaysNumber, yCenter + chartYDim2 + 5, xCenter - chartXDim2 + (i + 1) * chartXDim / this.requestedDaysNumber, yCenter + chartYDim2);
            
            /* Bars */
            p.rectMode(p.CORNER);
            if (this.requestedPublicationLatencyList[i].average_latency > this.latencyColors[0].threshold) {
              p.fill(this.rgbConvertToArray(this.latencyColors[0].color));
            } else if (this.requestedPublicationLatencyList[i].average_latency > this.latencyColors[1].threshold && this.requestedPublicationLatencyList[i].average_latency <= this.latencyColors[0].threshold) {
              p.fill(this.rgbConvertToArray(this.latencyColors[1].color));
            } else if (this.requestedPublicationLatencyList[i].average_latency > this.latencyColors[2].threshold && this.requestedPublicationLatencyList[i].average_latency <= this.latencyColors[1].threshold) {
              p.fill(this.rgbConvertToArray(this.latencyColors[2].color));
            } else if (this.requestedPublicationLatencyList[i].average_latency > this.latencyColors[3].threshold && this.requestedPublicationLatencyList[i].average_latency <= this.latencyColors[2].threshold) {
              p.fill(this.rgbConvertToArray(this.latencyColors[3].color));
            } else if (this.requestedPublicationLatencyList[i].average_latency >= this.latencyColors[4].threshold && this.requestedPublicationLatencyList[i].average_latency <= this.latencyColors[3].threshold) {
              p.fill(this.rgbConvertToArray(this.latencyColors[4].color));
            }
            
            if (this.requestedPublicationLatencyList[i].average_latency == 0) {
              p.stroke(this.rgbConvertToArray(this.latencyColors[4].color));
              p.line(sectionXCenter - sectionXFilledDim2, yCenter + chartYDim2, sectionXCenter + sectionXFilledDim2, yCenter + chartYDim2);
            }
            
            p.noStroke();
            p.rect(sectionXCenter - sectionXFilledDim2, yCenter + chartYDim2, sectionXFilledDim, -(this.requestedPublicationLatencyList[i].average_latency < 0 ? 0 : this.requestedPublicationLatencyList[i].average_latency * chartYDim / maxValue));

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
              p.text((this.requestedPublicationLatencyList[i].average_latency == null || this.requestedPublicationLatencyList[i].average_latency == -1) ? "NaN" : this.millisToHHMMSS(this.requestedPublicationLatencyList[i].average_latency), 
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
            if (this.requestedPublicationLatencyList[i].average_latency > maxValue) {
              maxValue = this.requestedPublicationLatencyList[i].average_latency;
            }
          }
          if (maxValue == 0) maxValue = this.latencyColors[0].threshold;
          
          let xpoint: Array<number> = [];
          let ypoint: Array<number> = [];
          let sectionXFilledDim = (chartXDim / this.requestedWeeksNumber) / sectionScaleSingle;
          let sectionXFilledDim2 = sectionXFilledDim / 2;
          let barGap = sectionXFilledDim / barGapScale;

          /* Threshold Lines */
          for (var i = 0; i < this.latencyColors.length - 1; i++) {
            p.noFill();
            p.stroke(this.rgbConvertToArray(this.latencyColors[i + 1].color));
            if (this.latencyColors[i].threshold * chartYDim / maxValue <= chartYDim) {
              p.line(xCenter - chartXDim2, yCenter + chartYDim2 - this.latencyColors[i].threshold * chartYDim / maxValue, xCenter + chartXDim2, yCenter + chartYDim2 - this.latencyColors[i].threshold * chartYDim / maxValue);
            }
          }

          p.curveTightness(1.0);
          p.beginShape();
          p.rectMode(p.CORNER);

          for (var i = 0; i < this.requestedWeeksNumber; i++) {
            let sectionXCenter = xCenter - chartXDim2 + chartXDim / (2 * this.requestedWeeksNumber) + i * chartXDim / this.requestedWeeksNumber;
            xpoint[i] = sectionXCenter;
            ypoint[i] = yCenter + chartYDim2 -((this.requestedPublicationLatencyList[i].average_latency < 0 ? 0 : this.requestedPublicationLatencyList[i].average_latency) * chartYDim / maxValue);
            
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
            let weekStartText = "from: " + this.requestedPublicationLatencyList[i].day + "\nto: ";
            let weekEndText = this.getWeekEndDateText(this.requestedPublicationLatencyList[i].day);
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
            if (this.requestedPublicationLatencyList[i].source == "BE") {
              tempText = tempText + "\n( BE )";
            } else if (this.requestedPublicationLatencyList[i].source == "FE+BE") {
              tempText = tempText + "\n( FE+BE )";
            } else {
              tempText = tempText + "\n";
            }
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
              p.text((this.requestedPublicationLatencyList[i].average_latency == null || this.requestedPublicationLatencyList[i].average_latency == -1) ? "NaN" : this.millisToHHMMSS(this.requestedPublicationLatencyList[i].average_latency), 
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
            if (this.requestedPublicationLatencyList[i].average_latency > maxValue) {
              maxValue = this.requestedPublicationLatencyList[i].average_latency;
            }
          }
          if (maxValue == 0) maxValue = this.latencyColors[0].threshold;
          
          let xpoint: Array<number> = [];
          let ypoint: Array<number> = [];
          let sectionXFilledDim = (chartXDim / this.requestedDaysNumber) / sectionScaleSingle;
          let sectionXFilledDim2 = sectionXFilledDim / 2;
          let barGap = sectionXFilledDim / barGapScale;

          /* Threshold Lines */
          for (var i = 0; i < this.latencyColors.length - 1; i++) {
            p.noFill();
            p.stroke(this.rgbConvertToArray(this.latencyColors[i + 1].color));
            if (this.latencyColors[i].threshold * chartYDim / maxValue <= chartYDim) {
              p.line(xCenter - chartXDim2, yCenter + chartYDim2 - this.latencyColors[i].threshold * chartYDim / maxValue, xCenter + chartXDim2, yCenter + chartYDim2 - this.latencyColors[i].threshold * chartYDim / maxValue);
            }
          }

          p.curveTightness(1.0);
          p.beginShape();
          p.rectMode(p.CORNER);

          for (var i = 0; i < this.requestedDaysNumber; i++) {
            let sectionXCenter = xCenter - chartXDim2 + chartXDim / (2 * this.requestedDaysNumber) + i * chartXDim / this.requestedDaysNumber;
            xpoint[i] = sectionXCenter;
            ypoint[i] = yCenter + chartYDim2 -((this.requestedPublicationLatencyList[i].average_latency < 0 ? 0 : this.requestedPublicationLatencyList[i].average_latency) * chartYDim / maxValue);
            
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
            let tempText = this.requestedPublicationLatencyList[i].day;
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
            if (this.requestedPublicationLatencyList[i].source == "BE") {
              tempText = tempText + "\n( BE )";
            } else if (this.requestedPublicationLatencyList[i].source == "FE+BE") {
              tempText = tempText + "\n( FE+BE )";
            } else {
              tempText = tempText + "\n";
            }
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
              p.text((this.requestedPublicationLatencyList[i].average_latency == null || this.requestedPublicationLatencyList[i].average_latency == -1) ? "NaN" : this.millisToHHMMSS(this.requestedPublicationLatencyList[i].average_latency), 
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
        for (var i = 0; i < this.latencyDetailNumber; i++) {
          if (this.publicationDetailLatencyList[i].latency > maxValue) {
            maxValue = this.publicationDetailLatencyList[i].latency;
          }
        }
        if (maxValue == 0) maxValue = this.latencyColors[0].threshold;
        
        let sectionXFilledDim = (chartXDim / this.latencyDetailNumber) / sectionScaleSingle;
        let sectionXFilledDim2 = sectionXFilledDim / 2;
        let barGap = sectionXFilledDim / barGapScale;

        /* Threshold Lines */
        for (var i = 0; i < this.latencyColors.length - 1; i++) {
          p.noFill();
          p.stroke(this.rgbConvertToArray(this.latencyColors[i + 1].color));
          if (this.latencyColors[i].threshold * chartYDim / maxValue <= chartYDim) {
            p.line(xCenter - chartXDim2, yCenter + chartYDim2 - this.latencyColors[i].threshold * chartYDim / maxValue, xCenter + chartXDim2, yCenter + chartYDim2 - this.latencyColors[i].threshold * chartYDim / maxValue);
          }
        }

        let datePrintAddendum = Math.ceil(((this.latencyDetailNumber * 2) / 100) * (1/sf));
        for (var i = 0; i < this.latencyDetailNumber; i = i + datePrintAddendum) {
          let sectionXCenter = xCenter - chartXDim2 + chartXDim / (2 * this.latencyDetailNumber) + i * chartXDim / this.latencyDetailNumber;

          /* xAxis Text */
          p.textAlign(p.CENTER, p.CENTER);
          p.fill(lineColor);
          p.noStroke();
          p.textSize(dateFontSize);
          /* Rotate Dates */
          let tempText = this.publicationDetailLatencyList[i].timezone.slice(11, 16);
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
          if (this.publicationDetailLatencyList[i].source == "BE") {
            tempText = tempText + "\n( BE )";
          } else {
            tempText = tempText + "\n";
          }
          p.text(tempText, 0, 0);
          p.pop();
        }
        for (var i = 0; i < this.latencyDetailNumber; i++) {
          let sectionXCenter = xCenter - chartXDim2 + chartXDim / (2 * this.latencyDetailNumber) + i * chartXDim / this.latencyDetailNumber;

          p.noFill();
          p.stroke(lineColor);
          p.line(xCenter - chartXDim2 + (i + 1) * chartXDim / this.latencyDetailNumber, yCenter + chartYDim2 + 5, xCenter - chartXDim2 + (i + 1) * chartXDim / this.latencyDetailNumber, yCenter + chartYDim2);
          /* Bars */
          p.rectMode(p.CORNER);
          if (this.publicationDetailLatencyList[i].latency > this.latencyColors[0].threshold) {
            p.fill(this.rgbConvertToArray(this.latencyColors[0].color));
          } else if (this.publicationDetailLatencyList[i].latency > this.latencyColors[1].threshold && this.publicationDetailLatencyList[i].latency <= this.latencyColors[0].threshold) {
            p.fill(this.rgbConvertToArray(this.latencyColors[1].color));
          } else if (this.publicationDetailLatencyList[i].latency > this.latencyColors[2].threshold && this.publicationDetailLatencyList[i].latency <= this.latencyColors[1].threshold) {
            p.fill(this.rgbConvertToArray(this.latencyColors[2].color));
          } else if (this.publicationDetailLatencyList[i].latency > this.latencyColors[3].threshold && this.publicationDetailLatencyList[i].latency <= this.latencyColors[2].threshold) {
            p.fill(this.rgbConvertToArray(this.latencyColors[3].color));
          } else if (this.publicationDetailLatencyList[i].latency >= this.latencyColors[4].threshold && this.publicationDetailLatencyList[i].latency <= this.latencyColors[3].threshold) {
            p.fill(this.rgbConvertToArray(this.latencyColors[4].color));
          }
          p.noStroke();
          p.rect(sectionXCenter - sectionXFilledDim2, yCenter + chartYDim2, sectionXFilledDim, -((this.publicationDetailLatencyList[i].latency < 0 ? 0 : this.publicationDetailLatencyList[i].latency) * chartYDim / maxValue));

          /* If mouse on bars */
          if (p.mouseX > sectionXCenter - (chartXDim / this.latencyDetailNumber)/2 + tx && p.mouseX < sectionXCenter + (chartXDim / this.latencyDetailNumber)/2 + tx
                && p.mouseY > yCenter - chartYDim2 + ty && p.mouseY < yCenter + chartYDim2 + 2 * dateFontSize + ty) {

            /* Selector box */
            p.stroke(230);
            p.fill(255, 30);
            p.rect(sectionXCenter - sectionXFilledDim2, yCenter - chartYDim2, sectionXFilledDim, chartYDim + 3 * dateFontSize);

            /* Tooltip */
            p.textSize(valueFontSize);
            p.noStroke();
            p.fill(lineColor);
            p.text((this.publicationDetailLatencyList[i].latency == null || this.publicationDetailLatencyList[i].latency == -1) ? "NaN" : this.millisToHHMMSS(this.publicationDetailLatencyList[i].latency), 
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
        for (var i = 0; i < this.latencyDetailNumber; i++) {
          if (this.publicationDetailLatencyList[i].latency > maxValue) {
            maxValue = this.publicationDetailLatencyList[i].latency;
          }
        }
        if (maxValue == 0) maxValue = this.latencyColors[0].threshold;
        
        let xpoint: Array<number> = [];
        let ypoint: Array<number> = [];
        
        let sectionXFilledDim = chartXDim / this.latencyDetailNumber;
        let sectionXFilledDim2 = sectionXFilledDim / 2;
        let barGap = sectionXFilledDim / barGapScale;

        /* Threshold Lines */
        for (var i = 0; i < this.latencyColors.length - 1; i++) {
          p.noFill();
          p.stroke(this.rgbConvertToArray(this.latencyColors[i + 1].color));
          if (this.latencyColors[i].threshold * chartYDim / maxValue <= chartYDim) {
            p.line(xCenter - chartXDim2, yCenter + chartYDim2 - this.latencyColors[i].threshold * chartYDim / maxValue, xCenter + chartXDim2, yCenter + chartYDim2 - this.latencyColors[i].threshold * chartYDim / maxValue);
          }
        }

        p.curveTightness(1.0);
        p.beginShape();
        p.stroke(255,255,0);
        p.noFill();
        p.rectMode(p.CORNER);

        for (var i = 0; i < this.latencyDetailNumber; i++) {
          let sectionXCenter = xCenter - chartXDim2 + chartXDim / (2 * this.latencyDetailNumber) + i * chartXDim / this.latencyDetailNumber;
          xpoint[i] = sectionXCenter;
          ypoint[i] = yCenter + chartYDim2 -((this.publicationDetailLatencyList[i].latency < 0 ? 0 : this.publicationDetailLatencyList[i].latency) * chartYDim / maxValue);
          
          /* Draw Curve */
          p.stroke(0,255,255);
          p.noFill();
          if (i == 0) p.curveVertex(xpoint[i], ypoint[i]);
          p.curveVertex(xpoint[i], ypoint[i]);          
          if (i == this.latencyDetailNumber - 1) p.curveVertex(xpoint[i], ypoint[i]);
        }
        p.endShape();

        for (var i = 0; i < this.latencyDetailNumber; i++) {
          let sectionXCenter = xCenter - chartXDim2 + chartXDim / (2 * this.latencyDetailNumber) + i * chartXDim / this.latencyDetailNumber;
          /* xAxis Lines */
          p.stroke(lineColor);
          p.line(xCenter - chartXDim2 + (i + 1) * chartXDim / this.latencyDetailNumber, yCenter + chartYDim2 + 5, xCenter - chartXDim2 + (i + 1) * chartXDim / this.latencyDetailNumber, yCenter + chartYDim2);
        }

        let datePrintAddendum = Math.ceil(((this.latencyDetailNumber * 2) / 100) * (1/sf));
        for (var i = 0; i < this.latencyDetailNumber; i = i + datePrintAddendum) {
          let sectionXCenter = xCenter - chartXDim2 + chartXDim / (2 * this.latencyDetailNumber) + i * chartXDim / this.latencyDetailNumber;
          /* Rotate Dates */
          let tempText = this.publicationDetailLatencyList[i].timezone.slice(11, 16);
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
          if (this.publicationDetailLatencyList[i].source == "BE") {
            tempText = tempText + "\n( BE )";
          } else {
            tempText = tempText + "\n";
          }
          p.text(tempText, 0, 0);
          p.pop();
        }
        for (var i = 0; i < this.latencyDetailNumber; i++) {
          let sectionXCenter = xCenter - chartXDim2 + chartXDim / (2 * this.latencyDetailNumber) + i * chartXDim / this.latencyDetailNumber;
          /* if mouse is on bar */
          if (p.mouseX > sectionXCenter - (chartXDim / this.latencyDetailNumber)/2 + tx && p.mouseX < sectionXCenter + (chartXDim / this.latencyDetailNumber)/2 + tx
                && p.mouseY > yCenter - chartYDim2 + ty && p.mouseY < yCenter + chartYDim2 + 2 * dateFontSize + ty) {

            /* Tooltip line */
            p.stroke(230);
            p.line(sectionXCenter, yCenter - chartYDim2, sectionXCenter, yCenter + chartYDim2);

            /* Tooltip */
            p.textSize(valueFontSize);
            p.noStroke();
            p.fill(lineColor);
            p.textAlign(p.CENTER, p.CENTER);
            p.text((this.publicationDetailLatencyList[i].latency == null || this.publicationDetailLatencyList[i].latency == -1) ? "NaN" : this.millisToHHMMSS(this.publicationDetailLatencyList[i].latency), 
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

  getLatencyHexColorFromSeconds(seconds: number) {
    if (seconds > this.latencyColors[0].threshold) {
      return this.latencyColors[0].color;
    }
    for (var i = 1; i < this.latencyColors.length - 1; i++) {
      if (seconds > this.latencyColors[i].threshold && seconds <= this.latencyColors[i-1].threshold) {
        return this.latencyColors[i].color;
      }
    }
    if (seconds <= this.latencyColors[this.latencyColors.length - 2].threshold) {
      return this.latencyColors[this.latencyColors.length - 1].color;
    }
    return "#000000";
  }
  getLatencyIntsColorFromSeconds(seconds: number) {
    if (seconds > this.latencyColors[0].threshold) {
      return this.rgbConvertToArray(this.latencyColors[0].color);
    }
    for (var i = 1; i < this.latencyColors.length; i++) {
      if (seconds > this.latencyColors[i].threshold && seconds <= this.latencyColors[i-1].threshold) {
        return this.rgbConvertToArray(this.latencyColors[i].color);
      }
    }
    return [0, 0, 0];
  }

  secondsToHHMMSS(secondsTot) {
    var sec_num = parseInt(secondsTot, 10);
    var hours   = Math.floor(sec_num / 3600);
    var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
    var seconds = sec_num - (hours * 3600) - (minutes * 60);
    var timeStr = hours.toString(10).padStart(2, '0') + "h:" + minutes.toString(10).padStart(2, '0') + "m:" + seconds.toString(10).padStart(2, '0') + "s";
    return timeStr;
  }

  millisToHHMMSS(millisTot) {
    var millis_num = parseInt(millisTot, 10);
    var sec_num = millis_num/1000;
    var hours   = Math.floor(sec_num / 3600);
    var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
    var seconds = Math.floor(sec_num) - (hours * 3600) - (minutes * 60);
    var timeStr = hours.toString(10).padStart(2, '0') + "h:" + minutes.toString(10).padStart(2, '0') + "m:" + seconds.toString(10).padStart(2, '0') + "s";
    return timeStr;
  }

  millisToHHMM(millisTot) {
    var millis_num = parseInt(millisTot, 10);
    var sec_num = millis_num/1000;
    var hours   = Math.floor(sec_num / 3600);
    var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
    var timeStr = hours.toString(10).padStart(2, '0') + "h:" + minutes.toString(10).padStart(2, '0') + "m";
    return timeStr;
  }

  getWeekEndDateText(weekStartText) {
    return new Date(Date.parse(weekStartText) + (this.millisPerDay * 6)).toISOString().slice(0, 10)
  }
}