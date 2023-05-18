import {Inject, Injectable, Injector} from '@angular/core';
import {interval, of, zip} from 'rxjs';
import {catchError, map} from 'rxjs/operators';
import {_HttpClient, ALAIN_I18N_TOKEN, MenuService, SettingsService, TitleService} from '@delon/theme';
import {DA_SERVICE_TOKEN, ITokenService, JWTTokenModel} from '@delon/auth';
import {ACLService} from '@delon/acl';
import {TranslateService} from '@ngx-translate/core';
import {I18NService} from '../i18n/i18n.service';

import {NzIconService} from 'ng-zorro-antd/icon';
import {ICONS_AUTO} from '../../../style-icons-auto';
import {ICONS} from '../../../style-icons';
import {AuthService} from "@core/auth/auth.service";
import {ReuseTabService} from "@delon/abc";
import {
  ROLE_PREFIX,
  TOKEN_AUTHORITIES,
  TOKEN_REFRESH_TOKEN,
  TOKEN_USER_AVATAR,
  TOKEN_USER_ID,
  TOKEN_USER_NAME,
  UserDetailDTO
} from "@core/auth/auth.model";
import {TypeTokenService} from "@core/auth/type-token.service";

/**
 * Used for application startup
 * Generally used to get the basic data of the application, like: Menu Data, User Data, etc.
 */
@Injectable()
export class StartupService {
  constructor(
    iconSrv: NzIconService,
    private menuService: MenuService,
    private translate: TranslateService,
    @Inject(ALAIN_I18N_TOKEN) private i18n: I18NService,
    private settingService: SettingsService,
    private aclService: ACLService,
    private titleService: TitleService,
    private reuseTabService: ReuseTabService,
    @Inject(DA_SERVICE_TOKEN) private tokenService: ITokenService,
    private authService: AuthService,
    private http: _HttpClient,
    private injector: Injector
  ) {
    iconSrv.addIcon(...ICONS_AUTO, ...ICONS);
    reuseTabService.mode = 1;
    // 因为是单点登录系统，用户可能会在其他系统注销，或切换用户。
    // 如果发生token变更的情况将重新初始化系统。
    (tokenService as TypeTokenService).changeByGet()
      .subscribe((token: JWTTokenModel) => {
        console.warn("token意外变更", token);
        if (!this.loading) {
          this.load().then();
        }
      });

    interval(60000)
      .subscribe(() => {
        if (!this.loading) {
          this.refresh();
        }
      });
  }

  loading = true;


  refresh(fetch: boolean = false): void {
    const token = this.tokenService.get<JWTTokenModel>(JWTTokenModel);
    if (fetch ||
      (token && token.token && !token.isExpired() && token.isExpired(43190) && token[TOKEN_REFRESH_TOKEN])) {
      this.authService.refresh(token).subscribe((tokenNew) => {
        this.tokenService.set(tokenNew);
        this.load();
        console.warn('已经为您保持登录状态。如果当前设备不是您个人使用，请在离开前主动安全退出。');
      }, (err) => {
      });
    }
  }

  load(): Promise<any> {
    this.loading = true;
    // only works with promises
    // https://github.com/angular/angular/issues/15088
    return new Promise((resolve) => {
      // 定义所有的配置信息的请求
      const requests = [
        this.http.get(`assets/config/i18n/${this.i18n.defaultLang}.json`),
        this.http.get('assets/config/app-data.json'),
      ];
      // 如果登录了，增加获取用户信息的请求
      const token = this.tokenService.get<JWTTokenModel>(JWTTokenModel);
      if (token && token.token && !token.isExpired()) {
        const payload = token.payload;
        if (payload[TOKEN_USER_ID] && payload[TOKEN_USER_NAME] && payload[TOKEN_AUTHORITIES]) {
          requests.push(of(new UserDetailDTO(
            {
              id: payload[TOKEN_USER_ID],
              name: payload[TOKEN_USER_NAME],
              avatar: payload[TOKEN_USER_AVATAR],
              authorities: payload[TOKEN_AUTHORITIES]
            })));
        } else {
          requests.push(this.authService.me().pipe(map((result) => {
            const user: UserDetailDTO = new UserDetailDTO(result);
            return user;
          })));
        }
      }


      zip(
        ...requests)
        .pipe(
          // 接收其他拦截器后产生的异常消息
          catchError(([langData, appData, userData]) => {
            resolve(null);
            return of([langData, appData, userData]);
          }),
        )
        .subscribe(
          ([langData, appData, userData]) => {
            // Setting language data
            this.translate.setTranslation(this.i18n.defaultLang, langData);
            this.translate.setDefaultLang(this.i18n.defaultLang);
            // application data
            const res: any = appData;
            // 应用信息：包括站点名、描述、年份
            this.settingService.setApp(res.app);
            // 初始化菜单
            this.menuService.add(res.menu);
            // 设置页面标题的后缀
            this.titleService.default = '';
            this.titleService.suffix = res.app.name;
            this.settingService.setUser(userData ? userData : null);
            // ACL：设置角色
            this.aclService.setRole([]);
            if (userData && userData.authorities && userData.authorities.length) {
              userData.authorities.forEach((authority) => {
                if (authority.indexOf(ROLE_PREFIX) === 0) {
                  this.aclService.attachRole([authority]);
                } else {
                  this.aclService.attachAbility([authority]);
                }
              })
            }

            this.menuService.resume();
          },
          () => {
          },
          () => {
            resolve(null);
          },
        );
    })
      .then(() => this.loading = false);
  }


}
