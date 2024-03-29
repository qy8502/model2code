import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ReactiveFormsModule, FormsModule} from '@angular/forms';
import {RouterModule} from '@angular/router';
// delon
import {AlainThemeModule} from '@delon/theme';
import {DelonABCModule} from '@delon/abc';
import {DelonACLModule} from '@delon/acl';
import {DelonFormModule} from '@delon/form';
// i18n
import {TranslateModule} from '@ngx-translate/core';

// #region third libs
import {NgZorroAntdModule} from 'ng-zorro-antd';
import {CountdownModule} from 'ngx-countdown';
import {NgxTinymceModule} from "ngx-tinymce";

const THIRDMODULES = [
  NgZorroAntdModule,
  CountdownModule
];
// #endregion

// #region your componets & directives
const COMPONENTS = [];
const DIRECTIVES = [];

// #endregion

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    ReactiveFormsModule,
    AlainThemeModule.forChild(),
    DelonABCModule,
    DelonACLModule,
    DelonFormModule,
    // third libs
    ...THIRDMODULES,
    NgxTinymceModule.forRoot({
      baseURL: '/assets/libs/tinymce/',
      config: {language: 'zh_CN'}
    })
  ],
  declarations: [
    // your components
    ...COMPONENTS,
    ...DIRECTIVES
  ],
  exports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    AlainThemeModule,
    DelonABCModule,
    DelonACLModule,
    DelonFormModule,
    // i18n
    TranslateModule,
    // third libs
    ...THIRDMODULES,
    NgxTinymceModule,
    // your components
    ...COMPONENTS,
    ...DIRECTIVES
  ]
})
export class SharedModule {
}
