// tslint:disable: no-duplicate-imports
import {APP_INITIALIZER, LOCALE_ID, NgModule} from '@angular/core';
// #region Http Interceptors
import {HTTP_INTERCEPTORS, HttpClient, HttpClientModule} from '@angular/common/http';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
// #region default language
// Reference: https://ng-alain.com/docs/i18n
import {default as ngLang} from '@angular/common/locales/zh';
import {NZ_I18N, zh_CN as zorroLang} from 'ng-zorro-antd';
import {ALAIN_I18N_TOKEN, DELON_LOCALE, zh_CN as delonLang} from '@delon/theme';
// register angular
import {registerLocaleData} from '@angular/common';
// #endregion
// #region i18n services
import {TranslateLoader, TranslateModule} from '@ngx-translate/core';
import {TranslateHttpLoader} from '@ngx-translate/http-loader';
import {I18NService} from '@core/i18n/i18n.service';
// #region JSON Schema form (using @delon/form)
import {JsonSchemaModule} from '@shared/json-schema/json-schema.module';
import {DefaultInterceptor} from '@core/net/default.interceptor';
// #region global third module
import {HighlightModule} from "ngx-highlightjs";
import sql from 'highlight.js/lib/languages/sql';
import java from 'highlight.js/lib/languages/java';
import typescript from 'highlight.js/lib/languages/typescript';
import {DndModule} from "@beyerleinf/ngx-dnd";
// #region Startup Service
import {StartupService} from '@core/startup/startup.service';
import {DelonModule} from './delon.module';
import {CoreModule} from './core/core.module';
import {SharedModule} from './shared/shared.module';
import {AppComponent} from './app.component';
import {RoutesModule} from './routes/routes.module';
import {LayoutModule} from './layout/layout.module';
import {JWTFixedInterceptor} from "@core/auth/jwt-fixed.interceptor";

const LANG = {
  abbr: 'zh',
  ng: ngLang,
  zorro: zorroLang,
  delon: delonLang,
};
registerLocaleData(LANG.ng, LANG.abbr);
const LANG_PROVIDES = [
  {provide: LOCALE_ID, useValue: LANG.abbr},
  {provide: NZ_I18N, useValue: LANG.zorro},
  {provide: DELON_LOCALE, useValue: LANG.delon},
];

export function I18nHttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http, `assets/config/i18n/`, '.json');
}

const I18NSERVICE_MODULES = [
  TranslateModule.forRoot({
    loader: {
      provide: TranslateLoader,
      useFactory: I18nHttpLoaderFactory,
      deps: [HttpClient]
    }
  })
];

const I18NSERVICE_PROVIDES = [
  {provide: ALAIN_I18N_TOKEN, useClass: I18NService, multi: false}
];
// #region
const FORM_MODULES = [JsonSchemaModule];
// #endregion
const INTERCEPTOR_PROVIDES = [
  {provide: HTTP_INTERCEPTORS, useClass: JWTFixedInterceptor, multi: true},
  {provide: HTTP_INTERCEPTORS, useClass: DefaultInterceptor, multi: true}
];

// #endregion

export function hljsLanguages() {
  return [
    {name: 'sql', func: sql},
    {name: 'typescript', func: typescript},
    {name: 'java', func: java},
  ];
}

const GLOBAL_THIRD_MODULES = [
  DndModule.forRoot(),
  HighlightModule.forRoot({
    languages: hljsLanguages
  })
];

// #endregion
export function StartupServiceFactory(startupService: StartupService) {
  return () => startupService.load();
}

const APPINIT_PROVIDES = [
  StartupService,
  {
    provide: APP_INITIALIZER,
    useFactory: StartupServiceFactory,
    deps: [StartupService],
    multi: true
  }
];

// #endregion

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    DelonModule.forRoot(),
    CoreModule,
    SharedModule,
    LayoutModule,
    RoutesModule,
    ...I18NSERVICE_MODULES,
    ...FORM_MODULES,
    ...GLOBAL_THIRD_MODULES
  ],
  providers: [
    ...LANG_PROVIDES,
    ...INTERCEPTOR_PROVIDES,
    ...I18NSERVICE_PROVIDES,
    ...APPINIT_PROVIDES
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
}
