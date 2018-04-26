import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {ITdDataTableColumn} from '@covalent/core';
import {BreadcrumbsService} from 'ng2-breadcrumbs';
import {Project} from '../../../model/project.model';
import {ElasticsearchService} from '../../../service/elasticsearch.service';

@Component({
  selector: 'app-view-execs',
  templateUrl: './view-execs.component.html',
  styleUrls: ['./view-execs.component.css']
})

export class ViewExecsComponent implements OnInit {

  deleteInProgress: boolean;
  execDeleting: string;
  execsData: ITdDataTableColumn[] = [
    {name: 'id', label: 'Id', width: 60},
    {name: 'start_date', label: 'Start date', width: 240},
    {name: 'entries', label: 'Entries', width: 100},
    {name: 'status', label: 'Status'},
    {name: 'errors', label: 'ERRORS', width: 100},
    {name: 'failures', label: 'FAILURES', width: 100},
    {name: 'flakes', label: 'FLAKES', width: 100},
    {name: 'skipped', label: 'SKIPPED', width: 100},
    {name: 'tests', label: 'tests', width: 70},
    {name: 'time_elapsed', label: 'Time elapsed'},
    {name: 'options', label: 'Options', width: 150}
  ];
  execsRow = [];
  project: Project = new Project();

  constructor(private activatedRoute: ActivatedRoute, private elasticsearchService: ElasticsearchService,
              private router: Router, private breadcrumbs: BreadcrumbsService) {
  }

  addExec() {
    this.router.navigate(['./', 'add'], {relativeTo: this.activatedRoute});
  }

  delete(row: any) {
    this.deleteInProgress = true;
    this.execDeleting = row.id;
    this.elasticsearchService.deleteExecutionById(row.id).subscribe(
      response => {
        this.reloadTabContent();
        this.deleteInProgress = false;
        this.execDeleting = '';
      },
      error => console.log(error)
    )
  }

  goTo(row: any) {
    this.router.navigate(['./', row.test], {relativeTo: this.activatedRoute});
  }

  ngOnInit() {
    const name = this.activatedRoute.snapshot.params['project'];
    this.elasticsearchService.getProjectByName(name).subscribe(response => {
        this.project = response;
        this.reloadTabContent();
      }
    );
    this.breadcrumbs.store([{label: 'Home', url: '/', params: []}, {
      label: name,
      url: '/projects/' + name,
      params: []
    }]);
  }

  async reloadTabContent() {
    const response = await this.elasticsearchService.getExecutionsByProjectAsync(this.project.name);
    console.log(response);
    console.log(response.length);
    this.execsRow = [];
    for (let i = 0; i < response.length; i++) {
      console.log("First iteration");
      let icon, classi: any;
      if (response[i].status.indexOf('SUCCESS') !== -1) {
        icon = 'check_circle';
        classi = 'tc-green-700';
      } else {
        icon = 'error';
        classi = 'tc-red-700';
      }
      this.execsRow.push({
        'id': response[i].id,
        'start_date': response[i].start_date,
        'entries': response[i].entries,
        'status': {
          'icon': icon,
          'class': classi,
          'status': response[i].status
        },
        'errors': response[i].errors,
        'failures': response[i].failures,
        'flakes': response[i].flakes,
        'skipped': response[i].skipped,
        'tests': response[i].tests,
        'time_elapsed': response[i].time_elapsed + ' seconds'
      });
    }
    console.log(this.execsRow);
    /*
    this.tabs = [];
    const response0 = await this.elasticsearchService.getTabsByProjectAsync(this.project.name);
    for (let i = 0; i < response0.length; i++) {
      const response1 = await this.elasticsearchService.getExecutionsByProjectAndTabAsync(this.project.name, response0[i].tab);
      const executions = [];
      for (let j = 0; j < response1.length; j++) {
        let icon, classi: any;
        if (response1[j].status.indexOf('SUCCESS') !== -1) {
          icon = 'check_circle';
          classi = 'tc-green-700';
        } else {
          icon = 'error';
          classi = 'tc-red-700';
        }
        executions[j] = {
          'id': response1[j].id,
          'startdate': response1[j].start_date,
          'entries': response1[j].entries,
          'status': {
            'icon': icon,
            'class': classi,
            'status': response1[j].status
          },
          'errors': response1[j].errors,
          'failures': response1[j].failures,
          'flakes': response1[j].flakes,
          'skipped': response1[j].skipped,
          'tests': response1[j].tests,
          'test': response1[j].test,
          'time_elapsed': response1[j].time_elapsed + ' seconds'
        }
      }
      this.tabs[i] = {
        'name': response0[i].tab,
        'executions': executions
      }
    }*/
  }
}
