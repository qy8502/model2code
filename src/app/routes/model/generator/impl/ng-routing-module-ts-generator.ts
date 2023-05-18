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

export class NgRoutingModuleTsGenerator extends Generator {

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
    return `${module.nameLowerLine}-routing.module`;
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
    const importsMap = {};


    // 常量放到业务Module目录中
    // let importPermission = `import {${module.name}Permission} from "../${module.nameLowerLine}-permission.constant";`;
    // 常量放到core目录中
    // let importPermission = `import {${module.name}Permission} from "@core/${module.nameLowerLine}/${module.nameLowerLine}-permission.constant";`;
    const importPermissionMap = {};
    const components = [];
    models.forEach((item) => {
      if (!isMany2ManyOnly(item)) {
        const className = `${isModelSameModule(this._project, module.name) ? '' : module.name}${item.name}`;
        const classPath = `${isModelSameModule(this._project, module.name) ? '' : item.nameLowerLine + '-'}`;
        const classUrl = `${isModelSameModule(this._project, module.name) ? '' : item.nameLowerLine}`;
        importsMap[item.name] = `
import { ${className}ListComponent } from '../${module.nameLowerLine}/${classPath}list/${classPath}list.component';`;
        importPermissionMap[module.name] = `
import {${module.name}Permission} from "@core/${module.nameLowerLine}/${module.nameLowerLine}-permission.constant";`;
        components.push(`
  {
    path: '${classUrl}',
    component: ${className}ListComponent,
    canActivate: [ACLGuard],
    data: {title: "${item.comment}管理", guard: {role: [BaseRole.SYSTEM.value], ability: [${module.name}Permission.${item.nameConstant}_SEARCH.value], mode: 'oneOf'}}
  }`);

        const fkItems = getFkMapOfOther(this.project.models, item, this.project.modelMap);
        Object.values(fkItems).forEach((fkItem) => {
          if (fkItem.fkFields.some(f => f.search) && fkItem.model.moduleName === module.name) {
            const classNameFk = `${isModelSameModule(this._project, fkItem.model.moduleName) ? '' : fkItem.model.moduleName}${fkItem.model.name}`;
            const classPathFk = `${isModelSameModule(this._project, fkItem.model.moduleName) ? '' : fkItem.model.nameLowerLine + '-'}`;
            const classUrlFk = `${fkItem.model.nameLowerLine}`;
            const paramFk = fkItem.fkFields.map(field => `:${field.nameCamel}`).join("/");
            const mouleNameLowerLine = toLowerLine(fkItem.model.moduleName);
            importsMap[fkItem.model.name] = `
import { ${classNameFk}ListComponent } from '../${mouleNameLowerLine}/${classPathFk}list/${classPathFk}list.component';`;
            importPermissionMap[fkItem.model.moduleName] = `
import {${fkItem.model.moduleName}Permission} from "@core/${mouleNameLowerLine}/${mouleNameLowerLine}-permission.constant";`;
            components.push(`
  {
    path: '${classUrl}/${paramFk}/${classUrlFk}${fkItem.name ? '/' + fkItem.nameLowerLine : ''}',
    component: ${classNameFk}ListComponent,
    canActivate: [ACLGuard],
    data: {title: "${fkItem.model.comment}管理", guard: {role: [BaseRole.SYSTEM.value], ability: [${fkItem.model.moduleName}Permission.${fkItem.model.nameConstant}_SEARCH.value], mode: 'oneOf'}}
  }`);
          }
        });
      }

    });

    return `import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';${Object.values(importsMap).join("")}
import {ACLGuard} from "@delon/acl";
import {BaseRole} from "@core/auth/base-role.constant";
${Object.values(importPermissionMap).join("")}

const routes: Routes = [
${components.join(', \n')}];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ${module.name}RoutingModule { }
`;
  }

  public createCodeEnd(module?: Module, models?: Model[], model?: Model): string {
    return '';
  }

}
