import {Component, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {SocialService} from '@delon/auth';
import {SettingsService} from '@delon/theme';

@Component({
  selector: 'app-callback',
  template: ``,
  providers: [SocialService],
})
export class CallbackComponent implements OnInit {
  type: string;
  code: string;
  state: string;

  constructor(
    private socialService: SocialService,
    private settingsSrv: SettingsService,
    private route: ActivatedRoute,
  ) {
  }

  ngOnInit(): void {
    this.type = this.route.snapshot.params.type;
    this.code = this.route.snapshot.queryParams.code;
    this.state = this.route.snapshot.queryParams.state;
    console.log(this.route.snapshot.queryParams);
    // this.socialService.callback({token: this.code, type: this.type, code: this.code, state: this.state});
  }

  private mockModel() {
    const info = {
      token: '123456789',
      name: 'cipchk',
      email: `${this.type}@${this.type}.com`,
      id: 10000,
      time: +new Date(),
    };
    this.settingsSrv.setUser({
      ...this.settingsSrv.user,
      ...info,
    });
    this.socialService.callback(info);
  }
}
