import {Component, OnInit, ViewChild} from '@angular/core';
import {ModalHelper} from '@delon/theme';
import {STChange, STColumn, STComponent} from '@delon/abc';
import {SFSchema} from '@delon/form';
import {UserService} from "@core/user/user.service";
import {BaseRoleDTO, BaseRoleSearchParam} from "@core/user/user.model";
import {STData} from "@delon/abc/table/table.interfaces";
import {Subscription} from "rxjs";
import {finalize} from "rxjs/operators";
import {PageList} from "@shared/shared.model";
import {UserBaseRoleEditComponent} from "../base-role-edit/base-role-edit.component";
import {NzMessageService, NzModalService} from "ng-zorro-antd";
import {BaseRole} from "@core/auth/base-role.constant";
import {UserPermission} from "@core/user/user-permission.constant";
import {ACLCanType} from "@delon/acl";
import {ActivatedRoute} from "@angular/router";
import {UserBaseRoleSetUserListComponent} from "../base-role-set-user-list/base-role-set-user-list.component";

@Component({
    selector: 'app-user-base-role-list',
    templateUrl: './base-role-list.component.html'
})
export class UserBaseRoleListComponent implements OnInit {

    constructor(private route: ActivatedRoute, private modal: ModalHelper, private modalService: NzModalService,
                private msgSrv: NzMessageService, private userService: UserService) {
    }

    // 新建操作权限
    aclAdd: ACLCanType = {role: [BaseRole.SYSTEM.value], ability: [UserPermission.BASE_ROLE_ADD.value], mode: 'oneOf'};
    // 路由参数
    routeParam = new BaseRoleSearchParam({});
    // 路由数据
    routeData = {
        title: this.route.snapshot.data.title || "",
        subTitle: "",
    };
    // 查询参数
    param: BaseRoleSearchParam = new BaseRoleSearchParam();
    // 查询返回数据列表
    data: STData[];
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
        {title: '编号', index: 'id'},
        {title: '名称', index: 'name'},
        {
            title: '',
            buttons: [
                // { text: '查看', click: (item: any) => `/user/base-role/${item.id}` },
                {
                    text: '分配用户',
                    type: 'static',
                    component: UserBaseRoleSetUserListComponent,
                    params: (item: any) => ({record: item}),
                    click: 'reload',
                    acl: {
                        role: [BaseRole.SYSTEM.value],
                        ability: [UserPermission.BASE_ROLE_SET_USER_LIST.value],
                        mode: 'oneOf'
                    }
                },
                {
                    text: '编辑',
                    type: 'static',
                    component: UserBaseRoleEditComponent,
                    params: (item: any) => ({record: item, routeData: this.routeData}),
                    click: 'reload',
                    acl: {role: [BaseRole.SYSTEM.value], ability: [UserPermission.BASE_ROLE_EDIT.value], mode: 'oneOf'}
                },
                {
                    text: '删除', click: (item: any) => this.modalService.confirm({
                        nzTitle: `是否确认删除基础角色"${item.name}"?`,
                        nzOnOk: () => this.userService.deleteBaseRole(item.id).subscribe(() => {
                            this.msgSrv.success('删除成功');
                            this.st.reload();
                        })
                    }),
                    acl: {
                        role: [BaseRole.SYSTEM.value],
                        ability: [UserPermission.BASE_ROLE_DELETE.value],
                        mode: 'oneOf'
                    }
                },
            ]
        }
    ];
    // 生成查询参数表单定义(表单定义可能根据情况调整，所以动态生成)
    buildSearchSchema = () => {
        this.searchSchema = {
            properties: {}
        }
    };

    // 页面初始化
    ngOnInit() {
        // 获取参数数据
        this.buildSearchSchema();
        this.search();
    }

    // 查询数据（查询条件变更）
    search(values?: any) {
        this.param = new BaseRoleSearchParam(values || this.routeParam);
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
        this.loading = this.userService.searchBaseRole(this.param.toParam()).pipe(
            finalize(() => (this.loading = null)),
        ).subscribe((result: PageList<BaseRoleDTO>) => {
            this.data = result.list;
            this.total = this.param.count ? result.count : this.total;
        });
    }

    // 新建
    add() {
        this.modal
            .createStatic(UserBaseRoleEditComponent, {i: new BaseRoleDTO(), routeData: this.routeData})
            .subscribe(() => this.st.reload());
    }

}
