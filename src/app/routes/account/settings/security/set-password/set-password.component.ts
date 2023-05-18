import {Component, OnInit} from '@angular/core';
import {NzMessageService, NzModalRef} from 'ng-zorro-antd';
import {_HttpClient} from '@delon/theme';
import {FormProperty, PropertyGroup, SFSchema, SFStringWidgetSchema, SFUISchema} from '@delon/form';
import {UserDTO} from "@core/user/user.model";
import {MeService} from "@core/user/me.service";

@Component({
    selector: 'app-user-set-password',
    templateUrl: './set-password.component.html',
})
export class UserSetPasswordComponent implements OnInit {

    constructor(
        private modal: NzModalRef,
        private msgSrv: NzMessageService,
        public http: _HttpClient, private meService: MeService
    ) {
    }

    i: UserDTO = new UserDTO();

    ui: SFUISchema = {
        '*': {
            spanLabelFixed: 100,
            grid: {span: 12},
        }
    };
    schema: SFSchema = {
        properties: {
            password: {
                type: 'string', title: '密码', minLength: 6,
                ui: {placeholder: '请填写密码', type: 'password'} as SFStringWidgetSchema
            },
            passwordConfirm: {
                type: 'string', title: '确认密码', minLength: 6,
                ui: {
                    placeholder: '请填写确认密码', type: 'password',
                    validator: (value: any, formProperty: FormProperty, form: PropertyGroup) => {
                        console.log(form.value)
                        return !form.value || value === form.value.password ? [] : [{
                            keyword: 'confirmPassword',
                            message: '确认密码必须与密码一致！'
                        }];
                    }
                } as SFStringWidgetSchema
            },
        },
        required: ['password', 'passwordConfirm'],
    } as SFSchema;

    ngOnInit(): void {

    }

    save(value: any) {
        const data = new UserDTO({password: value.password});
        this.meService.setPasswordForMe(data)
            .subscribe(() => {
                this.msgSrv.success(`修改密码成功`);
                this.modal.close(value);
            });
    }

    close() {
        this.modal.destroy();
    }
}
