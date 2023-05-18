import {NgModule} from '@angular/core';
import {SharedModule} from '@shared';
import {ProjectRoutingModule} from './project-routing.module';
import {ProjectProjectEditComponent} from './project-edit/project-edit.component';
import {ProjectProjectListComponent} from './project-list/project-list.component';
import {ProjectProjectSetUserListComponent} from './project-set-user-list/project-set-user-list.component';
import {ModelComponentModule} from "../model/model-component.module";

const COMPONENTS = [
  ProjectProjectListComponent];
const COMPONENTS_NOROUNT = [
  ProjectProjectEditComponent,
  ProjectProjectSetUserListComponent];

@NgModule({
  imports: [
    ModelComponentModule,
    SharedModule,
    ProjectRoutingModule
  ],
  declarations: [
    ...COMPONENTS,
    ...COMPONENTS_NOROUNT
  ],
  entryComponents: COMPONENTS_NOROUNT
})
export class ProjectModule {
}
