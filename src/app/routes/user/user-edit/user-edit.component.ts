import {Component, OnInit} from '@angular/core';
import {NzMessageService, NzModalRef} from 'ng-zorro-antd';
import {_HttpClient} from '@delon/theme';
import {SFSchema, SFStringWidgetSchema, SFUISchema} from '@delon/form';
import {UserService} from "@core/user/user.service";
import {UserDTO} from "@core/user/user.model";

@Component({
  selector: 'app-user-user-edit',
  templateUrl: './user-edit.component.html',
})
export class UserUserEditComponent implements OnInit {

  constructor(
    private modal: NzModalRef,
    private msgSrv: NzMessageService,
    public http: _HttpClient, private userService: UserService
  ) {
  }

  get adding(): boolean {
    return !(this.record && this.record.id);
  }

  record: any = {};
  routeData: any = {};
  i: UserDTO;
  schema: SFSchema;

  ui: SFUISchema = {
    '*': {
      spanLabelFixed: 100,
      grid: {span: 12},
    }
  };
  buildSchema = () => {
    this.schema = {
      properties: {
        name: {
          type: 'string', title: '姓名',
          ui: {placeholder: '请填写姓名'} as SFStringWidgetSchema
        },
        userName: {
          type: 'string', title: '用户名',
          ui: {hidden: !this.adding, placeholder: '请填写用户名'} as SFStringWidgetSchema
        },
        avatarUrl: {
          type: 'string', title: '头像地址',
          ui: {placeholder: '头像URL地址', grid: {span: 24}} as SFStringWidgetSchema
        }
      },
      required: ['name', ...this.adding ? ['userName'] : []],
    } as SFSchema;
  };

  ngOnInit(): void {
    if (!this.adding) {
      this.userService.getUser(this.record.id).subscribe((res: UserDTO) => {
        this.i = res;
        this.buildSchema();
      });
    } else {
      this.i = this.i || new UserDTO();
      this.buildSchema();
    }
  }

  save(value: any) {
    const data = new UserDTO(value);
    (this.adding ? this.userService.addUser(data) : this.userService.updateUser(this.record.id, data))
      .subscribe(() => {
        this.msgSrv.success(`${this.adding ? '新建' : '编辑'}成功`);
        this.modal.close(value);
      });
  }

  close() {
    this.modal.destroy();
  }
}
