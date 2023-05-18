import {Component, OnInit, ViewChild} from '@angular/core';
import {ModalHelper} from '@delon/theme';
import {STChange, STColumn, STComponent} from '@delon/abc';
import {SFSchema} from '@delon/form';
import {UserService} from "@core/user/user.service";
import {UserDTO, UserSearchParam} from "@core/user/user.model";
import {Subscription} from "rxjs";
import {finalize} from "rxjs/operators";
import {PageList} from "@shared/shared.model";
import {UserUserEditComponent} from "../user-edit/user-edit.component";
import {NzMessageService, NzModalService} from "ng-zorro-antd";
import {BaseRole} from "@core/auth/base-role.constant";
import {UserPermission} from "@core/user/user-permission.constant";
import {ACLCanType} from "@delon/acl";
import {ActivatedRoute} from "@angular/router";
import {UserUserSetBaseRoleListComponent} from "../user-set-base-role-list/user-set-base-role-list.component";
import {AvatarService} from "@core/user/avatar.service";

@Component({
    selector: 'app-user-user-list',
    templateUrl: './user-list.component.html'
})
export class UserUserListComponent implements OnInit {

    constructor(private route: ActivatedRoute, private modal: ModalHelper, private modalService: NzModalService,
                private msgSrv: NzMessageService, private userService: UserService, private avatarService: AvatarService) {
    }

    // 新建操作权限
    aclAdd: ACLCanType = {role: [BaseRole.SYSTEM.value], ability: [UserPermission.USER_ADD.value], mode: 'oneOf'};
    // 路由参数
    routeParam = new UserSearchParam({});
    // 路由数据
    routeData = {
        title: this.route.snapshot.data.title || "",
        subTitle: "",
    };
    // 查询参数
    param: UserSearchParam = new UserSearchParam();
    // 查询返回数据列表
    data: UserDTO[];
    // 查询返回数据总数
    total = 0;
    // 执行查询订阅（查询中）
    loading: Subscription;
    // 查询参数表单定义
    searchSchema: SFSchema;
    // 列表控件
    @ViewChild('st', {static: false}) st: STComponent;
    // 列表定义
    columns: STColumn[] = [
        {title: '', type: 'img', index: 'avatar', width: 48},
        {title: '姓名', index: 'name'},
        {title: '用户名', index: 'userName'},
        {title: '是否可用', index: 'available', type: 'yn'},
        {
            title: '',
            buttons: [
                // { text: '查看', click: (item: any) => `/user/user/${item.id}` },
                {
                    text: '分配基础角色',
                    type: 'static',
                    component: UserUserSetBaseRoleListComponent,
                    params: (item: any) => ({record: item}),
                    click: 'reload',
                    acl: {
                        role: [BaseRole.SYSTEM.value],
                        ability: [UserPermission.USER_SET_BASE_ROLE_LIST.value],
                        mode: 'oneOf'
                    }
                },
                {
                    text: '编辑',
                    type: 'static',
                    component: UserUserEditComponent,
                    params: (item: any) => ({record: item, routeData: this.routeData}),
                    click: 'reload',
                    acl: {role: [BaseRole.SYSTEM.value], ability: [UserPermission.USER_EDIT.value], mode: 'oneOf'}
                },
                {
                    text: '重置密码',
                    click: item => {
                        this.modalService.confirm({
                            nzTitle: `是否确认将用户"${item.name}"的密码重置为"123456"?`,
                            nzOnOk: () => this.userService.setPasswordForUser(item.id, new UserDTO({password: 123456})).subscribe(() => {
                                this.msgSrv.success('重置密码成功');
                            })
                        })
                    }
                },
                {
                    text: '启用',
                    click: item => {
                        this.userService.setAvailableForUser(item.id, new UserDTO({available: true})).subscribe(() => {
                            this.msgSrv.success('启用成功');
                            this.st.reload();
                        })
                    },
                    iif: record => !record.available,
                    iifBehavior: 'hide'
                },
                {
                    text: '禁用',
                    click: item => {
                        this.userService.setAvailableForUser(item.id, new UserDTO({available: false})).subscribe(() => {
                            this.msgSrv.success('禁用成功');
                            this.st.reload();
                        })
                    },
                    iif: record => record.available,
                    iifBehavior: 'hide'
                },
                // {
                //   text: '删除', click: (item: any) => this.modalService.confirm({
                //     nzTitle: `是否确认删除用户"${item.name}"?`,
                //     nzOnOk: () => this.userService.deleteUser(item.id).subscribe(() => {
                //       this.msgSrv.success('删除成功');
                //       this.st.reload();
                //     })
                //   }),
                //   acl: {role: [BaseRole.SYSTEM.value], ability: [UserPermission.USER_DELETE.value], mode: 'oneOf'}
                // },
            ]
        }
    ];
    // 生成查询参数表单定义(表单定义可能根据情况调整，所以动态生成)
    buildSearchSchema = () => {
        this.searchSchema = {
            properties: {
                name: {
                    type: 'string', title: '姓名'
                },
                userName: {
                    type: 'string', title: '用户名'
                },
            }
        } as SFSchema;
    };

    // 页面初始化
    ngOnInit() {
        // 获取参数数据
        this.buildSearchSchema();
        this.search();
    }

    // 查询数据（查询条件变更）
    search(values?: any) {
        this.param = new UserSearchParam(values || this.routeParam);
        this.list();
    }

    // 列表发生改变
    change(e: STChange) {
        if (e.type === 'pi') {
            this.param.pageIndex = e.pi;
            this.list();
        }
    }

    // 获取列表数据
    list() {
        if (this.loading) {
            this.loading.unsubscribe();
        }
        this.loading = this.userService.searchUser(this.param.toParam()).pipe(
            finalize(() => (this.loading = null)),
        ).subscribe((result: PageList<UserDTO>) => {
            this.avatarService.handleUserAvatar(...result.list);
            this.data = result.list;
            this.total = this.param.count ? result.count : this.total;
        });
    }

    // 新建
    add() {
        this.modal
            .createStatic(UserUserEditComponent, {i: new UserDTO(), routeData: this.routeData})
            .subscribe(() => this.st.reload());
    }

}
