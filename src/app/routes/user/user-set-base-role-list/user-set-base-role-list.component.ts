import {Component, OnInit} from '@angular/core';
import {NzMessageService, NzModalRef} from 'ng-zorro-antd';
import {_HttpClient} from '@delon/theme';
import {SFSchema, SFTransferWidgetSchema, SFUISchema} from '@delon/form';
import {UserService} from "@core/user/user.service";
import {BaseRoleDTO} from "@core/user/user.model";
import {map} from "rxjs/operators";

@Component({
    selector: 'app-user-user-set-base-role-list',
    templateUrl: './user-set-base-role-list.component.html',
})
export class UserUserSetBaseRoleListComponent implements OnInit {

    constructor(
        private modal: NzModalRef, private msgSrv: NzMessageService, public http: _HttpClient,
        private userService: UserService
    ) {
    }

    record: any = {};
    i: { baseRoleList: BaseRoleDTO[] };
    schema: SFSchema;
    ui: SFUISchema = {
        '*': {
            spanLabelFixed: 100,
            grid: {span: 24},
        },
    };
    buildSchema = () => {
        this.schema = {
            properties: {
                baseRoleList: {
                    type: 'string',
                    title: '基础角色',
                    ui: {
                        widget: 'transfer',
                        asyncData: () =>
                            this.userService.listBaseRole()
                                .pipe(map((all) => all.map(item => ({
                                    title: item.name, value: item,
                                    direction: this.i.baseRoleList.some(selected => item.id === selected.id) ? 'right' : 'left'
                                })))),
                        titles: ['未分配', '已分配'],
                        showSearch: true,
                        listStyle: {'width.px': 350, 'height.px': 500}
                    } as SFTransferWidgetSchema,
                }

            },
            required: [],
        };
    };

    ngOnInit(): void {
        this.userService.listBaseRoleForUser(this.record.id)
            .subscribe((owned) => {
                this.buildSchema();
                this.i = {
                    baseRoleList: owned
                }
            });
    }

    save(value: any) {
        const baseRoleList = value.baseRoleList.map((item) => new BaseRoleDTO({id: item.id}));
        this.userService.setBaseRoleListForUser(this.record.id, baseRoleList)
            .subscribe(() => {
                this.msgSrv.success(`设置用户的基础角色成功`);
                this.modal.close(value);
            });
    }

    close() {
        this.modal.destroy();
    }
}
