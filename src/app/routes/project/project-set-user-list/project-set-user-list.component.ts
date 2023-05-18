import {Component, OnInit} from '@angular/core';
import {NzMessageService, NzModalRef} from 'ng-zorro-antd';
import {_HttpClient} from '@delon/theme';
import {SFSchema, SFTransferWidgetSchema, SFUISchema} from '@delon/form';
import {ProjectService} from "@core/project/project.service";
import {UserService} from "@core/user/user.service";
import {UserDTO} from "@core/user/user.model";
import {map} from "rxjs/operators";

@Component({
    selector: 'app-project-project-set-user-list',
    templateUrl: './project-set-user-list.component.html',
})
export class ProjectProjectSetUserListComponent implements OnInit {

    constructor(
        private modal: NzModalRef, private msgSrv: NzMessageService, public http: _HttpClient,
        private projectService: ProjectService, private userService: UserService
    ) {
    }

    record: any = {};
    i: { userList: UserDTO[] };
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
                userList: {
                    type: 'string',
                    title: '用户',
                    ui: {
                        widget: 'transfer',
                        asyncData: () =>
                            this.userService.listUser()
                                .pipe(map((all) => all.map(item => ({
                                    title: item.name, value: item,
                                    direction: this.i.userList.some(selected => item.id === selected.id) ? 'right' : 'left'
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
        this.projectService.listUserForProject(this.record.id)
            .subscribe((owned) => {
                this.buildSchema();
                this.i = {
                    userList: owned
                }
            });
    }

    save(value: any) {
        const userList = value.userList.map((item) => new UserDTO({id: item.id}));
        this.projectService.setUserListForProject(this.record.id, userList)
            .subscribe(() => {
                this.msgSrv.success(`设置项目的用户成功`);
                this.modal.close(value);
            });
    }

    close() {
        this.modal.destroy();
    }
}
