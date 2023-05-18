import {NgModule} from '@angular/core';
import {SharedModule} from '@shared';
import {ModelRoutingModule} from './model-routing.module';
import {ModelListComponent} from './model-list/model-list.component';
import {ModelEditComponent} from './model-edit/model-edit.component';
import {ModelProcessTableComponent} from './process-table/process-table.component';
import {DndModule} from "ng2-dnd";
import {ModelService} from "./model.service";
import {ModelGeneratorComponent} from './generator/generator.component';
import {HighlightModule} from "ngx-highlightjs";
import {NzHighlightModule} from "ng-zorro-antd";
import {ProjectEditComponent} from './project-edit/project-edit.component';
import {ModuleEditComponent} from "./module-edit/module-edit.component";
import {ModelEnumEditComponent} from "./model-enum-edit/model-enum-edit.component";

const COMPONENTS = [
  ModelListComponent,
  ModelGeneratorComponent];
const COMPONENTS_NOROUNT = [
  ModelEditComponent,
  ModelEnumEditComponent,
  ModelProcessTableComponent,
  ProjectEditComponent,
  ModuleEditComponent];

@NgModule({
  imports: [
    SharedModule,
    DndModule,
    HighlightModule,
    NzHighlightModule
  ],
  providers: [ModelService],
  declarations: [
    ...COMPONENTS,
    ...COMPONENTS_NOROUNT
  ],
  entryComponents: COMPONENTS_NOROUNT,
  exports: COMPONENTS
})
export class ModelComponentModule {
}
