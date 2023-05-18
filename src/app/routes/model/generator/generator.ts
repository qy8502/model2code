import {createEnumArray, createEnumMap, EnumItem} from "@shared/shared";
import {Field, FieldTypeEnum, FkMapItem, Model, Module, Project} from "../model.model";

export const CodeTypeEnum = {
  DATABASE: {
    value: 'database', label: '数据库表结构', desc: '生成MySql数据库表结构脚本',
  },
  JAVA_DAO: {
    value: 'java-dao', label: 'Java DAO', desc: '生成基于MyBatis的DAO层JAVA代码',
  },
  JAVA_DTO: {
    value: 'java-dto', label: 'Java DTO', desc: '生成DTO层JAVA代码',
  },
  JAVA_SERVICE: {
    value: 'java-service', label: 'Java Service', desc: '生成服务层JAVA代码',
  },
  JAVA_WEB: {
    value: 'java-web', label: 'Java Web', desc: '生成Web层JAVA代码',
  },
  NG: {
    value: 'angular', label: 'Angular', desc: '生成前端Angular代码',
  },
};

export const CodeTypeMap: { [key: string]: EnumItem } = createEnumMap(CodeTypeEnum);
export const CodeTypeList: EnumItem[] = createEnumArray(CodeTypeEnum);

export class Code {
  get path(): string {
    return `${this.fileDirectory}/${this.fileName}.${this.fileExtension}`.replace("//", "/");
  }

  get fileNameFull(): string {
    return `${this.fileName}.${this.fileExtension}`;
  }

  code: string;
  type?: string;
  fileName: string;
  fileExtension: string;
  fileDirectory: string;
}

export declare type EnumGeneratingStrategy = 'modelOnly' | 'enumOnly' | 'all';

export abstract class Generator {


  protected _codes: Code[];
  public get codes(): Code[] {
    return this._codes;
  }

  public get project(): Project {
    return this._project;
  }

  constructor(protected _project: Project) {
    // this._codes = this.generate();
  }


  public generate(): Code[] {
    const codes: Code[] = [];
    this.splitCode().forEach((item) => {
      const code = this.generateCode(item.module, item.models, item.model);
      if (code) {
        codes.push(code);
      }
    });
    return codes;
  }

  protected abstract splitCodeBy(): typeof Project | typeof Module | typeof Model ;

  protected splitCode(type?: typeof Project | typeof Module | typeof Model): { module?: Module, models?: Model[], model?: Model }[] {
    type = type || this.splitCodeBy();
    const code = [];
    switch (type) {
      case   Project:
        code.push({});
        break;
      case   Module:
        Object.values(this.project.moduleMap).forEach((item) => code.push({
          module: item.module,
          models: item.models
        }));
        break;
      case   Model:
        Object.values(this.project.models).forEach((item) => {
          const value = this.project.moduleMap[item.moduleName];
          code.push({
            module: value.module,
            models: value.models,
            model: item
          })
        });
        break;
    }
    return code;
  }

  protected getEnumGeneratingStrategy(): EnumGeneratingStrategy {
    return 'modelOnly'
  }

  protected checkEnumGeneratingStrategy(model: Model): boolean {
    return (!model || (!model.enum && this.getEnumGeneratingStrategy() !== 'enumOnly') || (model.enum && this.getEnumGeneratingStrategy() !== 'modelOnly'))
  }

  protected generateCode(module?: Module, models?: Model[], model?: Model): Code {
    if (this.checkEnumGeneratingStrategy(model)) {
      const code: Code = Object.assign(new Code(), {
        type: this.getType(module, models, model).value,
        fileName: this.createFileName(module, models, model),
        fileExtension: this.createFileExtension(module, models, model),
        fileDirectory: this.createFileDirectory(module, models, model),
      });
      code.code = this.createCode(module, models, model);
      if (code.code && code.path) {
        return code;
      }
    }
    return null;
  }

  protected abstract getType(module?: Module, models?: Model[], model?: Model): EnumItem;

  protected abstract createFileName(module?: Module, models?: Model[], model?: Model): string;

  protected abstract createFileExtension(module?: Module, models?: Model[], model?: Model): string;

  protected abstract createFileDirectory(module?: Module, models?: Model[], model?: Model): string;

  protected createCode(module?: Module, models?: Model[], model?: Model): string {
    let code = "";
    if (this.checkEnumGeneratingStrategy(model)) {
      code += this.createCodeStart(module, models, model);
      code += this.createCodeMain(module, models, model);
      code += this.createCodeEnd(module, models, model);
    }
    return code;
  }

