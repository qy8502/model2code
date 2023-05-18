import {Component, OnInit} from '@angular/core';
import {NzMessageService, NzModalRef} from 'ng-zorro-antd';
import {_HttpClient} from '@delon/theme';
import {SFSchema, SFStringWidgetSchema, SFTextWidgetSchema, SFUISchema} from '@delon/form';
import {UserService} from "@core/user/user.service";
import {BaseRoleDTO} from "@core/user/user.model";

@Component({
    selector: 'app-user-base-role-edit',
    templateUrl: './base-role-edit.component.html',
})
export class UserBaseRoleEditComponent implements OnInit {

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
    i: BaseRoleDTO;
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

                id: {
                    type: 'string', title: '编号', readOnly: !this.adding,
                    ui: !this.adding ? {widget: 'text'} as SFTextWidgetSchema : {placeholder: '请填写编号'} as SFStringWidgetSchema
                },
                name: {
                    type: 'string', title: '名称',
                    ui: {placeholder: '请填写名称'} as SFStringWidgetSchema
                },
            },
            required: ['id', 'name'],
        };
    };

    ngOnInit(): void {
        if (!this.adding) {
            this.userService.getBaseRole(this.record.id).subscribe((res: BaseRoleDTO) => {
                this.i = res;
                this.buildSchema();
            });
        } else {
            this.i = this.i || new BaseRoleDTO();
            this.buildSchema();
        }
    }

    save(value: any) {
        const data = new BaseRoleDTO(value);
        (this.adding ? this.userService.addBaseRole(data) : this.userService.updateBaseRole(this.record.id, data))
            .subscribe(() => {
                this.msgSrv.success(`${this.adding ? '新建' : '编辑'}成功`);
                this.modal.close(value);
            });
    }

    close() {
        this.modal.destroy();
    }
}
