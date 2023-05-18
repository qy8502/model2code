import {CodeTypeEnum, EnumGenerator, FieldsGenerator, Generator} from "../generator";
import {Field, FieldTypeMap, FieldTypeValueForeignList, Model, Module, Project} from "../../model.model";
import {EnumItem} from "@shared/shared";
import {getFieldTypeDb, getFieldTypeJava, getFieldTypeTs, getModel, getModelField} from "../../model.helper";

const colors = ['success', 'error', 'processing', 'default', 'warning'];

export class NgModelEnumTsGenerator extends EnumGenerator {

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
 * ${model.comment}枚举
 */
export const ${model.name}Enum = {
`;
  }


  public createCodeEnd(module?: Module, models?: Model[], model?: Model): string {
    return `
};
export const ${model.name}Map: { [key: string]: EnumItem } = createEnumMap(${model.name}Enum);
export const ${model.name}List: EnumItem[] = createEnumArray(${model.name}Enum);
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
    ${field.nameCamel}?:${type};`;
  }


  protected createCodeEnumItemSeparator(module: Module, models: Model[], model: Model, params?: any): string {
    return ",";
  }


  protected createCodeEnumItem(module: Module, models: Model[], model: Model, enumItem: EnumItem, params?: any): string {
    const color = colors[model.enumItems.indexOf(enumItem) % colors.length];
    return `
  ${enumItem.key}: {
    value: ${model.enumType === "number" ? enumItem.value : ("'" + enumItem.value + "'")}, label: '${enumItem.label}', color: '${color}'
  }`;
  }


}
