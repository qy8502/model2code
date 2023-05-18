import {CodeTypeEnum, FieldsGenerator} from "../generator";
import {Field, Model, Module, Project} from "../../model.model";
import {EnumItem} from "@shared/shared";
import {isMany2ManyOnly, isModelSameModule} from "../../model.helper";

export class NgComponentListHtmlGenerator extends FieldsGenerator {

  protected splitCodeBy(): typeof Project | typeof Module | typeof Model {
    return Model;
  }

  protected getType(module?: Module, models?: Model[], model?: Model): EnumItem {
    return CodeTypeEnum.NG;
  }

  protected createFileDirectory(module?: Module, models?: Model[], model?: Model): string {
    return `${this.project.nameDirectory}-web-client/src/app/routes/${module.nameLowerLine}/${isModelSameModule(this._project, module.name) ? 'list' : model.nameLowerLine + '-list'}`;
  }

  protected createFileName(module?: Module, models?: Model[], model?: Model): string {
    return `${isModelSameModule(this.project, module.name) ? 'list' : model.nameLowerLine + '-list'}.component`;
  }

  protected createFileExtension(module?: Module, models?: Model[], model?: Model): string {
    return "html";
  }

  protected createCode(module?: Module, models?: Model[], model?: Model): string {
    if (isMany2ManyOnly(model)) {
      return null;
    }
    return super.createCode(module, models, model);
  }

  public createCodeStart(module?: Module, models?: Model[], model?: Model): string {
    return '';
  }


  public createCodeEnd(module?: Module, models?: Model[], model?: Model): string {
    return ''
  }


  public createCodeMain(module: Module, models: Model[], model: Model, params?: any): string {
    const search = model.fields.some((field) => field.search);
    return `<page-header [action]="phActionTpl" [title]="titleTpl">
  <ng-template #phActionTpl>
    <button (click)="add()" *aclIf="aclAdd" nz-button nzType="primary">新建</button>
  </ng-template>
  <ng-template #titleTpl>
    {{routeData.title}}<small class="text-grey-7" *ngIf="routeData.subTitle">{{routeData.subTitle}}</small>
  </ng-template>
</page-header>
<nz-card>
  ${search ? '' : '<!--'}<ng-container *ngIf="searchSchema">
    <sf #sf="sf" mode="search" button="none" [schema]="searchSchema" (formChange)="search($event)"></sf>
    <sf-condition [sfComponent]="sf"></sf-condition>
  </ng-container>${search ? '' : '-->'}
  <st #st [loading]="loading" [data]="data" [columns]="columns"
      [pi]="param.pageIndex" [ps]="param.pageSize" [total]="total" (change)="change($event)"></st>
</nz-card>
`;
  }


  protected createCodeFieldAny(module: Module, models: Model[], model: Model, field: Field, params?: any, typeDefault?: string): string {
    return '';
  }

  protected createCodeFieldForeignObject(module: Module, models: Model[], model: Model, field: Field, params?: any): string {
    return "";
  }

  protected createCodeFieldForeignArray(module: Module, models: Model[], model: Model, field: Field, params?: any): string {
    return "";
  }


}
