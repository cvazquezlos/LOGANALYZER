import {
  Component,
  Inject,
  OnInit
} from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogRef
} from '@angular/material';
import {ActivatedRoute} from '@angular/router';
import {BreadcrumbsService} from 'ng2-breadcrumbs';
import {HttpClient} from '@angular/common/http';

@Component({
  selector: 'app-report-comparison',
  templateUrl: './report-comparison.component.html',
  styleUrls: ['./report-comparison.component.css']
})

export class ReportComparisonComponent implements OnInit {

  classesL: any[];
  comparatorText: string;
  comparedText: string;
  execSelected = 3;
  mode: number;
  project: string;
  ready: boolean;
  test: string;

  constructor(private activatedRoute: ActivatedRoute, private breadcrumbs: BreadcrumbsService, private http: HttpClient,
              private dialog: MatDialog) {
  }

  async ngOnInit() {
    this.test = this.activatedRoute.snapshot.parent.params['exec'];
    this.project = this.activatedRoute.snapshot.parent.parent.params['project'];
    this.breadcrumbs.store([{label: 'Home', url: '/', params: []},
      {label: this.project, url: '/projects/' + this.project, params: []},
      {label: this.test, url: '/projects/' + this.project + '/' + this.test, params: []},
      {label: 'Reporting', url: '/projects/' + this.project + '/' + this.test + '/report', params: []}]);
    this.ready = false;
    this.classesL = [];
    const loggers = await this.getLoggers();
    for (let i = 0; i < loggers.length; i++) {
      if (loggers[i].split(' ').length === 2) {
        const logger = loggers[i].split(' ')[1];
        const partialLogger = logger.split('.')[logger.split('.').length - 1];
        const methods = await this.getMethodsByPartialLogger(partialLogger);
        const methodsData = [];
        for (let j = 0; j < methods.length; j++) {
          methodsData.push({
            'name': methods[j],
            'logs': await this.getLogs(partialLogger, methods[j].replace('(', '').replace(')', ''))
          });
        }
        this.classesL.push({
          'name': loggers[i],
          'methods': methodsData
        });
      }
    }
    this.ready = true;
  }

  openComparisonDialog() {
    const dialogRef = this.dialog.open(ComparisonSettingsComponent, {
      data: {exec: this.execSelected, mode: this.mode}
    });
  }

  private async getLoggers() {
    try {
      const response = await this.http.get<string[]>('http://localhost:8443/logs/test/' + this.test + '?project=' + this.project
        + '&classes=true').toPromise();
      return response;
    } catch (error) {
      console.log(error);
    }
  }

  private async getLogs(partialLogger: string, method: string) {
    try {
      const response = await this.http.get<string[]>('http://localhost:8443/logs/logger/' + partialLogger + '?project=' + this.project
        + '&test=' + this.test + '&method=' + method).toPromise();
      return response;
    } catch (error) {
      console.log(error);
    }
  }

  private async getMethodsByPartialLogger(partialLogger: string) {
    try {
      const response = await this.http.get<string[]>('http://localhost:8443/logs/logger/' + partialLogger + '?project=' + this.project
        + '&test=' + this.test).toPromise();
      return response;
    } catch (error) {
      console.log(error);
    }
  }

}

@Component({
  selector: 'app-report-comparison-settings',
  templateUrl: './comparison-settings/comparison-settings.component.html'
})

export class ComparisonSettingsComponent {

  execSelected: number;
  mode: number;

  constructor(public dialogRef: MatDialogRef<ComparisonSettingsComponent>, @Inject(MAT_DIALOG_DATA) public data: any) {
  }

  onNoClick() {
    this.dialogRef.close();
  }

}
