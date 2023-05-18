import {Component, OnInit} from '@angular/core';
import {NzMessageService, NzModalRef} from 'ng-zorro-antd';
import {_HttpClient} from '@delon/theme';
import {MeService} from "@core/user/me.service";
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import {UserDTO} from "@core/user/user.model";

@Component({
  selector: 'app-user-set-phone',
  templateUrl: './set-phone.component.html',
})
export class UserSetPhoneComponent implements OnInit {

  constructor(
    fb: FormBuilder,
    private modal: NzModalRef,
    private msgSrv: NzMessageService,
    public http: _HttpClient, private meService: MeService
  ) {
    this.form = fb.group({

      mobile: [null, [Validators.required, Validators.pattern(/^1\d{10}$/)]],
      captcha: [null, [Validators.required]],
    });
  }

  get mobile() {
    return this.form.controls.mobile;
  }

  get captcha() {
    return this.form.controls.captcha;
  }

  form: FormGroup;

  count = 0;
  interval$: any;

  getCaptcha() {
    if (this.mobile.invalid) {
      this.mobile.markAsDirty({onlySelf: true});
      this.mobile.updateValueAndValidity({onlySelf: true});
      return;
    }
    this.meService.sendBindPhoneVerificationCode(this.mobile.value).subscribe();
    this.count = 59;
    this.interval$ = setInterval(() => {
      this.count -= 1;
      if (this.count <= 0) {
        clearInterval(this.interval$);
      }
    }, 1000);
  }

  ngOnInit(): void {

  }

  save() {
    this.mobile.markAsDirty();
    this.mobile.updateValueAndValidity();
    this.captcha.markAsDirty();
    this.captcha.updateValueAndValidity();
    if (this.mobile.invalid || this.captcha.invalid) {
      return;
    }
    this.meService.setPhoneForUser(new UserDTO({
      phone: this.mobile.value,
      verificationCode: this.captcha.value
    })).subscribe(() => {
      this.msgSrv.success(`更换手机号成功`);
      this.modal.close(true);
    });
  }

  close() {
    this.modal.destroy();
  }
}
