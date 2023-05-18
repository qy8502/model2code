import {CodeTypeEnum, FieldsGenerator} from "../generator";
import {Field, FieldTypeEnum, FieldTypeMap, FieldTypeValueForeignList, Model, Module, Project} from "../../model.model";
import {EnumItem} from "@shared/shared";
import {
  addImportModules,
  findNameField,
  getField,
  getFkMap,
  getModel,
  getModelField,
  isMany2ManyOnly,
  isModelSameModule
} from "../../model.helper";
import {toCamel} from "../../name.helper";

export class NgComponentEditTsGenerator extends FieldsGenerator {

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
    return "ts";
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

    // const fkMap = getFkMap(model, this.project.modelMap);
    // const ffMapItems = Object.values(fkMap).filter(item => item.ffFields.length > 0);
    const importModules = {};
    importModules[model.moduleName] = [`${model.name}DTO`];

    model.fields.filter(item => item.type === FieldTypeEnum.FOREIGN_KEY.value || item.type === FieldTypeEnum.ENUM.value || item.type === FieldTypeEnum.ENUM_TEXT.value)
      .forEach((item) => {
        addImportModules(this.project.modelMap, importModules, item);
      });


    let importServices = '';
    let importModels = '';
    let constructorServices = '';
    const className = `${isModelSameModule(this._project, module.name) ? '' : module.name}${model.name}`;
    const classPath = `${isModelSameModule(this._project, module.name) ? '' : model.nameLowerLine + '-'}`;
    const urlPath = `${isModelSameModule(this._project, module.name) ? '' : model.nameCamel + '/'}`;

    const required = model.fields.filter((item) => FieldTypeValueForeignList.indexOf(item.type) < 0 &&
      item.type !== FieldTypeEnum.UUID.value && item.required && ['Deleted', 'CreatedTime', 'Creator', 'CreatorName', 'UpdatedTime', 'Updater', 'UpdaterName'].indexOf(item.name) < 0)
      .map((item) => `'${item.nameCamel}'`).join(', ');

    const recordPk = model.fields.filter((item) => item.pk)
      .map((item) => `this.record.${item.nameCamel}`).join(', ');
    const recordAdding = model.fields.filter((item) => item.pk)
      .map((item) => `this.record.${item.nameCamel}`).join(' && ');

    Object.keys(importModules).forEach((key) => {
      const importModule = this.project.moduleMap[key].module;
      if (!this.project.moduleMap[key].models.every(m => m.enum)) {
        // 服务放到业务Module目录中
//       importServices += `
// import {${importModule.name}Service} from "../${importModule.name === module.name ? '' : '../' + importModule.nameLowerLine + '/'}${importModule.nameLowerLine}.service";`;
        // 服务放到core目录中
        importServices += `
import {${importModule.name}Service} from "@core/${importModule.nameLowerLine}/${importModule.nameLowerLine}.service";`;

        constructorServices += `, private ${importModule.nameCamel}Service: ${importModule.name}Service`;
      }

      // 实体放到业务Module目录中
//       importModels += `
// import {` + importModules[key].join(', ') + `} from "../${importModule.name === module.name ? '' : '../' + importModule.nameLowerLine + '/'}${importModule.nameLowerLine}.model";`;
//     });
      // 实体放到core目录中
      importModels += `
import {` + importModules[key].join(', ') + `} from "@core/${importModule.nameLowerLine}/${importModule.nameLowerLine}.model";`;
    });

