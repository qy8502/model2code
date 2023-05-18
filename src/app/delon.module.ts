/**
 * 进一步对基础模块的导入提炼
 * 有关模块注册指导原则请参考：https://ng-alain.com/docs/module
 */
import {ModuleWithProviders, NgModule, Optional, SkipSelf} from '@angular/core';
import {throwIfAlreadyLoaded} from '@core';

import {AlainThemeConfig, AlainThemeModule, MenuService} from '@delon/theme';
// #region mock
import {DelonMockModule} from '@delon/mock';
import * as MOCKDATA from '../../_mock';
import {environment} from '@env/environment';
// #region reuse-tab
/**
 * 若需要[路由复用](https://ng-alain.com/components/reuse-tab)需要：
 * 1、增加 `REUSETAB_PROVIDES`
 * 2、在 `src/app/layout/default/default.component.html` 修改：
 *  ```html
 *  <section class="alain-default__content">
 *    <reuse-tab></reuse-tab>
 *    <router-outlet></router-outlet>
 *  </section>
 *  ```
 */
import {RouteReuseStrategy} from '@angular/router';
import {ReuseTabService, ReuseTabStrategy} from '@delon/abc/reuse-tab';
// tslint:disable-next-line: no-duplicate-imports
import {PageHeaderConfig, STConfig, STRequestOptions} from '@delon/abc';
import {DA_SERVICE_TOKEN, DA_STORE_TOKEN, DelonAuthConfig, IStore, JWTTokenModel} from '@delon/auth';
import {ACLService, DelonACLConfig, DelonACLModule} from '@delon/acl';
import {RBACLService} from "@core/auth/rbacl.service";
import {TypeTokenService} from "@core/auth/type-token.service";
import {SearchParam} from "@shared/shared.model";
import {OpenStrictlyMenuService} from "@core/menu/open-strictly-menus.service";
import {DelonCacheConfig} from "@delon/cache";

const MOCK_MODULES = !environment.production ? [DelonMockModule.forRoot({data: MOCKDATA})] : [];
// #endregion

const REUSETAB_PROVIDES = [
  {
    provide: RouteReuseStrategy,
    useClass: ReuseTabStrategy,
    deps: [ReuseTabService],
  },
];
// #endregion

// #region global config functions

export function fnPageHeaderConfig(): PageHeaderConfig {
  return {
    ...new PageHeaderConfig(),
    homeI18n: '模型生成代码',
    recursiveBreadcrumb: true
  };
}


export function fnDelonAuthConfig(): DelonAuthConfig {
  return {
    ...new DelonAuthConfig(),
    store_key: "_model2code",
    login_url: '/passport/login',
  };
}

export function fnDelonACLConfig(): DelonACLConfig {
  return {
    ...new DelonACLConfig(),
    guard_url: "/exception/403"
  };
}

export function fnTypeTokenService(options: DelonAuthConfig, store: IStore) {
  return new TypeTokenService(options, store, JWTTokenModel);
}


export function fnSTConfig(): STConfig {
  return {
    ...new STConfig(),
    ps: 20,
    req: {
      method: 'POST',
      reName: {pi: 'pageIndex', ps: 'pageSize'},
      allInBody: true,
      process: (requestOptions: STRequestOptions) => {
        const param = (requestOptions.body as SearchParam);
        param.count = param.pageIndex < 2;
        return requestOptions;
      }
    },
    res: {
      reName: {total: 'count', list: 'list'}
    },
    page: {
      front: false
    },
    modal: {size: 'lg'},
  };
}

export function fnAlainThemeConfig(): AlainThemeConfig {
  return Object.assign(new AlainThemeConfig(), {
    // http: {
    //   dateValueHandling: 'ignore',
    //   nullValueHandling: 'ignore',
    // },
  });
}


export function fnDelonCacheConfig(): DelonCacheConfig {
  return Object.assign(new DelonCacheConfig(), {
    type: 'm',
    expire: '600',
  });
}


const GLOBAL_CONFIG_PROVIDES = [
  // TIPS：@delon/abc 有大量的全局配置信息，例如设置所有 `st` 的页码默认为 `20` 行
  {provide: MenuService, useClass: OpenStrictlyMenuService},
  {provide: STConfig, useFactory: fnSTConfig},
  {provide: PageHeaderConfig, useFactory: fnPageHeaderConfig},
  {provide: AlainThemeConfig, useFactory: fnAlainThemeConfig},
  {provide: DelonCacheConfig, useFactory: fnDelonCacheConfig},
  {provide: DelonAuthConfig, useFactory: fnDelonAuthConfig},
  {
    provide: DA_SERVICE_TOKEN, useFactory: fnTypeTokenService,
    deps: [DelonAuthConfig, DA_STORE_TOKEN]
  },
  {provide: DelonACLConfig, useFactory: fnDelonACLConfig},
  {provide: ACLService, useClass: RBACLService},
  // TODO 需要单点登录打开此注释
  // {
  //   provide: DA_STORE_TOKEN, useClass: CookieStore,
  //   deps: [CookieService]
  // }
];

// #endregion

@NgModule({
  imports: [AlainThemeModule.forRoot(), DelonACLModule.forRoot(), ...MOCK_MODULES],
})
export class DelonModule {
  constructor(@Optional() @SkipSelf() parentModule: DelonModule) {
    throwIfAlreadyLoaded(parentModule, 'DelonModule');
  }

  static forRoot(): ModuleWithProviders {
    return {
      ngModule: DelonModule,
      providers: [...REUSETAB_PROVIDES, ...GLOBAL_CONFIG_PROVIDES],
    };
  }
}
