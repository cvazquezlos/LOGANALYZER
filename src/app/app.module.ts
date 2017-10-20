import {NgModule, Type} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {HttpModule,
  JsonpModule} from '@angular/http';
import {MdDatepickerModule,
  MdDialogModule,
  MdInputModule,
  MdNativeDateModule,
  MdProgressSpinnerModule} from '@angular/material';

import {CovalentHighlightModule} from '@covalent/highlight';
import {CovalentHttpModule} from '@covalent/http';
import {CovalentMarkdownModule} from '@covalent/markdown';

import {AppComponent} from './app.component';
import {HomeComponent} from './component/home.component';
import {FilterComponent} from './component/home.component';
import {SettingsComponent} from "./component/home.component";
import {SharedModule} from './shared/shared.module';

import {routing} from './app.routing';
import {ElasticsearchService} from './service/elasticsearch.service';

import {RequestInterceptor} from '../config/interceptor/request.interceptor';

const httpInterceptorProviders: Type<any>[] = [
  RequestInterceptor,
];

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    FilterComponent,
    SettingsComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    CovalentHttpModule.forRoot({
      interceptors: [{
        interceptor: RequestInterceptor, paths: ['**'],
      }],
    }),
    CovalentHighlightModule,
    CovalentMarkdownModule,
    HttpModule,
    JsonpModule,
    MdDatepickerModule,
    MdDialogModule,
    MdInputModule,
    MdNativeDateModule,
    MdProgressSpinnerModule,
    routing,
    SharedModule
  ],
  providers: [
    ElasticsearchService
  ],
  bootstrap: [AppComponent],
  entryComponents: [FilterComponent, SettingsComponent]
})

export class AppModule {
}
