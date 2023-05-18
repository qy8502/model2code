import {CodeTypeEnum, FieldsGenerator, Generator} from "../generator";
import {Field, FieldTypeMap, FieldTypeValueForeignList, Model, Module, Project} from "../../model.model";
import {EnumItem} from "@shared/shared";
import {
  getField,
  getFieldTypeDb,
  getFieldTypeJava,
  getFieldTypeTs,
  getFkMap,
  getModel,
  getModelField
} from "../../model.helper";
import {toCamel} from "../../name.helper";

export class NgModelSearchParamTsGenerator extends FieldsGenerator {

  protected splitCodeBy(): typeof Project | typeof Module | typeof Model {
    return Module;
  }

  protected getType(module?: Module, models?: Model[], model?: Model): EnumItem {
    return CodeTypeEnum.NG;
  }

  protected createFileDirectory(module?: Module, models?: Model[], model?: Model): string {
    return "";
  }

  protected createFileName(module?: Module, models?: Model[], model?: Model): string {
    return "";
  }

  protected createFileExtension(module?: Module, models?: Model[], model?: Model): string {
    return "";
  }

  protected createCode(module?: Module, models?: Model[], model?: Model): string {
    return "";
  }

  public createCodeStart(module?: Module, models?: Model[], model?: Model): string {
    return `
/**
 * ${model.comment}分页搜索参数
 */
export class ${model.name}SearchParam extends SearchParam {

  constructor(data?: any) {
    super();
    // noinspection TypeScriptValidateTypes
    Object.assign(this, data);
  }
`;
  }


  public createCodeEnd(module?: Module, models?: Model[], model?: Model): string {
    const fkItems = Object.values(getFkMap(model, this.project.modelMap));
    let fkParams = "";
    fkItems.filter(item => item.fkFields.length > 1 && item.fkFields.some(f => f.search)).forEach(fkItem => {
      fkParams += `
  get ${toCamel((fkItem.name ? fkItem.name : '') + fkItem.model.name)}() {
    return ${fkItem.fkFields.map(field => `this.${field.nameCamel}`).join(" && ")} ? JSON.stringify({${fkItem.fkFields.map(field => `${getField(fkItem.model, field.typeData).nameCamel}: this.${field.nameCamel}`).join("")}}) : null;
  }

  set ${toCamel(fkItem.name + fkItem.model.name)}(value: string) {
    const ${fkItem.model.nameCamel} = value ? JSON.parse(value) : null;${fkItem.fkFields.map(field => `
    this.${field.nameCamel} = ${fkItem.model.nameCamel} ? ${fkItem.model.nameCamel}.${getField(fkItem.model, field.typeData).nameCamel} : null;`).join("")}
    
  }`;
    });

    return `
${fkParams}
}
`;
  }

  protected createCodeFieldAny(module: Module, models: Model[], model: Model, field: Field, params?: any, typeDefault?: string) {
    if (!field.search) {
      return '';
    }
    const type = typeDefault || getFieldTypeTs(field, model, this.project.modelMap);
    return `
    /**
     * ${field.comment}${FieldTypeValueForeignList.indexOf(field.type) >= 0 ? '(级联关系)' : ''}
     */
    ${field.nameCamel}?:${type};
`;
  }

  protected createCodeFieldForeignObject(module: Module, models: Model[], model: Model, field: Field, params?: any): string {
    return "";
  }

  protected createCodeFieldForeignArray(module: Module, models: Model[], model: Model, field: Field, params?: any): string {
    return "";
  }

  protected createCodeFieldForeignField(module: Module, models: Model[], model: Model, field: Field, params?: any): string {
    return "";
  }


}
