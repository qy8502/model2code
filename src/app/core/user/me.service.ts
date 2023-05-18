import {Injectable, Injector} from '@angular/core';
import {Observable} from "rxjs";
import {_HttpClient, BaseApi, BaseUrl, Body, DELETE, GET, Path, PUT} from "@delon/theme";
import {UserDTO} from "@core/user/user.model";
import {CacheService} from "@delon/cache";
import {map} from "rxjs/operators";
import {AuthSocialRequest} from "@core/auth/auth.model";

const BASE_URL = "/me";

/**
 * 用户服务
 */
@Injectable({providedIn: 'root'})
@BaseUrl(BASE_URL)
export class MeService extends BaseApi {

  constructor(protected injector: Injector, private cacheService: CacheService, private http: _HttpClient) {
    super(injector);
  }


  /**
   * 获取项目对象
   */
  getMeAccount(): Observable<UserDTO> {
    return this._getMeAccount().pipe(map((data) => new UserDTO(data)));
  }

  /**
   * 获取账号
   */
  @GET("/account")
  _getMeAccount(): Observable<any> {
    return;
  }


  /**
   * 更新用户
   */
  @PUT()
  updateMe(@Body user: UserDTO): Observable<void> {
    return;
  }

  sendBindPhoneVerificationCode(phone) {
    return this.http.post(`/verification-code/phone`, {username: phone});
  }


  @PUT("/social/:provider")
  bindUserSocialByAuthorization(@Path('provider') provider: string, @Body code: AuthSocialRequest): Observable<void> {
    return;
  }


  @DELETE("/social/weixin")
  unbindUserWeixin(): Observable<void> {
    return;
  }

  /**
   * 修改个人密码
   */
  @PUT("password")
  setPasswordForMe(@Body user: UserDTO): Observable<void> {
    return;
  }

  /**
   * 修改个人密码
   */
  @PUT("phone")
  setPhoneForUser(@Body user: UserDTO): Observable<void> {
    return;
  }

}
