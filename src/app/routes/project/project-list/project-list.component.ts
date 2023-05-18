import {Component, OnInit, ViewChild} from '@angular/core';
import {ModalHelper} from '@delon/theme';
import {STChange, STColumn, STColumnBadge, STComponent} from '@delon/abc';
import {SFSchema} from '@delon/form';
import {ProjectService} from "@core/project/project.service";
import {UserService} from "@core/user/user.service";
import {EditingStatusEnum, EditingStatusMap, ProjectDTO, ProjectSearchParam} from "@core/project/project.model";
import {Subscription} from "rxjs";
import {finalize} from "rxjs/operators";
import {PageList} from "@shared/shared.model";
import {ProjectProjectEditComponent} from "../project-edit/project-edit.component";
import {NzMessageService, NzModalService} from "ng-zorro-antd";
import {BaseRole} from "@core/auth/base-role.constant";
import {ProjectPermission} from "@core/project/project-permission.constant";
import {ACLCanType, ACLService, ACLType} from "@delon/acl";
import {ActivatedRoute} from "@angular/router";
import {ProjectProjectSetUserListComponent} from "../project-set-user-list/project-set-user-list.component";
import {AvatarService} from "@core/user/avatar.service";

@Component({
  selector: 'app-project-project-list',
  templateUrl: './project-list.component.html'
})
export class ProjectProjectListComponent implements OnInit {

  constructor(private route: ActivatedRoute, private modal: ModalHelper, private modalService: NzModalService, private aclService: ACLService,
              private msgSrv: NzMessageService, private projectService: ProjectService, private userService: UserService, private avatarService: AvatarService) {
  }

  // 新建操作权限
  aclAdd: ACLCanType = {
    role: [BaseRole.SYSTEM.value, BaseRole.USER.value],
    ability: [ProjectPermission.PROJECT_ADD.value],
    mode: 'oneOf'
  };
  // 路由参数
  routeParam = new ProjectSearchParam({});
  // 路由数据
  routeData = {
    title: this.route.snapshot.data.title || "",
    subTitle: "",
  };
  // 查询参数
  param: ProjectSearchParam = new ProjectSearchParam();
  // 查询返回数据列表
  data: ProjectDTO[];
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
    {title: '名称', type: 'link', click: (item) => window.open(item.projectUrl), index: 'name'},
    // {title: '项目Git地址', type: 'link', click: (item) => window.open(item.projectUrl), index: 'projectUrl'},
    {title: '', type: 'img', index: 'editorAvatar', width: 48},
    {title: '模型编辑者', index: 'editorName'},
    {title: '模型编辑时间', index: 'editingTime', type: 'date'},
    {title: '状态', index: 'status', type: 'badge', badge: EditingStatusMap as STColumnBadge},
    {
      title: '',
      buttons: [
        // { text: '查看', click: (item: any) => `/project/project/${item.id}` },
        {
          text: '项目模型', type: 'link', click: (item: any) => `/project/${item.id}/model`,
          acl: {role: [BaseRole.SYSTEM.value, BaseRole.USER.value]}
        },
        {
          text: '设置成员',
          type: 'modal',
          modal: {
            component: ProjectProjectSetUserListComponent,
          },
          params: (item: any) => ({record: item}),
          click: 'reload',
          acl: {role: [BaseRole.SYSTEM.value, BaseRole.USER.value]}
        },
        {
          text: '编辑',
          type: 'modal',
          modal: {
            component: ProjectProjectEditComponent,
          },
          params: (item: any) => ({record: item, routeData: this.routeData}),
          click: 'reload',
          acl: {role: [BaseRole.SYSTEM.value, BaseRole.USER.value]}
        },
        {
          text: '删除', click: (item: any) => this.modalService.confirm({
            nzTitle: `是否确认删除项目"${item.name}"?`,
            nzOnOk: () => this.projectService.deleteProject(item.id).subscribe(() => {
              this.msgSrv.success('删除成功');
              this.st.reload();
            })
          }),
          acl: {
            role: [BaseRole.SYSTEM.value],
            ability: [ProjectPermission.PROJECT_DELETE.value],
            mode: 'oneOf'
          }
        },
        {
          text: '强制结束编辑', click: (item: any) => this.modalService.confirm({
            nzTitle: `是否确认强制结束编辑项目"${item.name}"?`,
            nzOnOk: () => this.projectService.checkInProject(item.id, new ProjectDTO()).subscribe(() => {
              this.msgSrv.success('强制结束编辑成功');
              this.st.reload();
            })
          }),
          iif: (item) => item.status === EditingStatusEnum.EDITING.value,
          acl: {
            role: [BaseRole.SYSTEM.value],
            ability: [ProjectPermission.PROJECT_DELETE.value],
            mode: 'oneOf'
          }
        },
      ]
    }
  ];
  // 生成查询参数表单定义(表单定义可能根据情况调整，所以动态生成)
  buildSearchSchema = () => {
    this.searchSchema = {
      properties: {
        name: {
          type: 'string', title: '名称'
        }
      }
    } as SFSchema
  };

  // 页面初始化
  ngOnInit() {
    // 获取参数数据
    this.buildSearchSchema();
    this.search();
  }

  // 查询数据（查询条件变更）
  search(values?: any) {
    this.param = new ProjectSearchParam(values || this.routeParam);
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
    this.loading = (this.aclService.can({role: [BaseRole.SYSTEM.value]} as ACLType) ?
        this.projectService.searchProject(this.param.toParam()) :
        this.projectService.searchProjectMine(this.param.toParam())
    ).pipe(
      finalize(() => (this.loading = null)),
    ).subscribe((result: PageList<ProjectDTO>) => {
      result.list.forEach(project => project.editorAvatar = project.editorAvatar || this.avatarService.avatar(project.editor, project.editorName))
      this.data = result.list;
      this.total = this.param.count ? result.count : this.total;
    });
  }

  // 新建
  add() {
    this.modal
      .createStatic(ProjectProjectEditComponent, {i: new ProjectDTO(), routeData: this.routeData})
      .subscribe(() => this.st.reload());
  }

}