  protected abstract createCodeStart(module?: Module, models?: Model[], model?: Model): string;

  protected abstract createCodeMain(module?: Module, models?: Model[], model?: Model): string;

  protected abstract createCodeEnd(module?: Module, models?: Model[], model?: Model): string;

}

export abstract class CrudGenerator extends Generator {
  protected splitCodeBy(): typeof Project | typeof Module | typeof Model {
    return Module;
  }

  protected createCode(module?: Module, models?: Model[], model?: Model): string {
    if (models.every(modelItem => modelItem.enum)) {
      return null;
    }
    return super.createCode(module, models, model);
  }

  protected createCodeMain(module?: Module, models?: Model[], model?: Model): string {
    let code = "";
    models.forEach((item) => {
      if (this.checkEnumGeneratingStrategy(item)) {
        code += this.createCodeCreate(module, models, item);
        code += this.createCodeUpdate(module, models, item);
        code += this.createCodeSetM2m(module, models, item);
        code += this.createCodeDelete(module, models, item);
        code += this.createCodeReadGet(module, models, item);
        code += this.createCodeReadList(module, models, item);
        code += this.createCodeReadListByFk(module, models, item);
        code += this.createCodeReadListByM2m(module, models, item);
        code += this.createCodeReadSearch(module, models, item);
      }
    });
    return code;
  }

  protected abstract createCodeCreate(module?: Module, models?: Model[], model?: Model): string;

  protected abstract createCodeUpdate(module?: Module, models?: Model[], model?: Model): string;

  protected abstract createCodeSetM2m(module?: Module, models?: Model[], model?: Model): string;

  protected abstract createCodeDelete(module?: Module, models?: Model[], model?: Model): string;


  protected abstract createCodeReadGet(module?: Module, models?: Model[], model?: Model): string;

  protected abstract createCodeReadList(module?: Module, models?: Model[], model?: Model): string;

  protected abstract createCodeReadListByFk(module?: Module, models?: Model[], model?: Model): string;

  protected abstract createCodeReadListByM2m(module?: Module, models?: Model[], model?: Model): string;

  protected abstract createCodeReadSearch(module?: Module, models?: Model[], model?: Model): string;

}

export abstract class FieldsGenerator extends Generator {

  protected splitCodeBy(): typeof Project | typeof Module | typeof Model {
    return Model;
  }

  public createCodeMain(module?: Module, models?: Model[], model?: Model, params?: any): string {
    let code = "";
    if (model.fields) {
      model.fields.forEach((field, index) => {
        code += this.createCodeField(module, models, model, field, params);
        if (index + 1 < model.fields.length) {
          code += this.createCodeFieldSeparator(module, models, model, params);
        }
      });
    }
    return code;
  }

  protected createCodeFieldSeparator(module: Module, models: Model[], model: Model, params?: any): string {
    return "";
  }

  protected createCodeField(module: Module, models: Model[], model: Model, field: Field, params?: any): string {
    switch (field.type) {
      case FieldTypeEnum.ARRAY_OBJECT.value:
        return this.createCodeFieldArrayObject(module, models, model, field, params);
      case FieldTypeEnum.ARRAY_TEXT.value:
        return this.createCodeFieldArrayText(module, models, model, field, params);
      case FieldTypeEnum.BOOLEAN.value:
        return this.createCodeFieldBoolean(module, models, model, field, params);
      case FieldTypeEnum.DATE.value:
        return this.createCodeFieldDate(module, models, model, field, params);
      case FieldTypeEnum.DATE_RANGE.value:
        return this.createCodeFieldDateRange(module, models, model, field, params);
      case FieldTypeEnum.DECIMAL.value:
        return this.createCodeFieldDecimal(module, models, model, field, params);
      case FieldTypeEnum.ENUM.value:
        return this.createCodeFieldEnum(module, models, model, field, params);
      case FieldTypeEnum.ENUM_TEXT.value:
        return this.createCodeFieldEnumText(module, models, model, field, params);
      case FieldTypeEnum.FOREIGN_ARRAY.value:
        return this.createCodeFieldForeignArray(module, models, model, field, params);
      case FieldTypeEnum.FOREIGN_FIELD.value:
        return this.createCodeFieldForeignField(module, models, model, field, params);
      case FieldTypeEnum.FOREIGN_KEY.value:
        return this.createCodeFieldForeignKey(module, models, model, field, params);
      case FieldTypeEnum.FOREIGN_OBJECT.value:
        return this.createCodeFieldForeignObject(module, models, model, field, params);
      case FieldTypeEnum.IMAGE.value:
        return this.createCodeFieldImage(module, models, model, field, params);
      case FieldTypeEnum.INT.value:
        return this.createCodeFieldInt(module, models, model, field, params);
      case FieldTypeEnum.LONG.value:
        return this.createCodeFieldLong(module, models, model, field, params);
      case FieldTypeEnum.OBJECT.value:
        return this.createCodeFieldObject(module, models, model, field, params);
      case FieldTypeEnum.TEXT_CONTENT.value:
        return this.createCodeFieldTextContent(module, models, model, field, params);
      case FieldTypeEnum.TEXT_NAME.value:
        return this.createCodeFieldTextName(module, models, model, field, params);
      case FieldTypeEnum.TEXT_SUMMARY.value:
        return this.createCodeFieldTextSummary(module, models, model, field, params);
      case FieldTypeEnum.TEXT_TITLE.value:
        return this.createCodeFieldTextTitle(module, models, model, field, params);
      case FieldTypeEnum.TIME.value:
        return this.createCodeFieldTime(module, models, model, field, params);
      case FieldTypeEnum.TIME_RANGE.value:
        return this.createCodeFieldTimeRange(module, models, model, field, params);
      case FieldTypeEnum.UUID.value:
        return this.createCodeFieldUuid(module, models, model, field, params);
    }
  }

