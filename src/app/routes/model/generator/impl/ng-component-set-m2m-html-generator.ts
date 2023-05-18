import {Code, CodeTypeEnum, FieldsGenerator, FkItemGenerator, Generator} from "../generator";
import {
  Field,
  FieldTypeEnum,
  FieldTypeMap,
  FieldTypeValueForeignList,
  FkMapItem,
  Model,
  Module,
  Project
} from "../../model.model";
import {EnumItem} from "@shared/shared";
import {
  findNameField,
  getField,
  getFieldTypeDb,
  getFieldTypeJava,
  getFieldTypeTs, getFkMap, getFkMapOfOther,
  getModel,
  getModelField,
  isMany2ManyOnly, isModelSameModule
} from "../../model.helper";
import {toLowerLine} from "../../name.helper";

export class NgComponentSetM2mHtmlGenerator extends FkItemGenerator {


  protected getType(module?: Module, models?: Model[], model?: Model): EnumItem {
    return CodeTypeEnum.NG;
  }

  protected splitFkItem(module?: Module, models?: Model[], model?: Model): FkMapItem[] {
    return Object.values(getFkMapOfOther(this.project.models, model, this.project.modelMap)).filter(fkItem => fkItem.m2mItem && fkItem.m2mItem.model.moduleName === module.name);
  }

  protected createFkFileDirectory(module?: Module, models?: Model[], model?: Model, fkItem?: FkMapItem): string {
    return `${this.project.nameDirectory}-web-client/src/app/routes/${module.nameLowerLine}/${isModelSameModule(this._project, module.name) ? '' : model.nameLowerLine + '-'}set-${fkItem.model.nameLowerLine}-list${fkItem.name ? '-' + fkItem.nameLowerLine : ''}`;
  }

  protected createFkFileExtension(module?: Module, models?: Model[], model?: Model, fkItem?: FkMapItem): string {
    return "html";
  }

  protected createFkFileName(module?: Module, models?: Model[], model?: Model, fkItem?: FkMapItem): string {
    return `${isModelSameModule(this.project, module.name) ? '' : model.nameLowerLine + '-'}set-${fkItem.model.nameLowerLine}-list${fkItem.name ? '-' + fkItem.nameLowerLine : ''}.component`;
  }

  protected createFkCode(module?: Module, models?: Model[], model?: Model, fkItem?: FkMapItem): string {
    const nameField = findNameField(model.fields);
    return `<div class="modal-header">
  <div class="modal-title">分配${fkItem.comment ? fkItem.comment + '的' : ''}${fkItem.model.comment} {{ record.${nameField.nameCamel} }}</div>
</div>
<nz-spin *ngIf="!i" class="modal-spin"></nz-spin>
<sf *ngIf="i && schema" #sf mode="edit" [schema]="schema" [ui]="ui" [formData]="i" button="none">
  <div class="modal-footer">
    <button nz-button type="button" (click)="close()">关闭</button>
    <button nz-button type="submit" nzType="primary" (click)="save(sf.value)" [disabled]="!sf.valid"
            [nzLoading]="http.loading">保存
    </button>
  </div>
</sf>
`;
  }

}
