import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {ModelListComponent} from './model-list/model-list.component';
import {ModelGeneratorComponent} from "./generator/generator.component";

const routes: Routes = [

  {
    path: '', component: ModelListComponent,
    data: {title: "模型"}
  },
  {
    path: 'generator', component: ModelGeneratorComponent,
    data: {title: "生成代码"}
  }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ModelRoutingModule {
}