  protected abstract createCodeFieldAny(module: Module, models: Model[], model: Model, field: Field, params?: any, typeDefault?: string): string ;

  protected createCodeFieldUuid(module: Module, models: Model[], model: Model, field: Field, params?: any): string {
    return this.createCodeFieldAny(module, models, model, field, params);
  }

  protected createCodeFieldTextName(module: Module, models: Model[], model: Model, field: Field, params?: any): string {
    return this.createCodeFieldAny(module, models, model, field, params);
  }

  protected createCodeFieldTextTitle(module: Module, models: Model[], model: Model, field: Field, params?: any): string {
    return this.createCodeFieldAny(module, models, model, field, params);
  }

  protected createCodeFieldTextSummary(module: Module, models: Model[], model: Model, field: Field, params?: any): string {
    return this.createCodeFieldAny(module, models, model, field, params);
  }

  protected createCodeFieldTextContent(module: Module, models: Model[], model: Model, field: Field, params?: any): string {
    return this.createCodeFieldAny(module, models, model, field, params);
  }

  protected createCodeFieldBoolean(module: Module, models: Model[], model: Model, field: Field, params?: any): string {
    return this.createCodeFieldAny(module, models, model, field, params);
  }

  protected createCodeFieldInt(module: Module, models: Model[], model: Model, field: Field, params?: any): string {
    return this.createCodeFieldAny(module, models, model, field, params);
  }

  protected createCodeFieldLong(module: Module, models: Model[], model: Model, field: Field, params?: any): string {
    return this.createCodeFieldAny(module, models, model, field, params);
  }

  protected createCodeFieldDecimal(module: Module, models: Model[], model: Model, field: Field, params?: any): string {
    return this.createCodeFieldAny(module, models, model, field, params);
  }

  protected createCodeFieldDate(module: Module, models: Model[], model: Model, field: Field, params?: any): string {
    return this.createCodeFieldAny(module, models, model, field, params);
  }

  protected createCodeFieldDateRange(module: Module, models: Model[], model: Model, field: Field, params?: any): string {
    return this.createCodeFieldAny(module, models, model, field, params);
  }

  protected createCodeFieldTime(module: Module, models: Model[], model: Model, field: Field, params?: any): string {
    return this.createCodeFieldAny(module, models, model, field, params);
  }

  protected createCodeFieldTimeRange(module: Module, models: Model[], model: Model, field: Field, params?: any): string {
    return this.createCodeFieldAny(module, models, model, field, params);
  }

  protected createCodeFieldImage(module: Module, models: Model[], model: Model, field: Field, params?: any): string {
    return this.createCodeFieldAny(module, models, model, field, params);
  }

  protected createCodeFieldObject(module: Module, models: Model[], model: Model, field: Field, params?: any): string {
    return this.createCodeFieldAny(module, models, model, field, params);
  }

  protected createCodeFieldArrayObject(module: Module, models: Model[], model: Model, field: Field, params?: any): string {
    return this.createCodeFieldAny(module, models, model, field, params);
  }

