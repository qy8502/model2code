import {ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit} from '@angular/core';
import {NzMessageService} from 'ng-zorro-antd';
import {_HttpClient, ModalHelper} from "@delon/theme";
import {UserSetPasswordComponent} from "./set-password/set-password.component";
import {MeService} from "@core/user/me.service";
import {UserDTO} from "@core/user/user.model";
import {UserSetPhoneComponent} from "./set-phone/set-phone.component";
import {AuthService} from "@core/auth/auth.service";
import {StartupService} from "@core";

@Component({
  selector: 'app-account-settings-security',
  templateUrl: './security.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProAccountSettingsSecurityComponent implements OnInit {

  constructor(public msg: NzMessageService, private modal: ModalHelper, public authService: AuthService,
              public startupService: StartupService, public http: _HttpClient, public meService: MeService, public cdr: ChangeDetectorRef) {
  }

  account: UserDTO;

  disabled = false;

  ngOnInit(): void {
    this.meService.getMeAccount().subscribe((user) => {
      this.account = user;
      this.cdr.detectChanges();
    });
  }

  editPassword() {
    this.modal
      .createStatic(UserSetPasswordComponent)
      .subscribe();
  }

  changePhone() {
    this.modal
      .createStatic(UserSetPhoneComponent)
      .subscribe(() => {
        this.ngOnInit()
      });

  }

  bindWeixin() {
    const provider = 'weixin';
    this.authService.openSocialWindow({provider}).subscribe(param => {

      this.meService.bindUserSocialByAuthorization(provider, param).subscribe(() => {
        this.msg.success("绑定微信成功！");
        this.startupService.refresh(true);
        this.ngOnInit();
      })
    })
  }

  unbindWeixin() {
    this.meService.unbindUserWeixin().subscribe(() => {
      this.msg.success("解绑微信成功！");
      this.ngOnInit();
    });
  }
}
