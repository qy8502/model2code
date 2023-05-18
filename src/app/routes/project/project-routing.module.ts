import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {ProjectProjectListComponent} from '../project/project-list/project-list.component';
import {ACLGuard} from "@delon/acl";
import {BaseRole} from "@core/auth/base-role.constant";
import {ModelListComponent} from "../model/model-list/model-list.component";
import {ModelGeneratorComponent} from "../model/generator/generator.component";

const routes: Routes = [

  {
    path: '',
    component: ProjectProjectListComponent,
    canActivate: [ACLGuard],
    data: {title: "项目管理", guard: {role: [BaseRole.SYSTEM.value, BaseRole.USER.value]}},
  },
  {
    path: ':projectId/model', component: ModelListComponent,
    canActivate: [ACLGuard],
    data: {title: "模型", guard: {role: [BaseRole.SYSTEM.value, BaseRole.USER.value]}}
  },
  {
    path: ':projectId/model/generator', component: ModelGeneratorComponent,
    canActivate: [ACLGuard],
    data: {title: "生成代码", guard: {role: [BaseRole.SYSTEM.value, BaseRole.USER.value]}}
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ProjectRoutingModule {
}
