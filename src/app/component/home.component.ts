import {
  AfterViewInit,
  ChangeDetectorRef,
  Component
} from '@angular/core';
import {
  IPageChangeEvent,
  ITdDataTableColumn,
  ITdDataTableSortChangeEvent,
  TdDataTableService,
  TdDataTableSortingOrder,
  TdMediaService
} from '@covalent/core';

import {Log} from '../model/source.model';
import {ElasticsearchService} from '../service/elasticsearch.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html'
})

export class HomeComponent implements AfterViewInit {

  dataColumnDefs: ITdDataTableColumn[] = [
    {name: 'id', label: 'id', sortable: true, width: 100},
    {name: 'timestamp', label: 'timestamp', width: 230},
    {name: 'thread', label: 'thread', width: 100},
    {name: 'level', label: 'level', width: 100},
    {name: 'class', label: 'class', width: 200},
    {name: 'message', label: 'message', width: 800}
  ];
  dataCurrentPage = 1;
  dataPageSize = 50;
  dataRowData: any[] = [];
  dataSortBy = 'id';
  dataSortOrder: TdDataTableSortingOrder = TdDataTableSortingOrder.Descending;

  eventLinks: IPageChangeEvent;
  filteredTotal = 0;
  logs: Log[] = [];
  mavenMessages = false;
  searchTerm = '';

  navmenu: Object[] = [];

  constructor(private elasticsearchService: ElasticsearchService, private _dataTableService: TdDataTableService,
              private ref: ChangeDetectorRef, public media: TdMediaService) {
    this.countExecs(0);
  }

  private countExecs(index: number) {
    this.elasticsearchService.count(2, (index + 1).toString()).subscribe(
      count => {
        if (count !== 0) {
          this.countExecs(index+1);
        } else {
          this.createNav(index);
        }
      },
      error => console.log(error)
    );
  }

  private createNav(index: number) {
    let id;
    for (let i = 0; i < index; i++) {
      id = i + 1;
      this.navmenu = this.navmenu.concat({
        'id': id,
        'icon': 'looks_one',
        'title': 'Exec ' + id.toString()
      });
    }
  }

  ngAfterViewInit(): void {
    // broadcast to all listener observables when loading the page
    setTimeout(() => { // workaround since MatSidenav has issues redrawing at the beggining
      this.media.broadcast();
      this.ref.detectChanges();
    });
  }

  changeLinks(event: IPageChangeEvent): void {
    this.eventLinks = event;
    this.dataPageSize = event.pageSize;
    this.dataCurrentPage = event.page;
    this.evaluateResult();
  }

  evaluateResult() {
    if (this.mavenMessages) {
      this.loadInfo(0);
      this.count(0, '');
    } else {
      this.loadInfo(1);
      this.count(1, '');
    }
  }

  sort(sortEvent: ITdDataTableSortChangeEvent): void {
    this.dataSortBy = sortEvent.name;
    this.dataSortOrder = sortEvent.order;
    this.filter();
  }

  private count(code: number, value: string) {
    this.elasticsearchService.count(code, value).subscribe(
      count => {
        console.log(count);
      },
      error => console.log(error)
    );
  }

  private filter(): void {
    let newData: any[] = this.dataRowData;
    this.dataRowData = [];
    newData = this._dataTableService.filterData(newData, this.searchTerm, true);
    this.filteredTotal = newData.length;
    newData = this._dataTableService.sortData(newData, this.dataSortBy, this.dataSortOrder);
    for (const log of newData) {
      this.dataRowData = this.dataRowData.concat(log);
    }
    this.ref.detectChanges();
  }

  private loadInfo(code: number, value?: string) {
    let page = (this.dataCurrentPage * this.dataPageSize) - this.dataPageSize;
    if (page < 0) {
      page = 0;
    }
    this.elasticsearchService.submit(code, this.dataPageSize, page, value).subscribe(
      data => {
        this.logs = [];
        this.logs = this.logs.concat(data);
        this.dataRowData = [];
        for (const log of this.logs) {
          this.dataRowData = this.dataRowData.concat({
            'id': (+log.id),
            'timestamp': log.timestamp,
            'thread': log.thread_name,
            'level': log.level,
            'class': (log.logger_name.split('.')[3]),
            'message': log.formatted_message
          });
        }
      },
      error => console.log(error)
    );
  }
}
