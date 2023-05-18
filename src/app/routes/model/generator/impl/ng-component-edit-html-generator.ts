import {CodeTypeEnum, FieldsGenerator} from "../generator";
import {Field, Model, Module, Project} from "../../model.model";
import {EnumItem} from "@shared/shared";
import {findNameField, isMany2ManyOnly, isModelSameModule} from "../../model.helper";

export class NgComponentEditHtmlGenerator extends FieldsGenerator {

  protected splitCodeBy(): typeof Project | typeof Module | typeof Model {
    return Model;
  }

  protected getType(module?: Module, models?: Model[], model?: Model): EnumItem {
    return CodeTypeEnum.NG;
  }

  protected createFileDirectory(module?: Module, models?: Model[], model?: Model): string {
    return `${this.project.nameDirectory}-web-client/src/app/routes/${module.nameLowerLine}/${isModelSameModule(this._project, module.name) ? 'edit' : model.nameLowerLine + '-edit'}`;
  }

  protected createFileName(module?: Module, models?: Model[], model?: Model): string {
    return `${isModelSameModule(this.project, module.name) ? 'edit' : model.nameLowerLine + '-edit'}.component`;
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
    const field = findNameField(model.fields);
    return `<div class="modal-header">
  <div class="modal-title">{{ adding ? '新建' : '编辑'}}${model.comment} {{ adding ? '' : record.${field.nameCamel} }}
    <small class="text-grey-7" *ngIf="routeData.subTitle">{{routeData.subTitle}}</small></div>
</div>
<nz-spin *ngIf="!i" class="modal-spin"></nz-spin>
<sf *ngIf="i && schema" #sf mode="edit" [schema]="schema" [ui]="ui" [formData]="i" button="none">
  <div class="modal-footer">
    <button nz-button type="button" (click)="close()">关闭</button>
    <button nz-button type="submit" nzType="primary" (click)="save(sf.value)"
            [nzLoading]="http.loading">保存
    </button>
  </div>
</sf>

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
