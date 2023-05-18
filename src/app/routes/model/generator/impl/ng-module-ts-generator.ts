import {CodeTypeEnum, CrudGenerator, Generator} from "../generator";
import {EnumItem} from "@shared/shared";
import {FieldTypeMap, FieldTypeValueForeignList, Model, Module, Project} from "../../model.model";
import * as format from 'date-fns/format';
import {
  getField,
  getFieldTypeTs,
  getFkMap, getFkMapOfOther,
  isForeignOfOther,
  isMany2Many,
  isMany2ManyOnly,
  isModelSameModule
} from "../../model.helper";
import {toLowerLine} from "../../name.helper";

export class NgModuleTsGenerator extends Generator {

  protected splitCodeBy(): typeof Project | typeof Module | typeof Model {
    return Module;
  }

  protected getType(module?: Module, models?: Model[], model?: Model): EnumItem {
    return CodeTypeEnum.NG;
  }

  protected createFileDirectory(module?: Module, models?: Model[], model?: Model): string {
    return `${this.project.nameDirectory}-web-client/src/app/routes/${module.nameLowerLine}/`;
  }

  protected createFileName(module?: Module, models?: Model[], model?: Model): string {
    return `${module.nameLowerLine}.module`;
  }

  protected createFileExtension(module?: Module, models?: Model[], model?: Model): string {
    return "ts";
  }

  protected createCode(module?: Module, models?: Model[], model?: Model): string {
    if (models.every(modelItem => modelItem.enum)) {
      return null;
    }
    return super.createCode(module, models, model);
  }

  public createCodeStart(module?: Module, models?: Model[], model?: Model): string {
    return '';
  }

  protected createCodeMain(module?: Module, models?: Model[], model?: Model): string {
    let imports = '';
    const components = [];
    const componentsNorount = [];
    models.forEach((item) => {
      if (!isMany2ManyOnly(item)) {
        const className = `${isModelSameModule(this._project, module.name) ? '' : module.name}${item.name}`;
        const classPath = `${isModelSameModule(this._project, module.name) ? '' : item.nameLowerLine + '-'}`;
        imports += `
import { ${className}EditComponent } from './${classPath}edit/${classPath}edit.component';
import { ${className}ListComponent } from './${classPath}list/${classPath}list.component';`;
        components.push(`  ${className}ListComponent`);
        componentsNorount.push(`  ${className}EditComponent`);
        Object.values(getFkMapOfOther(this.project.models, item, this.project.modelMap))
          .filter(fkItem => fkItem.m2mItem && fkItem.m2mItem.model.moduleName === module.name).forEach(fkItem => {
          componentsNorount.push(`  ${module.name}${isModelSameModule(this._project, module.name) ? '' : item.name}Set${fkItem.name}${fkItem.model.name}ListComponent`);
          imports += `
import { ${module.name}${isModelSameModule(this._project, module.name) ? '' : item.name}Set${fkItem.name}${fkItem.model.name}ListComponent } from './${isModelSameModule(this._project, module.name) ? '' : item.nameLowerLine + '-'}set-${fkItem.model.nameLowerLine}-list${fkItem.name ? '-' + fkItem.nameLowerLine : ''}/${isModelSameModule(this._project, module.name) ? '' : item.nameLowerLine + '-'}set-${fkItem.model.nameLowerLine}-list${fkItem.name ? '-' + fkItem.nameLowerLine : ''}.component';`;
        });
      }
    });

    return `import { NgModule } from '@angular/core';
import { SharedModule } from '@shared';
import { ${module.name}RoutingModule } from './${module.nameLowerLine}-routing.module';${imports}

const COMPONENTS = [
${components.join(', \n')}];
const COMPONENTS_NOROUNT = [
${componentsNorount.join(', \n')}];

@NgModule({
  imports: [
    SharedModule,
    ${module.name}RoutingModule
  ],
  declarations: [
    ...COMPONENTS,
    ...COMPONENTS_NOROUNT
  ],
  entryComponents: COMPONENTS_NOROUNT
})
export class ${module.name}Module { }
`;
  }

  public createCodeEnd(module?: Module, models?: Model[], model?: Model): string {
    return '';
  }

}