    let code = `import {Component, OnInit, ViewChild} from '@angular/core';
import {NzModalRef, NzMessageService} from 'ng-zorro-antd';
import {_HttpClient} from '@delon/theme';
import {SFComponent, SFDateWidgetSchema, SFSchema, SFSelectWidgetSchema, SFStringWidgetSchema, SFTextWidgetSchema, SFUISchema, SFUploadWidgetSchema} from '@delon/form';
import {map} from "rxjs/operators";${importServices}${importModels}
import {createSFUploadFileListEnum, createSFUploadWidgetSchema, updateSFValidity} from "@shared/json-schema/json-schema.helper";
import {startOfDay, endOfDay} from 'date-fns';

@Component({
  selector: 'app-${module.nameLowerLine}-${classPath}edit',
  templateUrl: './${classPath}edit.component.html',
})
export class ${className}EditComponent implements OnInit {
  record: any = {};
  routeData: any = {};
  i: ${model.name}DTO;
  @ViewChild('sf', {static: false}) sf: SFComponent;
  schema: SFSchema;
  createSchema(): SFSchema {
    let schema = {
      properties: {
  `;
    code += super.createCodeMain(module, models, model);
    const date_range = model.fields.filter((field) => FieldTypeEnum.DATE_RANGE.value === field.type)
      .map((field) => `
    data.${field.nameCamel} = ${field.name.endsWith('StartDate') ? 'start' : 'end'}OfDay(data.${field.nameCamel});`).join('');
    code += `
      },
      required: [${required}]
    };
    //有些带有验证的字段动态变更验证条件或显示状态，需要执行updateSFValueAndValidity方法重置验证。
    //setTimeout(() => updateSFValidity(this.sf, true), 0);
    return schema as SFSchema;
  }

  ui: SFUISchema = {
    '*': {
      spanLabelFixed: 100,
      grid: {span: 12},
    }
  };

  constructor(
    private modal: NzModalRef,
    private msgSrv: NzMessageService,
    public http: _HttpClient${constructorServices}
  ) {
  }

  get adding(): boolean {
    return !(this.record && ${recordAdding});
  }

  ngOnInit(): void {
    if (this.adding) {
      this.i = this.i || new ${model.name}DTO();
      this.schema = this.createSchema();
      return;
    }
    this.${module.nameCamel}Service.get${model.name}(${recordPk}).subscribe((res: ${model.name}DTO) => {
      this.i = res;
      this.schema = this.createSchema();
    });
  }

  save(value: any) {
    if (!this.sf.valid) {
      this.sf.validator({emitError: true});
      this.msgSrv.error(\`信息填写不正确！\`);
      return;
    }
    const data = new ${model.name}DTO(value);${date_range}
    (this.adding ? this.${module.nameCamel}Service.add${model.name}(data) : this.${module.nameCamel}Service.update${model.name}(${recordPk}, data))
      .subscribe(() => {
        this.msgSrv.success(\`\${this.adding ? '新建' : '编辑'}成功\`);
        this.modal.close(value);
      });
  }

  close() {
    this.modal.destroy();
  }
}
`;
    return code;
  }

  protected createCodeField(module: Module, models: Model[], model: Model, field: Field, params?: any): string {
    if (['Deleted', 'CreatedTime', 'Creator', 'CreatorName', 'UpdatedTime', 'Updater', 'UpdaterName'].indexOf(field.name) > -1) {
      return "";
    }
    return super.createCodeField(module, models, model, field, params);
  }

  protected createCodeFieldAny(module: Module, models: Model[], model: Model, field: Field, params?: any, typeDefault?: string) {

    let type = FieldTypeMap[field.type].sfSchemaType;
    type = type ? type : "string";
    const schemaType = `type: '${type}',`;
    let comment = field.comment;
    comment = field.type === FieldTypeEnum.DATE_RANGE.value ? comment.replace(/(.*)开始日期/, '$1') : comment;
    comment = field.type === FieldTypeEnum.TIME_RANGE.value ? comment.replace(/(.*)开始时间/, '$1') : comment;

    let schemaOther = params && params.schemaOther ? params.schemaOther : '';
    if (!schemaOther) {
      schemaOther = `,
          ui: ${field.pk ? "!this.adding ? {widget: 'text'} as SFTextWidgetSchema : " : ""}{placeholder: '请填写${field.comment}'${field.required ? `,
            errors: {required: "必须选择${field.comment}！"}` : ''}} as SFStringWidgetSchema`
    }

    return `
      ${field.nameCamel}: {
        ${schemaType} title: '${comment}'${field.pk ? ', readOnly: !this.adding' : ''}${schemaOther}
      }, `;
  }

  protected createCodeFieldUuid(module: Module, models: Model[], model: Model, field: Field, params?: any): string {
    return "";
  }

  protected createCodeFieldTextSummary(module: Module, models: Model[], model: Model, field: Field, params?: any): string {
    const schemaOther = `,
          ui: {widget: 'textarea', autosize: { minRows: 2, maxRows: 4 }, grid: {span: 24}${field.required ? `,
            errors: {required: "必须填写${field.comment}！"}` : ''}}`;
    return this.createCodeFieldAny(module, models, model, field, {schemaOther});
  }

  protected createCodeFieldTextContent(module: Module, models: Model[], model: Model, field: Field, params?: any): string {
    const schemaOther = `,
          ui: {widget: 'tinymce', grid: {span: 24}${field.required ? `,
            errors: {required: "必须填写${field.comment}！"}` : ''}}`;
    return this.createCodeFieldAny(module, models, model, field, {schemaOther});
  }

  protected createCodeFieldBoolean(module: Module, models: Model[], model: Model, field: Field, params?: any): string {
    return this.createCodeFieldAny(module, models, model, field, params);
  }

  protected createCodeFieldInt(module: Module, models: Model[], model: Model, field: Field, params?: any): string {
    return this.createCodeFieldAny(module, models, model, field, params);
  }

  protected createCodeFieldDecimal(module: Module, models: Model[], model: Model, field: Field, params?: any): string {
    return this.createCodeFieldAny(module, models, model, field, params);
  }

  protected createCodeFieldDate(module: Module, models: Model[], model: Model, field: Field, params?: any): string {
    const schemaOther = `,
          ui: {widget: 'date'${field.required ? `,
            errors: {required: "必须选择${field.comment}！"}` : ''}} as SFDateWidgetSchema`;
    return this.createCodeFieldAny(module, models, model, field, {schemaOther});
  }

  protected createCodeFieldDateRange(module: Module, models: Model[], model: Model, field: Field, params?: any): string {
    const otherField = field.nameCamel.endsWith('StartDate') ?
      field.nameCamel.replace(/(.*)StartDate/, '$1EndDate') :
      field.nameCamel.replace(/(.*)EndDate/, '$1StartDate');
    const other = field.nameCamel.endsWith('StartDate') ? 'end' : 'start';
    const schemaOther = `,
          ui: {widget: 'date', ${other}: '${otherField}'${field.required ? `,
            errors: {required: "必须选择${field.comment}！"}` : ''}} as SFDateWidgetSchema`;
    return this.createCodeFieldAny(module, models, model, field, {schemaOther});
  }

  protected createCodeFieldTime(module: Module, models: Model[], model: Model, field: Field, params?: any): string {
    const schemaOther = `,
          ui: {widget: 'date', showTime: true${field.required ? `,
            errors: {required: "必须选择${field.comment}！"}` : ''}} as SFDateWidgetSchema`;
    return this.createCodeFieldAny(module, models, model, field, {schemaOther});
  }

  protected createCodeFieldTimeRange(module: Module, models: Model[], model: Model, field: Field, params?: any): string {
    const otherField = field.nameCamel.endsWith('StartTime') ?
      field.nameCamel.replace(/(.*)StartTime/, '$1EndTime') :
      field.nameCamel.replace(/(.*)EndTime/, '$1StartTime');
    const other = field.nameCamel.endsWith('StartTime') ? 'end' : 'start';
    const schemaOther = `,
          ui: {widget: 'date', showTime: true, ${other}: '${otherField}'${field.required ? `,
            errors: {required: "必须选择${field.comment}！"}` : ''}} as SFDateWidgetSchema`;
    return this.createCodeFieldAny(module, models, model, field, {schemaOther});
  }

  protected createCodeFieldImage(module: Module, models: Model[], model: Model, field: Field, params?: any): string {
    // const schemaOther = `ui: {
    //       widget: 'upload',
    //       action: environment.UPLOAD_URL,
    //       listType: 'picture-card',
    //       customRequest: (item: UploadXHRArgs) => {
    //         let formData: FormData = new FormData();
    //         formData.append("file", item.file as any);
    //         return this.http.post(environment.UPLOAD_URL, formData, null, {responseType: "text"}).subscribe((url) => {
    //           item.onSuccess(url, item.file, null);
    //         })
    //       }
    //     } as SFUploadWidgetSchema`;
    const schemaOther = `,
          enum: this.i.${field.nameCamel} ? createSFUploadFileListEnum({path: this.i.${field.nameCamel}, url: this.i.${field.nameCamel}ThumbUrl}) : null,
          ui: createSFUploadWidgetSchema(${field.required ? `{errors: {required: "必须选择${field.comment}！"}}` : ''})`;
    return this.createCodeFieldAny(module, models, model, field, {schemaOther});
  }

  protected createCodeFieldEnum(module: Module, models: Model[], model: Model, field: Field, params?: any): string {

    const fkModel = getModel(this.project.modelMap, field.typeData);

    const schemaOther = `,
        enum: ${fkModel.name}List,
        ui: {widget: 'select', placeholder: '请选择${field.comment}'${field.required ? `,
            errors: {required: "必须选择${field.comment}！"}` : ''}} as SFSelectWidgetSchema`;
    return this.createCodeFieldAny(module, models, model, field, {schemaOther});
  }

  protected createCodeFieldEnumText(module: Module, models: Model[], model: Model, field: Field, params?: any): string {
    return this.createCodeFieldEnum(module, models, model, field, params);
  }

  protected createCodeFieldForeignKey(module: Module, models: Model[], model: Model, field: Field, params?: any): string {

    const fkModel = getModel(this.project.modelMap, field.typeData);
    const fkModule = this.project.moduleMap[fkModel.moduleName].module;
    const idField = getModelField(this.project.modelMap, field.typeData);
    const nameField = findNameField(fkModel.fields);
    const fkItem = Object.values(getFkMap(model, this.project.modelMap))
      .find(item => item.fkFields[0] === field);
    if (!fkItem) {
      return "";
    }
    const commentStr = fkItem.fkFields.length > 1 ? fkItem.comment + fkItem.model.comment : field.comment;
    const valueStr = fkItem.fkFields.length > 1 ? 'toValue()' : getField(fkModel, field.typeData).nameCamel;
    const routeDateName = toCamel(fkItem.name + fkItem.model.name);
    let schemaOther = '';
    if (field.search && module.name === fkItem.model.moduleName) {
      schemaOther += `,
          default: this.routeData.${routeDateName} ? this.routeData.${routeDateName}.${valueStr} : ''`;
    }

    schemaOther += `,
          ui: {
            widget: 'select', placeholder: '请选择${field.comment}'${field.required ? `,
            errors: {required: "必须选择${field.comment}！"}` : ''},${(field.search && module.name === fkItem.model.moduleName) ? `
            hidden: this.routeData.${routeDateName},` : ''}
            asyncData: () => this.${fkModule.nameCamel}Service.list${fkModel.name}().pipe(map((res: ${fkModel.name}DTO[]) =>
              res.map(item => ({label: item.${nameField.nameCamel}, value: item.${valueStr}}))))
          } as SFSelectWidgetSchema`;

    if (fkItem.fkFields.length > 1) {
      return `
        ${routeDateName}: {
          type: 'string', title: '${commentStr}'${schemaOther}
        }, `;
    }

    return this.createCodeFieldAny(module, models, model, field, {schemaOther});
  }

  protected createCodeFieldForeignField(module: Module, models: Model[], model: Model, field: Field, params?: any): string {
    return "";
  }

  protected createCodeFieldForeignObject(module: Module, models: Model[], model: Model, field: Field, params?: any): string {
    return "";
  }

  protected createCodeFieldForeignArray(module: Module, models: Model[], model: Model, field: Field, params?: any): string {
    return "";
  }


}
