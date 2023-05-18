import { NgModule } from '@angular/core';
import { SharedModule } from '@shared';
import { UserRoutingModule } from './user-routing.module';
import { UserUserEditComponent } from './user-edit/user-edit.component';
import { UserUserListComponent } from './user-list/user-list.component';
import { UserUserSetBaseRoleListComponent } from './user-set-base-role-list/user-set-base-role-list.component';
import { UserBaseRoleEditComponent } from './base-role-edit/base-role-edit.component';
import { UserBaseRoleListComponent } from './base-role-list/base-role-list.component';
import { UserBaseRoleSetUserListComponent } from './base-role-set-user-list/base-role-set-user-list.component';

const COMPONENTS = [
  UserUserListComponent, 
  UserBaseRoleListComponent];
const COMPONENTS_NOROUNT = [
  UserUserEditComponent, 
  UserUserSetBaseRoleListComponent, 
  UserBaseRoleEditComponent, 
  UserBaseRoleSetUserListComponent];

@NgModule({
  imports: [
    SharedModule,
    UserRoutingModule
  ],
  declarations: [
    ...COMPONENTS,
    ...COMPONENTS_NOROUNT
  ],
  entryComponents: COMPONENTS_NOROUNT
})
export class UserModule { }