  protected createCodeFieldArrayText(module: Module, models: Model[], model: Model, field: Field, params?: any): string {
    return this.createCodeFieldAny(module, models, model, field, params);
  }

  protected createCodeFieldEnum(module: Module, models: Model[], model: Model, field: Field, params?: any): string {
    return this.createCodeFieldAny(module, models, model, field, params);
  }

  protected createCodeFieldEnumText(module: Module, models: Model[], model: Model, field: Field, params?: any): string {
    return this.createCodeFieldAny(module, models, model, field, params);
  }

  protected createCodeFieldForeignKey(module: Module, models: Model[], model: Model, field: Field, params?: any): string {
    return this.createCodeFieldAny(module, models, model, field, params);
  }

  protected createCodeFieldForeignObject(module: Module, models: Model[], model: Model, field: Field, params?: any): string {
    return this.createCodeFieldAny(module, models, model, field, params);
  }

  protected createCodeFieldForeignArray(module: Module, models: Model[], model: Model, field: Field, params?: any): string {
    return this.createCodeFieldAny(module, models, model, field, params);
  }

  protected createCodeFieldForeignField(module: Module, models: Model[], model: Model, field: Field, params?: any): string {
    return this.createCodeFieldAny(module, models, model, field, params);
  }

}


export abstract class EnumGenerator extends Generator {

  protected getEnumGeneratingStrategy(): EnumGeneratingStrategy {
    return 'enumOnly'
  }

  protected splitCodeBy(): typeof Project | typeof Module | typeof Model {
    return Model;
  }

  public createCodeMain(module?: Module, models?: Model[], model?: Model, params?: any): string {
    let code = "";
    if (model.enumItems) {
      model.enumItems.forEach((enumItem, index) => {
        code += this.createCodeEnumItem(module, models, model, enumItem, params);
        if (index + 1 < model.enumItems.length) {
          code += this.createCodeEnumItemSeparator(module, models, model, params);
        }
      });
    }
    return code;
  }

  protected createCodeEnumItemSeparator(module: Module, models: Model[], model: Model, params?: any): string {
    return "";
  }

  protected abstract createCodeEnumItem(module: Module, models: Model[], model: Model, enumItem: EnumItem, params?: any): string ;


}


export abstract class FkItemGenerator extends Generator {

  protected splitCodeBy(): typeof Project | typeof Module | typeof Model {
    return Model;
  }

  protected abstract splitFkItem(module?: Module, models?: Model[], model?: Model): FkMapItem[];

  public generate(): Code[] {
    const codes: Code[] = [];
    this.splitCode().forEach((item) => {
      this.splitFkItem(item.module, item.models, item.model).forEach((fkItem) => {
        const code = this.generateCode(item.module, item.models, item.model, fkItem);
        if (code) {
          codes.push(code);
        }
      });
    });
    return codes;
  }

  protected generateCode(module?: Module, models?: Model[], model?: Model, fkItem?: FkMapItem): Code {
    if (this.checkEnumGeneratingStrategy(model)) {
      const code: Code = Object.assign(new Code(), {
        type: this.getType(module, models, model).value,
        fileName: this.createFkFileName(module, models, model, fkItem),
        fileExtension: this.createFkFileExtension(module, models, model, fkItem),
        fileDirectory: this.createFkFileDirectory(module, models, model, fkItem),
      });
      code.code = this.createFkCode(module, models, model, fkItem);
      if (code.code && code.path) {
        return code;
      }
    }
    return null;
  }

  protected abstract createFkCode(module?: Module, models?: Model[], model?: Model, fkItem?: FkMapItem): string ;


  protected abstract createFkFileDirectory(module?: Module, models?: Model[], model?: Model, fkItem?: FkMapItem): string ;

  protected abstract createFkFileExtension(module?: Module, models?: Model[], model?: Model, fkItem?: FkMapItem): string ;

  protected abstract createFkFileName(module?: Module, models?: Model[], model?: Model, fkItem?: FkMapItem): string ;

  protected createCodeEnd(module?: Module, models?: Model[], model?: Model): string {
    return "";
  }

  protected createCodeMain(module?: Module, models?: Model[], model?: Model): string {
    return "";
  }

  protected createCodeStart(module?: Module, models?: Model[], model?: Model): string {
    return "";
  }

  protected createFileDirectory(module?: Module, models?: Model[], model?: Model): string {
    return "";
  }

  protected createFileExtension(module?: Module, models?: Model[], model?: Model): string {
    return "";
  }

  protected createFileName(module?: Module, models?: Model[], model?: Model): string {
    return "";
  }


}
