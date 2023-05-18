import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { UserUserListComponent } from '../user/user-list/user-list.component';
import { UserBaseRoleListComponent } from '../user/base-role-list/base-role-list.component';
import {ACLGuard} from "@delon/acl";
import {BaseRole} from "@core/auth/base-role.constant";

import {UserPermission} from "@core/user/user-permission.constant";

const routes: Routes = [

  {
    path: '',
    component: UserUserListComponent,
    canActivate: [ACLGuard],
    data: {title: "用户管理", guard: {role: [BaseRole.SYSTEM.value], ability: [UserPermission.USER_SEARCH.value], mode: 'oneOf'}}
  }, 
  //
  // {
  //   path: 'base-role',
  //   component: UserBaseRoleListComponent,
  //   canActivate: [ACLGuard],
  //   data: {title: "基础角色管理", guard: {role: [BaseRole.SYSTEM.value], ability: [UserPermission.BASE_ROLE_SEARCH.value], mode: 'oneOf'}}
  // }
  ];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class UserRoutingModule { }
