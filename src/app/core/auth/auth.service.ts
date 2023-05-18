import {Inject, Injectable, OnDestroy} from '@angular/core';
import {
  AccessToken,
  AuthAttemptCodeRequest,
  AuthRequest,
  AuthSocialRequest,
  AuthVerificationCodeRequest,
  TOKEN_REFRESH_TOKEN,
  UserDetailDTO
} from './auth.model';
import {Observable} from 'rxjs/internal/Observable';

import {ITokenModel, JWTTokenModel} from "@delon/auth";
import {_HttpClient} from "@delon/theme";
import {HttpHeaders, HttpParams} from "@angular/common/http";
import {environment} from "@env/environment";
import {map} from "rxjs/operators";
import {AvatarService} from "../user/avatar.service";
import {DOCUMENT} from "@angular/common";
import {UserDTO} from "../user/user.model";
import {ALLOW_ANONYMOUS} from "../auth/jwt-fixed.interceptor";
import {IGNORE_ERROR} from "../net/default.interceptor";

export const Authentication = {
  GRANT_TYPE_PASSWORD: 'password',
  GRANT_TYPE_REFRESH: 'refresh_token',
  GRANT_TYPE_VERIFICATION_CODE: 'verification_code',
  GRANT_TYPE_SOCIAL: 'social',

  AUTHORIZATION_BASIC: 'Basic',
  AUTHORIZATION_BASIC_TOKEN: environment.AUTHORIZATION_BASIC_TOKEN
};

const BASE_URL = `${environment.SERVICE_URLS.auth}`;

@Injectable({
  providedIn: 'root'
})
export class AuthService implements OnDestroy {

  constructor(private http: _HttpClient, private avatarService: AvatarService, @Inject(DOCUMENT) doc: any) {
    let headers = new HttpHeaders();
    headers = headers.append('Content-Type', 'application/x-www-form-urlencoded');
    headers = headers.append('Authorization', `${Authentication.AUTHORIZATION_BASIC} ${Authentication.AUTHORIZATION_BASIC_TOKEN}`);
    this.tokenHeaders = headers;
  }

  tokenHeaders;


  private _win;
  private _winTime;
  private observer;


  /**
   * 登录
   */
  login(auth: AuthRequest): Observable<ITokenModel> {
    let params = new HttpParams();
    params = params.append('username', auth.username);
    params = params.append('password', auth.password);
    params = params.append('grant_type', Authentication.GRANT_TYPE_PASSWORD);
    return this.http.post(`${BASE_URL}/oauth/token`, params, ALLOW_ANONYMOUS, {headers: this.tokenHeaders})
      .pipe(
        map((token) => new AccessToken(token))
      );

  }

  /**
   * 登录
   */
  loginByVerificationCode(auth: AuthVerificationCodeRequest): Observable<ITokenModel> {
    let params = new HttpParams();
    params = params.append('username', auth.username);
    params = params.append('code', auth.code);
    if (auth.passwordReplacement) {
      params = params.append('password_replacement', auth.passwordReplacement);
    }
    params = params.append('grant_type', auth.grant_type);
    return this.http.post(`${BASE_URL}/oauth/token`, params, ALLOW_ANONYMOUS, {headers: this.tokenHeaders})
      .pipe(
        map((token) => new AccessToken(token))
      );
  }


  /**
   * 登录
   */
  loginByAttemptCode(auth: AuthAttemptCodeRequest): Observable<ITokenModel> {
    let params = new HttpParams();
    params = params.append('code', auth.code);
    params = params.append('grant_type', auth.grant_type);
    return this.http.post(`${BASE_URL}/oauth/token`, params, ALLOW_ANONYMOUS, {headers: this.tokenHeaders})
      .pipe(
        map((token) => new AccessToken(token))
      );
  }

  openSocialWindow(options: any = {}): Observable<AuthSocialRequest> {
    options = {windowFeatures: 'location=yes,height=570,width=520,scrollbars=yes,status=yes', ...options};
    options.redirectUri = `http://id.qlteacher.com/callback/` + options.provider;
    switch (options.provider) {
      case 'github':
        options.url = `//github.com/login/oauth/authorize?client_id=9d6baae4b04a23fcafa2&response_type=code&redirect_uri=${decodeURIComponent(
          options.redirectUri,
        )}`;
        break;
      case 'weixin':
        options.url = `https://open.weixin.qq.com/connect/qrconnect?appid=wx43002a60ac3f3c1e&scope=snsapi_login&response_type=code&state=weixin&redirect_uri=${decodeURIComponent(
          options.redirectUri,
        )}`;
        break;
    }

    this._win = window.open(options.url, '_blank', options.windowFeatures);
    this._winTime = setInterval((
      () => {
        let parameters;
        try {
          const httpParams = new URLSearchParams(this._win.location.search);
          // let httpParams = new HttpParams({fromString: this._win.location.search});
          parameters = {};
          httpParams.forEach((value, key) => parameters[key] = value);
        } catch (e) {
          // 忽略跳转到第三方站点跨域问题错误
        }
        if (parameters && parameters.code) {
          this._win.close();
          this.ngOnDestroy();
          parameters.options = options;
          this.observer.next(new AuthSocialRequest(options.provider, options.redirectUri, parameters.code));
          this.observer.complete();
        } else if (this._win && this._win.closed) {
          this.ngOnDestroy();
          this.observer.error(parameters);
          this.observer.complete();
        }
      }), 100);
    return new Observable<AuthSocialRequest>((
      (observer) => {
        this.observer = observer;
      }));
  }

  loginBySocial(auth: AuthSocialRequest) {
    let params = new HttpParams();
    params = params.append('grant_type', auth.grant_type);
    // params = params.append('provider', provider);
    params = params.append('code', auth.code);
    if (auth.redirectUri) {
      params = params.append('redirect_uri', auth.redirectUri);
    }
    return this.http.post(`${BASE_URL}/oauth/token`, params, ALLOW_ANONYMOUS, {headers: this.tokenHeaders})
      .pipe(
        map((tokenNew) => new AccessToken(tokenNew))
      );
  }


  refresh(token: JWTTokenModel) {
    let params = new HttpParams();
    params = params.append('grant_type', Authentication.GRANT_TYPE_REFRESH);
    params = params.append(TOKEN_REFRESH_TOKEN, token[TOKEN_REFRESH_TOKEN]);
    return this.http.post(`${BASE_URL}/oauth/token`, params, {...ALLOW_ANONYMOUS, ...IGNORE_ERROR}, {headers: this.tokenHeaders})
      .pipe(
        map((tokenNew) => new AccessToken(tokenNew))
      );
  }


  me() {
    return this.http.get(`${BASE_URL}/me`).pipe(
      map((result) => {
        const user = new UserDetailDTO(result);
        user.avatar = user.avatar || this.avatarService.avatar(user.id, user.name);
        return user;
      })
    );
  }

  registerUserByAttemptCode(user: UserDTO) {
    return this.http.post(`${BASE_URL}/me`, user, ALLOW_ANONYMOUS);
  }

  bindUserSocialByAttempt(code: string) {
    return this.http.put(`${BASE_URL}/me/social/attempt/${code}`, null, ALLOW_ANONYMOUS);
  }

  ngOnDestroy() {
    clearInterval(this._winTime);
    this._winTime = null;
  }


  sendTokenVerificationCode(phone) {
    return this.http.post(`${BASE_URL}/verification-code/token`, {username: phone}, ALLOW_ANONYMOUS);
  }
}
