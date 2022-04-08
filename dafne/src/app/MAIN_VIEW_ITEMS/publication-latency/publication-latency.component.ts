import { Component, OnInit, ElementRef } from '@angular/core';
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

  public tempDaysNumber: number = 0;
  public daysNumber: number = 30; /// THIS VALUE HAS TO BE TAKEN FROM A GET!!!!!!!!!!!
  public hoursNumber: number = 24; // EVALUATE HOW TO HANDLE DIFFERENT NUMBER OF READINGS PER DAY.
  public millisPerDay = 86400000;
  public maxDays = 29;
  public millisPerMaxPeriod = this.millisPerDay * this.maxDays;

  public today = new Date();
  public dd = String(this.today.getDate()).padStart(2, '0');
  public mm = String(this.today.getMonth() + 1).padStart(2, '0');
  public yyyy = this.today.getFullYear();
  public todayDate: string = this.yyyy + '-' + this.mm + '-' + this.dd;

  public initialStartDayMillis = Date.parse(this.todayDate) - (this.maxDays * this.millisPerDay);
  public startDateTemp = new Date(this.initialStartDayMillis);
  public ddStart = String(this.startDateTemp.getDate()).padStart(2, '0');
  public mmStart = String(this.startDateTemp.getMonth() + 1).padStart(2, '0');
  public yyyyStart = this.startDateTemp.getFullYear();
  public startDate: string = this.yyyyStart + '-' + this.mmStart + '-' + this.ddStart;

  public stopDate = this.todayDate;
  public startDatePickerConfig: IDatePickerConfig = {
    format: "YYYY-MM-DD",
    firstDayOfWeek: "mo",
    min: "2010-01-01",
    max: this.todayDate
  };
  public stopDatePickerConfig: IDatePickerConfig = {
    format: "YYYY-MM-DD",
    firstDayOfWeek: "mo",
    min: "2010-01-01",
    max: this.todayDate
  };
  public selectorText = [
    "Bar Chart",
    "Line Chart"
  ];
  public chartType: string = this.selectorText[0];
  public doResetZoom: boolean = false;

  public fakePublicationLatencyJson = {
    centreId: 0,
    values: [
      {date: "2022-01-20", latency: 2000, source: "FE"},
      {date: "2022-01-21", latency: 20, source: "FE"},
      {date: "2022-01-22", latency: 6500, source: "FE"},
      {date: "2022-01-23", latency: 740, source: "FE"},
      {date: "2022-01-24", latency: 9800, source: "FE"},
      {date: "2022-01-25", latency: 9600, source: "BE"},
      {date: "2022-01-26", latency: 98000, source: "FE"},
      {date: "2022-01-27", latency: 300000, source: "FE"},
      {date: "2022-01-28", latency: 298000, source: "FE"},
      {date: "2022-01-29", latency: 28000, source: "FE"},
      {date: "2022-01-30", latency: 177000, source: "FE"},
      {date: "2022-01-31", latency: 0, source: "FE"},
      {date: "2022-02-01", latency: 97, source: "FE"},
      {date: "2022-02-02", latency: 122, source: "BE"},
      {date: "2022-02-03", latency: 0, source: "FE"},
      {date: "2022-02-04", latency: 0, source: "FE"},
      {date: "2022-02-05", latency: 15800, source: "FE"},
      {date: "2022-02-06", latency: 35700, source: "FE"},
      {date: "2022-02-07", latency: 0, source: "FE"},
      {date: "2022-02-08", latency: 9700, source: "FE"},
      {date: "2022-02-09", latency: 4400, source: "FE"},
      {date: "2022-02-10", latency: 0, source: "FE"},
      {date: "2022-02-11", latency: 0, source: "FE"},
      {date: "2022-02-12", latency: 59200, source: "BE"},
      {date: "2022-02-13", latency: 38800, source: "BE"},
      {date: "2022-02-14", latency: 240, source: "FE"},
      {date: "2022-02-15", latency: 990, source: "FE"},
      {date: "2022-02-16", latency: 940, source: "FE"},
      {date: "2022-02-17", latency: 0, source: "FE"},
      {date: "2022-02-18", latency: 20, source: "FE"}
    ]
  };

  public fakePublicationDayLatencyJson = {
    centreId: 0,
    date: "2022-01-27",
    values: [
      {time: "00", latency: 2000},
      {time: "01", latency: 0},
      {time: "02", latency: 650},
      {time: "03", latency: 740},
      {time: "04", latency: 980},
      {time: "05", latency: 900},
      {time: "06", latency: 980},
      {time: "07", latency: 1000},
      {time: "08", latency: 32000},
      {time: "09", latency: 54000},
      {time: "10", latency: 770},
      {time: "11", latency: 0},
      {time: "12", latency: 970},
      {time: "13", latency: 1220},
      {time: "14", latency: 0},
      {time: "15", latency: 0},
      {time: "16", latency: 15800},
      {time: "17", latency: 5700},
      {time: "18", latency: 2000},
      {time: "19", latency: 9700},
      {time: "20", latency: 7400},
      {time: "21", latency: 400},
      {time: "22", latency: 680},
      {time: "23", latency: 120}
    ]
  };

  public publicationLatencyList: Array<Latency> = this.fakePublicationLatencyJson.values;
  public publicationDayLatencyList: Array<DayLatency> = this.fakePublicationDayLatencyJson.values;
  //public publicationLatencyList: Array<Latency> = Array.apply(null, Array(30)).map(function () {});
  //public publicationLatencyList: Array<Latency>  = Array.apply(null, Array(30)).map(function () {});
  public dayOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  public mouseIsOnList: Array<boolean> = Array.apply(false, Array(30)).map(function () {});
  public showDayLatency: boolean = false;
  public showDayDate: string = "";

  public latencyColors;

  public syncFakeList = [
    "Sync_1", "Sync_2", "Sync_3"
  ];
  public selectedFilterSync;

  constructor(
    private csvService: CsvDataService,
    private el: ElementRef,
    private alert: AlertComponent,
  ) {
    this.latencyColors = AppConfig.settings.latencyColors;
  }

  ngOnInit(): void {
    this.init_P5();
  }

  onFilterSyncChange(sync) {
    this.selectedFilterSync = sync.target.value;
  }

  onStartDateChanged(date) {
    let tempMillisDate = (Date.parse(date) + this.millisPerMaxPeriod);
    if (Date.parse(this.stopDate) > tempMillisDate) {
      this.alert.showErrorAlert("Check Date Range", "Please select a maximum range of 15 days");
      let tempDate = new Date(tempMillisDate);
      let dd = String(tempDate.getDate()).padStart(2, '0');
      let mm = String(tempDate.getMonth() + 1).padStart(2, '0');
      let yyyy = tempDate.getFullYear();
      this.stopDate = yyyy + '-' + mm + '-' + dd;
    }
    if (Date.parse(date) > Date.parse(this.stopDate)) {
      this.alert.showErrorAlert("Check Date Range", "Start date cannot be later than stop date");
      this.stopDate = date;
    }
  }

  onStopDateChanged(date) {
    let tempMillisDate = (Date.parse(date) - this.millisPerMaxPeriod);
    if (Date.parse(this.startDate) < tempMillisDate) {
      this.alert.showErrorAlert("Check Date Range", "Please select a maximum range of 15 days");
      let tempDate = new Date(tempMillisDate);
      let dd = String(tempDate.getDate()).padStart(2, '0');
      let mm = String(tempDate.getMonth() + 1).padStart(2, '0');
      let yyyy = tempDate.getFullYear();
      this.startDate = yyyy + '-' + mm + '-' + dd;
    }
    if (Date.parse(date) < Date.parse(this.startDate)) {
      this.alert.showErrorAlert("Check Date Range", "Stop date cannot be earlier than start date");
      this.startDate = date;
    }
  }

  onFilterSubmit(): void {
    let tempStopDate = new Date(this.stopDate);
    let tempStartDate = new Date(this.startDate);
    let tempTimeDifference = tempStopDate.getTime() - tempStartDate.getTime();
    //console.log("Time difference: " + tempTimeDifference);
    
    this.tempDaysNumber = tempTimeDifference / (1000 * 3600 * 24) + 1;
    //this.sectionRadians = (2 * Math.PI) / this.daysNumber;
    //console.log("Days difference: " + tempDaysNumber);
  
    for (var i = 0; i < this.tempDaysNumber; i++) {
      //console.log("Date " + i + " - " + new Date(tempStartDate.getTime() + i*(1000*3600*24)));
      let tempFilteredDate = new Date(tempStartDate.getTime() + i*(1000*3600*24));
      let tempdd = String(tempFilteredDate.getDate()).padStart(2, '0');
      let tempmm = String(tempFilteredDate.getMonth() + 1).padStart(2, '0');
      let tempyyyy = tempFilteredDate.getFullYear();
      let tempFilteredDateString: string = tempyyyy + '-' + tempmm + '-' + tempdd;
      //console.log("TempFilteredDate: " + tempFilteredDateString);

/*       let body: object = {
        "mission":this.bodyMission,
        "productType":this.productType,
        "startDate":tempFilteredDateString,
        "stopDate":tempFilteredDateString
      }; */
      //console.log("FILTER Body: " + JSON.stringify(body, null, 2));
/*       this.completenessDailyGetDone[i] = false;   
      this.getDailyCompleteness(body, i); */
    }

    /* CHECK!!!!  ---->  Fill the Array on filter submit */
    this.publicationLatencyList = this.fakePublicationLatencyJson.values;
    this.publicationDayLatencyList = this.fakePublicationDayLatencyJson.values;
    this.p5Chart.windowResized();
  }

  onBackToPeriodClicked() {
    if (this.showDayLatency) {
      this.showDayLatency = false;
    }
  }

  toggleTable() {
    //if (getComputedStyle(document.getElementById("data-table-container")).visibility == 'collapse') {
    if (document.getElementById("data-table-container").style.display == "none") {
      /* Show */
      document.getElementById("main-column-container").style.height = "calc(100vh - 9rem - 12rem)";
      document.getElementById("p5PublicationLatencyCanvas-column-div").style.height = "calc(100vh - 25.5rem)";
      /* document.getElementById("p5PublicationLatencyCanvas").style.height = "100%"; */
      document.getElementById("data-table-container").style.display = "block";
      
      //this.p5Chart.windowResized();
    } else {
      /* Hide */
      document.getElementById("main-column-container").style.height = "calc(100vh - 9rem)";
      document.getElementById("p5PublicationLatencyCanvas-column-div").style.height = "calc(100vh - 13.5rem)"; 
      /* document.getElementById("p5PublicationLatencyCanvas").style.height = "100%";  */
      document.getElementById("data-table-container").style.display = "none";
      
      //this.p5Chart.windowResized();
    }
  }

  chartChangeTo(type: string) {
    this.chartType = type;
    this.doResetZoom = true;
  }

  saveAsCSV() {
    /* if (this.completenessDataList.length > 0) {
      var csvContent: string = '';
      var table = document.getElementById('data-table');
      for (var r = 0; r < table.childElementCount; r++) {
        for (var c = 0; c < table.children[r].childElementCount; c++) {
          csvContent += table.children[r].children[c].innerHTML;
          if (!(c == (table.children[r].childElementCount - 1) && r == (table.childElementCount - 1))) csvContent += ',';
        }
        r < (table.childElementCount - 1) ? csvContent += '\n' : null;
      }
      let tempCompleteCsvMissionName = this.missionFiltered.acronym + this.platformNumber;
      this.csvService.exportToCsv(
        'DAFNE-Mission('
        + tempCompleteCsvMissionName
        + ')_Product('
        + this.productType 
        + ')_From('
        + table.children[0].children[1].innerHTML
        + ')_To('
        + table.children[0].children[table.children[0].childElementCount - 1].innerHTML
        + ').csv', csvContent
      );
    } */
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
      let pieExtDiameter = (canvasWidth > canvasHeight) ? canvasHeight - blankYDim : canvasWidth - blankXDim;
      let pieExtRadius = pieExtDiameter / 2;
      let chartXDim = canvasWidth - blankXDim;
      let chartYDim = canvasHeight - blankYDim;
      let chartXDim2 = chartXDim / 2;
      let chartYDim2 = chartYDim / 2;
      let nLines = 4;

      let dayXDim = canvasWidth / 10;
      let dayYDim = canvasHeight / 8;

      let backgroundColor = p.color('#12222f');
      let labelBackgroundColor = p.color('#12222fcc')
      let lineColor = p.color('#aaaaaa');
      let valuesColor = p.color(200);
      let dateFontSize = 12;
      let valueFontSize = 10;

      let barGapScale = 30.0;
      let sectionScaleSingle = 1.4;
      let maxValue = 592;

      let sf = 1.0;
      let tx = 0;
      let ty = 0;

      let expNum = 1.056975;
      let publicationLatencyListScaled: Array<number> = [];
      let publicationDayLatencyListScaled: Array<number> = [];

      let clickTimerId;

      p.setup = () => {
        canvasSpace = p.createCanvas(canvasWidth, canvasHeight).parent('p5PublicationLatencyCanvas');
        p.pixelDensity(1.0);
        p.smooth();
        p.frameRate(10);
        p.textFont('NotesESA-Reg');
        canvasSpace.mouseWheel(e => wheelZoom(e));
        //canvasSpace.doubleClicked(resetZoom);
        //canvasSpace.mouseClicked(e => toggleDayView(e));
      };

      p.draw = () => {
        p.background(backgroundColor);
        p.windowResized();
        p.translate(tx, ty);

        for (var i = 0; i < this.daysNumber; i++) {
          publicationLatencyListScaled[i] = expNum ** this.publicationLatencyList[i].latency;
        }
        for (var i = 0; i < this.hoursNumber; i++) {
          publicationDayLatencyListScaled[i] = expNum ** this.publicationDayLatencyList[i].latency;
        }

        this.mouseIsOnList = Array.apply(false, Array(30)).map(function () {}); // Change total days number.
        if (this.chartType == this.selectorText[0]) {
          if (this.showDayLatency) {
            p.fillDayBarChart();
          } else {
            p.fillBarChart();
          }
        } else if (this.chartType == this.selectorText[1]) {
          if (this.showDayLatency) {
            p.fillDayLineChart();
          } else {
            p.fillLineChart();
          }
        }

        if (p.mouseIsPressed) {
          tx -= p.pmouseX - p.mouseX;
          ty -= p.pmouseY - p.mouseY;
        }
        
        if (this.doResetZoom) {
          this.doResetZoom = false;
          resetZoom();
        }
      }

      p.doubleClicked = () => {
        if (clickTimerId) {
          clearTimeout(clickTimerId);
          clickTimerId = 0;
        }
        resetZoom();
      }

      p.mouseClicked = () => {
        if (p.mouseX > xCenter - chartXDim2 + tx && p.mouseX < xCenter + chartXDim2 + tx
          && p.mouseY > yCenter - chartYDim2 + ty && p.mouseY < yCenter + chartYDim2 + ty) {
            if (!clickTimerId) {
              clickTimerId = setTimeout(() => {
              //console.log("Mouse clicked.");
    
              if (this.showDayLatency == false) {
                for (var i = 0; i < this.daysNumber; i++) {
                  if (this.mouseIsOnList[i] == true) {
                    //console.log("Day Clicked: " + i);
                    this.showDayDate = this.publicationLatencyList[i].date;
                    this.showDayLatency = true;
                  }
                }
              }   
            }, 500)
          }      
        }  
      }

      function applyScale(s) {
        sf = sf * s;
        tx = p.mouseX * (1-s) + tx * s;
        ty = p.mouseY * (1-s) + ty * s;
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
        xCenter = canvasWidth / 2;
        yCenter = canvasHeight / 2;
        pieExtDiameter = (canvasWidth > canvasHeight) ? canvasHeight - blankYDim : canvasWidth - blankXDim;
        pieExtRadius = pieExtDiameter / 2;
        chartXDim = (canvasWidth - blankXDim);
        chartYDim = (canvasHeight - blankYDim);
        chartXDim2 = chartXDim / 2;
        chartYDim2 = chartYDim / 2;
        dayXDim = canvasWidth / 10;
        dayYDim = canvasHeight / 8;
      };

      p.fillBarChart = () => {
        maxValue = 300000;
        let sectionXFilledDim = (chartXDim / this.daysNumber) / sectionScaleSingle;
        let sectionXFilledDim2 = sectionXFilledDim / 2;
        let barGap = sectionXFilledDim / barGapScale;

        /* CHECK IF THRESHOLD LINES ARE OUTSIDE CHART!!! */
        /* Threshold Lines */
        for (var i = 0; i < this.latencyColors.length; i++) {
          p.noFill();
          p.stroke(this.rgbConvertToArray(this.latencyColors[i].color));
          p.line(xCenter - chartXDim2, yCenter + chartYDim2 - this.latencyColors[i].threshold * chartYDim / maxValue, xCenter + chartXDim2, yCenter + chartYDim2 - this.latencyColors[i].threshold * chartYDim / maxValue);
        }

        for (var i = 0; i < this.daysNumber; i++) {
          let sectionXCenter = xCenter - chartXDim2 + chartXDim / (2 * this.daysNumber) + i * chartXDim / this.daysNumber;

          /* xAxis Text */
          p.textAlign(p.CENTER, p.CENTER);
          p.fill(lineColor);
          p.noStroke();
          p.textSize(dateFontSize);
          /* Rotate Dates */
          let tempText = this.publicationLatencyList[i].date;
          let tempRadium = (sectionXFilledDim - (2 * barGap) - dateFontSize);
          let angle = 0;
          if (tempRadium > p.textWidth(tempText)) tempRadium = p.textWidth(tempText);
          if (tempRadium > 0) angle = p.acos(tempRadium / p.textWidth(tempText));
          else angle = p.PI/2;
          let sinOfAngleTemp = p.sin(angle);
          if (sinOfAngleTemp < 0.001) {
            sinOfAngleTemp = 0.001;
          }
          let sinOfAngle = sinOfAngleTemp * (p.textWidth(tempText));
          let sinOfAngle2 = sinOfAngleTemp * (p.textWidth(tempText) / 2);
          p.push();
          p.translate(sectionXCenter, yCenter + chartYDim2 + sinOfAngle2 + dateFontSize);
          if (angle > p.PI / 2) angle = p.PI / 2;
          if (angle < 0) angle = 0;
          p.rotate(-angle);
          if (this.publicationLatencyList[i].source == "BE") {
            tempText = tempText + "\n(BE)";
          }
          p.text(tempText, 0, 0);
          p.pop();

          
          p.noFill();
          p.stroke(lineColor);
          p.line(xCenter - chartXDim2 + (i + 1) * chartXDim / this.daysNumber, yCenter + chartYDim2 + 5, xCenter - chartXDim2 + (i + 1) * chartXDim / this.daysNumber, yCenter + chartYDim2);
          /* Bars */
          p.rectMode(p.CORNER);
          //p.fill(publicationLatencyListScaled[i], 255 - publicationLatencyListScaled[i], 0);
          if (this.publicationLatencyList[i].latency > this.latencyColors[0].threshold) {
            p.fill(this.rgbConvertToArray(this.latencyColors[0].color));
          } else if (this.publicationLatencyList[i].latency > this.latencyColors[1].threshold && this.publicationLatencyList[i].latency <= this.latencyColors[0].threshold) {
            p.fill(this.rgbConvertToArray(this.latencyColors[1].color));
          } else if (this.publicationLatencyList[i].latency > this.latencyColors[2].threshold && this.publicationLatencyList[i].latency <= this.latencyColors[1].threshold) {
            p.fill(this.rgbConvertToArray(this.latencyColors[2].color));
          } else if (this.publicationLatencyList[i].latency > this.latencyColors[3].threshold && this.publicationLatencyList[i].latency <= this.latencyColors[2].threshold) {
            p.fill(this.rgbConvertToArray(this.latencyColors[3].color));
          } else if (this.publicationLatencyList[i].latency >= this.latencyColors[4].threshold && this.publicationLatencyList[i].latency <= this.latencyColors[3].threshold) {
            p.fill(this.rgbConvertToArray(this.latencyColors[4].color));
          }
          
          p.noStroke();
          p.rect(sectionXCenter - sectionXFilledDim2, yCenter + chartYDim2, sectionXFilledDim, -((this.publicationLatencyList[i].latency < 0 ? 0 : this.publicationLatencyList[i].latency) * chartYDim / maxValue));
          
          if (p.mouseX > sectionXCenter - (chartXDim / this.daysNumber)/2 + tx && p.mouseX < sectionXCenter + (chartXDim / this.daysNumber)/2 + tx
              && p.mouseY > yCenter - chartYDim2 + ty && p.mouseY < yCenter + chartYDim2 + sinOfAngle + 2*dateFontSize + ty) {
            p.stroke(230);
            p.fill(255, 30);
            p.rect(sectionXCenter - sectionXFilledDim2, yCenter - chartYDim2, sectionXFilledDim, chartYDim + sinOfAngle + 2*dateFontSize);
            this.mouseIsOnList = Array.apply(false, Array(30)).map(function () {}); // Change total days number.
            this.mouseIsOnList[i] = true;
          }

          /* if (this.publicationLatencyList[i].source == "BE") {
            p.stroke(255, 223, 112); // #ffdf70
            p.noFill();
            //p.rect(sectionXCenter - sectionXFilledDim2, yCenter + chartYDim2 - this.publicationLatencyList[i].latency * chartYDim / maxValue, sectionXFilledDim, - dateFontSize, 10);
            p.textAlign(p.CENTER, p.CENTER);
            p.text("BE", sectionXCenter, yCenter + chartYDim2 - this.publicationLatencyList[i].latency * chartYDim / maxValue - dateFontSize);
          } */
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
        p.text("0s", xCenter - chartXDim2 - 10, yCenter + chartYDim2);
        p.stroke(lineColor);
        p.line(xCenter - chartXDim2 - 5, yCenter + chartYDim2, xCenter - chartXDim2, yCenter + chartYDim2);
        p.line(xCenter - chartXDim2, yCenter + chartYDim2 + 5, xCenter - chartXDim2, yCenter + chartYDim2);
        /* yAxis text */
        for (var i = 0; i < nLines; i++) {
          p.fill(lineColor);
          p.noStroke();
          /* p.text(p.int(maxValue / (nLines / (i + 1))) + "s", xCenter - chartXDim2 - 15, yCenter + chartYDim2 - (i + 1) * chartYDim / nLines + 1); */
          p.text(this.secondsToHHMMSS(p.int(maxValue / (nLines / (i + 1)))), xCenter - chartXDim2 - 15, yCenter + chartYDim2 - (i + 1) * chartYDim / nLines + 1);
          p.stroke(lineColor);
          p.line(xCenter - chartXDim2 - 5, yCenter + chartYDim2 - (i + 1) * chartYDim / nLines, xCenter - chartXDim2, yCenter + chartYDim2 - (i + 1) * chartYDim / nLines)
        }
      }

      p.fillLineChart = () => {
        maxValue = 300000;
        let xpoint: Array<number> = [];
        let ypoint: Array<number> = [];
        
        //let sectionXFilledDim = chartXDim / this.daysNumber;
        let sectionXFilledDim = (chartXDim / this.daysNumber) / sectionScaleSingle;
        let sectionXFilledDim2 = sectionXFilledDim / 2;
        let barGap = sectionXFilledDim / barGapScale;

        /* Threshold Lines */
        for (var i = 0; i < this.latencyColors.length; i++) {
          p.noFill();
          p.stroke(this.rgbConvertToArray(this.latencyColors[i].color));
          p.line(xCenter - chartXDim2, yCenter + chartYDim2 - this.latencyColors[i].threshold * chartYDim / maxValue, xCenter + chartXDim2, yCenter + chartYDim2 - this.latencyColors[i].threshold * chartYDim / maxValue);
        }

        p.curveTightness(1.0);
        p.beginShape();
        p.curveVertex(xCenter - chartXDim2 + sectionXFilledDim2, yCenter + chartYDim2);
        p.curveVertex(xCenter - chartXDim2 + sectionXFilledDim2, yCenter + chartYDim2);
        p.rectMode(p.CORNER);

        for (var i = 0; i < this.daysNumber; i++) {
          let sectionXCenter = xCenter - chartXDim2 + chartXDim / (2 * this.daysNumber) + i * chartXDim / this.daysNumber;
          xpoint[i] = sectionXCenter; // - sectionXFilledDim2;
          ypoint[i] = yCenter + chartYDim2 -((this.publicationLatencyList[i].latency < 0 ? 0 : this.publicationLatencyList[i].latency) * chartYDim / maxValue);
          
          /* Draw Curve */
          p.stroke(255,255,0);
          p.fill(255, 255, 255, 20);
          p.curveVertex(xpoint[i], ypoint[i]);          

          /* Rotate Dates */
          let tempText = this.publicationLatencyList[i].date;
          let tempRadium = (sectionXFilledDim - (2 * barGap) - dateFontSize);
          let angle = 0;
          if (tempRadium > p.textWidth(tempText)) tempRadium = p.textWidth(tempText);
          if (tempRadium > 0) angle = p.acos(tempRadium / p.textWidth(tempText));
          else angle = p.PI/2;
          let sinOfAngleTemp = p.sin(angle);
          if (sinOfAngleTemp < 0.001) {
            sinOfAngleTemp = 0.001;
          }
          let sinOfAngle = sinOfAngleTemp * (p.textWidth(tempText));
          let sinOfAngle2 = sinOfAngleTemp * (p.textWidth(tempText) / 2);
          p.push();
          p.translate(sectionXCenter, yCenter + chartYDim2 + sinOfAngle2 + dateFontSize);
          if (angle > p.PI / 2) angle = p.PI / 2;
          if (angle < 0) angle = 0;
          p.rotate(-angle);
          p.textAlign(p.CENTER, p.CENTER);
          p.fill(lineColor);
          p.noStroke();
          p.textSize(dateFontSize);
          if (this.publicationLatencyList[i].source == "BE") {
            tempText = tempText + "\n(BE)";
          }
          p.text(tempText, 0, 0);
          p.pop();

          if (p.mouseX > sectionXCenter - (chartXDim / this.daysNumber)/2 + tx && p.mouseX < sectionXCenter + (chartXDim / this.daysNumber)/2 + tx
              && p.mouseY > yCenter - chartYDim2 + ty && p.mouseY < yCenter + chartYDim2 + sinOfAngle + 2*dateFontSize + ty) {
            p.stroke(230);
            p.fill(255, 30);
            p.rect(sectionXCenter - sectionXFilledDim2, yCenter - chartYDim2, sectionXFilledDim, chartYDim + sinOfAngle + 2*dateFontSize);
            this.mouseIsOnList = Array.apply(false, Array(30)).map(function () {}); // Change total days number.
            this.mouseIsOnList[i] = true;
          }
          
          /* if (this.publicationLatencyList[i].source == "BE") {
            p.stroke(255, 223, 112); // #ffdf70
            p.noFill();
            //p.rect(sectionXCenter - sectionXFilledDim2, yCenter + chartYDim2 - this.publicationLatencyList[i].latency * chartYDim / maxValue, sectionXFilledDim, - dateFontSize, 10);
            p.textAlign(p.CENTER, p.CENTER);
            p.text("BE", sectionXCenter, yCenter + chartYDim2 - this.publicationLatencyList[i].latency * chartYDim / maxValue - dateFontSize);
          } */

          /* xAxis Lines */
          p.fill(255, 255, 255, 20);
          p.stroke(lineColor);
          p.line(xCenter - chartXDim2 + (i + 1) * chartXDim / this.daysNumber, yCenter + chartYDim2 + 5, xCenter - chartXDim2 + (i + 1) * chartXDim / this.daysNumber, yCenter + chartYDim2);
        }
        p.curveVertex(xCenter + chartXDim2 - sectionXFilledDim2, yCenter + chartYDim2);
        p.curveVertex(xCenter + chartXDim2 - sectionXFilledDim2, yCenter + chartYDim2); 
        p.endShape();

        /* Scheme */
        //p.rectMode(p.CENTER);
        p.textAlign(p.RIGHT, p.CENTER);
        p.noFill();
        p.stroke(lineColor);
        p.line(xCenter - chartXDim2, yCenter + chartYDim2, xCenter - chartXDim2, yCenter - chartYDim2);
        p.line(xCenter - chartXDim2, yCenter + chartYDim2, xCenter + chartXDim2, yCenter + chartYDim2);
        /* Zero text */
        p.fill(lineColor);
        p.noStroke();
        p.text("0s", xCenter - chartXDim2 - 10, yCenter + chartYDim2);
        p.stroke(lineColor);
        p.line(xCenter - chartXDim2 - 5, yCenter + chartYDim2, xCenter - chartXDim2, yCenter + chartYDim2);
        p.line(xCenter - chartXDim2, yCenter + chartYDim2 + 5, xCenter - chartXDim2, yCenter + chartYDim2);
        /* yAxis text */
        for (var i = 0; i < nLines; i++) {
          p.fill(lineColor);
          p.noStroke();
          //p.text(p.int(maxValue / (nLines / (i + 1))) + "s", xCenter - chartXDim2 - 15, yCenter + chartYDim2 - (i + 1) * chartYDim / nLines + 1);
          p.text(this.secondsToHHMMSS(p.int(maxValue / (nLines / (i + 1)))), xCenter - chartXDim2 - 15, yCenter + chartYDim2 - (i + 1) * chartYDim / nLines + 1);
          //p.stroke((i+1) * (255 / nLines), 255 - (i+1) * (255 / nLines), 0);
          p.stroke(lineColor);
          p.line(xCenter - chartXDim2 - 5, yCenter + chartYDim2 - (i + 1) * chartYDim / nLines, xCenter - chartXDim2, yCenter + chartYDim2 - (i + 1) * chartYDim / nLines)
        }
      }


      p.fillDayBarChart = () => {
        maxValue = 54000;

        let sectionXFilledDim = (chartXDim / this.hoursNumber) / sectionScaleSingle;
        let sectionXFilledDim2 = sectionXFilledDim / 2;
        let barGap = sectionXFilledDim / barGapScale;

        /* Threshold Lines */
        for (var i = 0; i < this.latencyColors.length; i++) {
          p.noFill();
          p.stroke(this.rgbConvertToArray(this.latencyColors[i].color));
          p.line(xCenter - chartXDim2, yCenter + chartYDim2 - this.latencyColors[i].threshold * chartYDim / maxValue, xCenter + chartXDim2, yCenter + chartYDim2 - this.latencyColors[i].threshold * chartYDim / maxValue);
        }

        for (var i = 0; i < this.hoursNumber; i++) {
          let sectionXCenter = xCenter - chartXDim2 + chartXDim / (2 * this.hoursNumber) + i * chartXDim / this.hoursNumber;

          /* xAxis Text */
          p.textAlign(p.CENTER, p.CENTER);
          p.fill(lineColor);
          p.noStroke();
          p.textSize(dateFontSize);
          /* Rotate Dates */
          let tempText = this.publicationDayLatencyList[i].time;
          let tempRadium = (sectionXFilledDim - (2 * barGap) - dateFontSize);
          let angle = 0;
          if (tempRadium > p.textWidth(tempText)) tempRadium = p.textWidth(tempText);
          if (tempRadium > 0) angle = p.acos(tempRadium / p.textWidth(tempText));
          else angle = p.PI/2;
          let sinOfAngleTemp = p.sin(angle);
          if (sinOfAngleTemp < 0.001) {
            sinOfAngleTemp = 0.001;
          }
          let sinOfAngle = sinOfAngleTemp * (p.textWidth(tempText));
          let sinOfAngle2 = sinOfAngleTemp * (p.textWidth(tempText) / 2);
          p.push();
          p.translate(sectionXCenter, yCenter + chartYDim2 + sinOfAngle2 + dateFontSize);
          if (angle > p.PI / 2) angle = p.PI / 2;
          if (angle < 0) angle = 0;
          p.rotate(-angle);
          p.text(tempText, 0, 0);
          p.pop();

          p.noFill();
          p.stroke(lineColor);
          p.line(xCenter - chartXDim2 + (i + 1) * chartXDim / this.hoursNumber, yCenter + chartYDim2 + 5, xCenter - chartXDim2 + (i + 1) * chartXDim / this.hoursNumber, yCenter + chartYDim2);
          /* Bars */
          p.rectMode(p.CORNER);
          //p.fill(publicationDayLatencyListScaled[i], 255 - publicationDayLatencyListScaled[i], 0);
          if (this.publicationDayLatencyList[i].latency > this.latencyColors[0].threshold) {
            p.fill(this.rgbConvertToArray(this.latencyColors[0].color));
          } else if (this.publicationDayLatencyList[i].latency > this.latencyColors[1].threshold && this.publicationDayLatencyList[i].latency <= this.latencyColors[0].threshold) {
            p.fill(this.rgbConvertToArray(this.latencyColors[1].color));
          } else if (this.publicationDayLatencyList[i].latency > this.latencyColors[2].threshold && this.publicationDayLatencyList[i].latency <= this.latencyColors[1].threshold) {
            p.fill(this.rgbConvertToArray(this.latencyColors[2].color));
          } else if (this.publicationDayLatencyList[i].latency > this.latencyColors[3].threshold && this.publicationDayLatencyList[i].latency <= this.latencyColors[2].threshold) {
            p.fill(this.rgbConvertToArray(this.latencyColors[3].color));
          } else if (this.publicationDayLatencyList[i].latency >= this.latencyColors[4].threshold && this.publicationDayLatencyList[i].latency <= this.latencyColors[3].threshold) {
            p.fill(this.rgbConvertToArray(this.latencyColors[4].color));
          }
          p.noStroke();
          p.rect(sectionXCenter - sectionXFilledDim2, yCenter + chartYDim2, sectionXFilledDim, -((this.publicationDayLatencyList[i].latency < 0 ? 0 : this.publicationDayLatencyList[i].latency) * chartYDim / maxValue));
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
        p.text("0s", xCenter - chartXDim2 - 10, yCenter + chartYDim2);
        p.stroke(lineColor);
        p.line(xCenter - chartXDim2 - 5, yCenter + chartYDim2, xCenter - chartXDim2, yCenter + chartYDim2);
        p.line(xCenter - chartXDim2, yCenter + chartYDim2 + 5, xCenter - chartXDim2, yCenter + chartYDim2);
        /* yAxis text */
        for (var i = 0; i < nLines; i++) {
          p.fill(lineColor);
          p.noStroke();
          //p.text(p.int(maxValue / (nLines / (i + 1))) + "s", xCenter - chartXDim2 - 15, yCenter + chartYDim2 - (i + 1) * chartYDim / nLines + 1);
          p.text(this.secondsToHHMMSS(p.int(maxValue / (nLines / (i + 1)))), xCenter - chartXDim2 - 15, yCenter + chartYDim2 - (i + 1) * chartYDim / nLines + 1);
          p.stroke(lineColor);
          p.line(xCenter - chartXDim2 - 5, yCenter + chartYDim2 - (i + 1) * chartYDim / nLines, xCenter - chartXDim2, yCenter + chartYDim2 - (i + 1) * chartYDim / nLines)
        }
      }

      p.fillDayLineChart = () => {
        maxValue = 54000;
        let xpoint: Array<number> = [];
        let ypoint: Array<number> = [];
        
        let sectionXFilledDim = chartXDim / this.hoursNumber;
        let sectionXFilledDim2 = sectionXFilledDim / 2;
        let barGap = sectionXFilledDim / barGapScale;

        /* Threshold Lines */
        for (var i = 0; i < this.latencyColors.length; i++) {
          p.noFill();
          p.stroke(this.rgbConvertToArray(this.latencyColors[i].color));
          p.line(xCenter - chartXDim2, yCenter + chartYDim2 - this.latencyColors[i].threshold * chartYDim / maxValue, xCenter + chartXDim2, yCenter + chartYDim2 - this.latencyColors[i].threshold * chartYDim / maxValue);
        }

        p.curveTightness(1.0);
        p.beginShape();
        p.stroke(255,255,0);
        p.fill(255, 255, 255, 20);
        //p.curveVertex(xCenter - chartXDim2, yCenter + chartYDim2);
        //p.curveVertex(xCenter - chartXDim2, yCenter + chartYDim2);  
        p.curveVertex(xCenter - chartXDim2 + sectionXFilledDim2, yCenter + chartYDim2);
        p.curveVertex(xCenter - chartXDim2 + sectionXFilledDim2, yCenter + chartYDim2);
        p.rectMode(p.CORNER);

        for (var i = 0; i < this.hoursNumber; i++) {
          let sectionXCenter = xCenter - chartXDim2 + chartXDim / (2 * this.hoursNumber) + i * chartXDim / this.hoursNumber;
          xpoint[i] = sectionXCenter; // - sectionXFilledDim2;
          ypoint[i] = yCenter + chartYDim2 -((this.publicationDayLatencyList[i].latency < 0 ? 0 : this.publicationDayLatencyList[i].latency) * chartYDim / maxValue);
          
          /* Draw Curve */
          p.stroke(255,255,0);
          p.fill(255, 255, 255, 20);
          p.curveVertex(xpoint[i], ypoint[i]);          

          /* Rotate Dates */
          let tempText = this.publicationDayLatencyList[i].time;
          let tempRadium = (sectionXFilledDim - (2 * barGap) - dateFontSize);
          let angle = 0;
          if (tempRadium > p.textWidth(tempText)) tempRadium = p.textWidth(tempText);
          if (tempRadium > 0) angle = p.acos(tempRadium / p.textWidth(tempText));
          else angle = p.PI/2;
          let sinOfAngleTemp = p.sin(angle);
          if (sinOfAngleTemp < 0.001) {
            sinOfAngleTemp = 0.001;
          }
          let sinOfAngle = sinOfAngleTemp * (p.textWidth(tempText));
          let sinOfAngle2 = sinOfAngleTemp * (p.textWidth(tempText) / 2);
          p.push();
          p.translate(sectionXCenter, yCenter + chartYDim2 + sinOfAngle2 + dateFontSize);
          if (angle > p.PI / 2) angle = p.PI / 2;
          if (angle < 0) angle = 0;
          p.rotate(-angle);
          p.textAlign(p.CENTER, p.CENTER);
          p.fill(lineColor);
          p.noStroke();
          p.textSize(dateFontSize);
          p.text(tempText, 0, 0);
          p.pop();

          /* xAxis Lines */
          p.stroke(lineColor);
          p.line(xCenter - chartXDim2 + (i + 1) * chartXDim / this.hoursNumber, yCenter + chartYDim2 + 5, xCenter - chartXDim2 + (i + 1) * chartXDim / this.hoursNumber, yCenter + chartYDim2);
        }
        //p.curveVertex(xCenter + chartXDim2 - chartXDim / this.hoursNumber, yCenter + chartYDim2);
        //p.curveVertex(xCenter + chartXDim2 - chartXDim / this.hoursNumber, yCenter + chartYDim2); 
        p.curveVertex(xCenter + chartXDim2 - sectionXFilledDim2, yCenter + chartYDim2);
        p.curveVertex(xCenter + chartXDim2 - sectionXFilledDim2, yCenter + chartYDim2); 
        p.endShape();

        /* Scheme */
        //p.rectMode(p.CENTER);
        p.textAlign(p.RIGHT, p.CENTER);
        p.noFill();
        p.stroke(lineColor);
        p.line(xCenter - chartXDim2, yCenter + chartYDim2, xCenter - chartXDim2, yCenter - chartYDim2);
        p.line(xCenter - chartXDim2, yCenter + chartYDim2, xCenter + chartXDim2, yCenter + chartYDim2);
        /* Zero text */
        p.fill(lineColor);
        p.noStroke();
        p.text("0s", xCenter - chartXDim2 - 10, yCenter + chartYDim2);
        p.stroke(lineColor);
        p.line(xCenter - chartXDim2 - 5, yCenter + chartYDim2, xCenter - chartXDim2, yCenter + chartYDim2);
        p.line(xCenter - chartXDim2, yCenter + chartYDim2 + 5, xCenter - chartXDim2, yCenter + chartYDim2);
        /* yAxis text */
        for (var i = 0; i < nLines; i++) {
          p.fill(lineColor);
          p.noStroke();
          //p.text(p.int(maxValue / (nLines / (i + 1))) + "s", xCenter - chartXDim2 - 15, yCenter + chartYDim2 - (i + 1) * chartYDim / nLines + 1);
          p.text(this.secondsToHHMMSS(p.int(maxValue / (nLines / (i + 1)))), xCenter - chartXDim2 - 15, yCenter + chartYDim2 - (i + 1) * chartYDim / nLines + 1);
          //p.stroke((i+1) * (255 / nLines), 255 - (i+1) * (255 / nLines), 0);
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
    //var timeStr = new Date(1000*secondsTot).toISOString(); //.slice(11, 19);
    var sec_num = parseInt(secondsTot, 10); // don't forget the second param
    var hours   = Math.floor(sec_num / 3600);
    var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
    var seconds = sec_num - (hours * 3600) - (minutes * 60);
    var timeStr = hours.toString(10).padStart(2, '0') + "h:" + minutes.toString(10).padStart(2, '0') + "m:" + seconds.toString(10).padStart(2, '0') + "s";
    return timeStr;
  }
}