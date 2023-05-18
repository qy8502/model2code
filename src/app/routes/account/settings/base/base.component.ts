import {ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit} from '@angular/core';
import {_HttpClient, SettingsService} from '@delon/theme';
import {of} from 'rxjs';
import {NzMessageService} from 'ng-zorro-antd';
import {UserDTO} from "@core/user/user.model";
import {MeService} from "@core/user/me.service";
import {AvatarService} from "@core/user/avatar.service";
import {StartupService} from "@core";

@Component({
  selector: 'app-account-settings-base',
  templateUrl: './base.component.html',
  styleUrls: ['./base.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProAccountSettingsBaseComponent implements OnInit {

  constructor(private http: _HttpClient, private cdr: ChangeDetectorRef, private msg: NzMessageService, public startupService: StartupService,
              public settings: SettingsService, public avatarService: AvatarService, private  meService: MeService) {
  }

  avatar = '';
  userLoading = true;
  user: any;
  // #region geo

  provinces: any[] = [];
  cities: any[] = [];

  ngOnInit(): void {
    of(new UserDTO({
      id: this.settings.user.id,
      name: this.settings.user.name,
      avatarUrl: this.settings.user.avatar.indexOf("data:") === 0 ? "" : this.settings.user.avatar
    })).subscribe((user: UserDTO) => {
      this.userLoading = false;
      this.user = user;
      this.cdr.detectChanges();
    });
  }


  // #endregion

  save() {
    this.meService.updateMe(this.user).subscribe(() => {
      this.startupService.refresh(true);
    });
    return false;
  }
}
