import {_HttpClient, SettingsService} from '@delon/theme';
import {Component, Inject, OnDestroy, Optional} from '@angular/core';
import {Router} from '@angular/router';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {NzMessageService, NzModalService} from 'ng-zorro-antd';
import {DA_SERVICE_TOKEN, ITokenService, SocialService} from '@delon/auth';
import {ReuseTabService} from '@delon/abc';
import {StartupService} from '@core';
import {AuthService} from '@core/auth/auth.service';
import {AuthAttemptCodeRequest, AuthRequest, AuthVerificationCodeRequest} from "@core/auth/auth.model";
import {UserDTO} from "@core/user/user.model";
import {ALLOW_ANONYMOUS} from "@core/auth/jwt-fixed.interceptor";

@Component({
  selector: 'passport-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.less'],
  providers: [SocialService],
})
export class UserLoginComponent implements OnDestroy {

  constructor(
    fb: FormBuilder,
    modalSrv: NzModalService,
    private router: Router,
    private settingsService: SettingsService,
    private socialService: SocialService,
    @Optional()
    @Inject(ReuseTabService)
    private reuseTabService: ReuseTabService,
    @Inject(DA_SERVICE_TOKEN) private tokenService: ITokenService,
    private startupSrv: StartupService,
    private  authService: AuthService,
    public http: _HttpClient,
    public msg: NzMessageService,
  ) {
    this.form = fb.group({
      userName: [null, [Validators.required, Validators.minLength(4)]],
      password: [null, Validators.required],
      mobile: [null, [Validators.required, Validators.pattern(/^1\d{10}$/)]],
      captcha: [null, [Validators.required]],
      remember: [true],
    });
    modalSrv.closeAll();
  }

  // #region fields

  get userName() {
    return this.form.controls.userName;
  }

  get password() {
    return this.form.controls.password;
  }

  get mobile() {
    return this.form.controls.mobile;
  }

  get captcha() {
    return this.form.controls.captcha;
  }

  form: FormGroup;
  error = '';
  type = 0;

  // #region get captcha

  count = 0;
  interval$: any;

  // #endregion
  attemptCodeMobile;
  attemptCodeSocial;

  // #endregion

  switch(ret: any) {
    this.type = ret.index;
  }

  getCaptcha() {
    if (this.mobile.invalid) {
      this.mobile.markAsDirty({onlySelf: true});
      this.mobile.updateValueAndValidity({onlySelf: true});
      return;
    }
    this.authService.sendTokenVerificationCode(this.mobile.value).subscribe();
    this.count = 59;
    this.interval$ = setInterval(() => {
      this.count -= 1;
      if (this.count <= 0) {
        clearInterval(this.interval$);
      }
    }, 1000);
  }

  submit() {
    this.error = '';
    if (this.type === 0) {
      this.userName.markAsDirty();
      this.userName.updateValueAndValidity();
      this.password.markAsDirty();
      this.password.updateValueAndValidity();
      if (this.userName.invalid || this.password.invalid) {
        return;
      }
      const authRequestModel = new AuthRequest();
      authRequestModel.username = this.userName.value;
      authRequestModel.password = this.password.value;
      this.authService.login(authRequestModel).subscribe(this.loginSuccess);

    } else {
      this.mobile.markAsDirty();
      this.mobile.updateValueAndValidity();
      this.captcha.markAsDirty();
      this.captcha.updateValueAndValidity();
      if (this.mobile.invalid || this.captcha.invalid) {
        return;
      }
      const authRequestModel = new AuthVerificationCodeRequest();
      authRequestModel.username = this.mobile.value;
      authRequestModel.code = this.captcha.value;
      this.authService.loginByVerificationCode(authRequestModel).subscribe(this.loginSuccess, res => {
        if (res.error.errorType === "UsernameNotRegisteredException") {
          this.attemptCodeMobile = res.error.attemptCode;
        }
      });
    }
  }

  loginSuccess = (token: any) => {
    this.attemptCodeMobile = null;
    // 清空路由复用信息
    this.reuseTabService.clear();
    // 设置用户Token信息
    this.tokenService.set(token);
    // 绑定社区账号
    if (this.attemptCodeSocial) {
      this.authService.bindUserSocialByAttempt(this.attemptCodeSocial).subscribe(() => {
        this.attemptCodeSocial = null;
        this.startupSrv.refresh(true);
      })
    }
    // 重新获取 StartupService 内容，我们始终认为应用信息一般都会受当前用户授权范围而影响
    this.startupSrv.load().then(() => {
      let url = this.tokenService.referrer!.url || '/';
      if (url.includes('/passport')) {
        url = '/';
      }
      this.router.navigateByUrl(url);
      this.msg.success('登录成功！');
    });
  };

  // #region social

  openSocial(provider: string) {

    this.authService.openSocialWindow({provider}).subscribe((param) => {

      this.authService.loginBySocial(param)
        .subscribe(this.loginSuccess, res => {
          if (res.error.errorType === "UsernameNotRegisteredException") {
            this.attemptCodeSocial = res.error.attemptCode;
          }
        });
    });
  }

  hello4() {
    this.http.get("/test/hello2", ALLOW_ANONYMOUS, {responseType: "text"})
      .subscribe((text) => console.log(text))
  }


  // #endregion

  ngOnDestroy(): void {
    if (this.interval$) {
      clearInterval(this.interval$);
    }
  }

  register() {
    if (this.attemptCodeMobile) {
      this.authService.registerUserByAttemptCode(new UserDTO({
        attemptCode: this.attemptCodeMobile,
        password: '123456'
      })).subscribe(() => {
        this.authService.loginByAttemptCode(new AuthAttemptCodeRequest(this.attemptCodeMobile)).subscribe(this.loginSuccess);
      });
      return;
    }
    this.msg.error('请找曲延凯')
  }

  forgot() {
    this.mobile.markAsDirty();
    this.mobile.updateValueAndValidity();
    this.captcha.markAsDirty();
    this.captcha.updateValueAndValidity();
    if (this.mobile.invalid || this.captcha.invalid) {
      this.msg.error('选择手机号登录，输入手机号和验证码，点击"忘记密码"，可以登录并重置密码为123456')
      return;
    }
    const authRequestModel = new AuthVerificationCodeRequest();
    authRequestModel.username = this.mobile.value;
    authRequestModel.code = this.captcha.value;
    authRequestModel.passwordReplacement = "123456";
    this.authService.loginByVerificationCode(authRequestModel).subscribe(this.loginSuccess, res => {
      if (res.error.errorType === "UsernameNotRegisteredException") {
        this.attemptCodeMobile = res.error.attemptCode;
      }
    });
  }
}
