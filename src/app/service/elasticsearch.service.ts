import {HttpClient, HttpHeaders} from '@angular/common/http';
import {Injectable} from '@angular/core';
import 'rxjs/add/operator/map';
import {CountFormat} from '../model/count-format.model';
import {Execution} from '../model/execution.model';
import {Log} from '../model/log.model';
import {Project} from '../model/project.model';
import {Tab} from '../model/tab.model';

@Injectable()
export class ElasticsearchService {

  baseAPIUrl = 'http://localhost:8443/';
  baseAPILogsUrl = this.baseAPIUrl + 'logs';
  baseAPIDiffMatchPatchUrl = this.baseAPIUrl + 'diff';
  baseAPIFilesUrl = this.baseAPIUrl + 'files';
  baseAPIProjectsUrl = this.baseAPIUrl + 'projects';
  baseAPITabsUrl = this.baseAPIUrl + 'tabs';
  baseELASTICSEARCHUrl = 'http://localhost:9200/';

  constructor(private http: HttpClient) {
  }

  getCountOfProjects() {
    return this.http.get<CountFormat>(this.baseELASTICSEARCHUrl + 'projects/_count').map(
      response => response.count,
      error => error
    )
  }

  async getLogsByLoggerAsync(logger: string, project: string, test: string, method?: string) {
    try {
      let composedUrl = this.baseAPILogsUrl + '/logger/' + logger + '?project=' + project + '&test=' + test;
      if (method !== undefined) {
        composedUrl += '&method=' + method;
      }
      const response = await this.http.get<any[]>(composedUrl).toPromise();
      return response;
    } catch (error) {
      console.log(error);
    }
  }

  async getLogsByProjectAsync(project: string, tab: string) {
    try {
      const composedUrl = this.baseAPILogsUrl + '/project/' + project + '?tab=' + tab;
      const response = await this.http.get<Execution[]>(composedUrl).toPromise();
      return response;
    } catch (error) {
      console.log(error);
    }
  }

  async getLogsByTestAsync(test: string, project: string, classes: boolean, maven?: boolean) {
    try {
      let composedUrl = this.baseAPILogsUrl + '/test/' + test + '?project=' + project + '&classes=' + classes;
      (composedUrl += '&maven=' + maven) && (maven);
      const response = await this.http.get<any[]>(composedUrl).toPromise();
      return response;
    } catch (error) {
      console.log(error);
    }
  }

  getLogsByTest(test: string, project: string, classes: boolean, maven?: boolean) {
    let composedUrl = this.baseAPILogsUrl + '/test/' + test + '?project=' + project + '&classes=' + classes;
    (composedUrl += '&maven=' + maven) && (maven);
    return this.http.get<Log[]>(composedUrl).map(
      response => response,
      error => error
    );
  }

  deleteLogsByTest(test: string, project: string) {
    const composedUrl = this.baseAPILogsUrl + '/remove/test/' + test + '?project=' + project;
    return this.http.delete<any>(composedUrl).map(
      response => response,
      error => error
    );
  }

  getProjectsAll() {
    return this.http.get<Project[]>(this.baseAPIProjectsUrl + '/all').map(
      response => response,
      error => error
    );
  }

  getProjectByName(name: string) {
    return this.http.get<Project>(this.baseAPIProjectsUrl + '/name/' + name).map(
      response => response,
      error => error
    );
  }

  async postProject(project: Project) {
    try {
      const headers: HttpHeaders = new HttpHeaders();
      headers.append('Content-Type', 'application/json');
      headers.append('X-Requested-With', 'XMLHttpRequest');
      const object = {
        id: project.id,
        name: project.name,
        'num_execs': project.num_execs
      };
      const response = this.http.post(this.baseAPIProjectsUrl, object, {headers: headers}).toPromise();
      return response;
    } catch (error) {
      console.log(error);
    }
  }

  deleteProjectById(id: number) {
    return this.http.delete(this.baseAPIProjectsUrl + '/remove/id/' + id).map(
      response => response,
      error => error
    );
  }

  async postFileByUpload(file: File) {
    try {
      const body = new FormData();
      body.append('file', file);
      const headers = new HttpHeaders();
      headers.append('Content-Type', 'application/pdf');
      const response = await this.http.post(this.baseAPIFilesUrl + '/file', body, {headers: headers}).toPromise();
      return response;
    } catch (error) {
      console.log(error);
    }
  }

  postFileByUrl(url: string) {
    const body = JSON.stringify(url);
    const headers = new HttpHeaders();
    headers.append('Content-Type', 'text/plain');
    return this.http.post(this.baseAPIFilesUrl + '/url', body, {headers: headers}).map(
      response => response,
      error => error
    );
  }

  async postFileProject(project: string) {
    try {
      const body = JSON.stringify(project);
      const headers = new HttpHeaders();
      headers.append('Content-Type', 'text/plain');
      const response = this.http.post(this.baseAPIFilesUrl + '/project', body, {headers: headers}).toPromise();
      console.log(response);
      return response;
    } catch (error) {
      console.log(error);
    }
  }

  async postFileTab(tab: string) {
    try {
      console.log(tab);
      const body = JSON.stringify(tab);
      const headers = new HttpHeaders();
      headers.append('Content-Type', 'text/plain');
      const response = this.http.post(this.baseAPIFilesUrl + '/tab', body, {headers: headers}).toPromise();
      console.log("NOT ERROR");
      console.log(response);
      return response;
    } catch (error) {
      console.log("ERROR");
      console.log(error);
    }
  }

  async getTabsByProjectAsync(project: string) {
    try {
      const response = await this.http.get<Tab[]>(this.baseAPITabsUrl + '/project/' + project).toPromise();
      return response;
    } catch (error) {
      console.log(error);
    }
  }

  deleteTagByName(name: string, project: string) {
    const composedUrl = this.baseAPITabsUrl + '/remove/name/' + name + '?project=' + project;
    console.log(composedUrl);
    return this.http.delete<Tab>(composedUrl).map(
      response => response,
      error => error
    );
  }

  async postDiff(text1: string, text2: string) {
    try {
      const body = {text1: text1, text2: text2};
      const headers = new HttpHeaders();
      headers.append('Content-Type', 'text/plain');
      const response = await this.http.post(this.baseAPIDiffMatchPatchUrl, JSON.stringify(body), {
        headers: headers,
        responseType: 'text'
      }).toPromise();
      console.log(response);
      return response;
    } catch (error) {
      console.log(error);
    }
  }
}
