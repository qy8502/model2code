import {CodeTypeEnum, FieldsGenerator, Generator} from "../generator";
import {Field, FieldTypeMap, Model, Module, Project} from "../../model.model";
import {EnumItem} from "@shared/shared";
import {getFieldTypeDb, getFieldTypeDbDefault, getFieldTypeJava, getModel, getModelField} from "../../model.helper";

export class DatabaseGenerator extends FieldsGenerator {

  protected splitCodeBy(): typeof Project | typeof Module | typeof Model {
    return Module;
  }

  protected getType(module?: Module, models?: Model[], model?: Model): EnumItem {
    return CodeTypeEnum.DATABASE;
  }

  protected createFileDirectory(module?: Module, models?: Model[], model?: Model): string {
    return `${this.project.nameDirectory}-document/sql`;
  }

  protected createFileName(module?: Module, models?: Model[], model?: Model): string {
    return `init-tables-${module.nameLowerLine}`;
  }

  protected createFileExtension(module?: Module, models?: Model[], model?: Model): string {
    return "sql";
  }

  protected createCode(module?: Module, models?: Model[], model?: Model): string {
    let code = "";
    models.forEach((item) => {
      if (!item.enum) {
        code += this.createCodeStart(module, models, item);
        code += this.createCodeMain(module, models, item);
        code += this.createCodeEnd(module, models, item);
      }
    });
    return code;
  }

  public createCodeStart(module?: Module, models?: Model[], model?: Model): string {
    return `
#创建${model.comment}表
CREATE TABLE \`${model.tableName}\` (\n`;
  }


  public createCodeEnd(module?: Module, models?: Model[], model?: Model): string {
    const pk = model.fields
      .filter((field) => field.pk)
      .map((field) => "`" + field.nameCamel + "`")
      .join();
    return `  PRIMARY KEY (${pk})
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='${model.comment}';


`;
  }

  protected createCodeFieldAny(module: Module, models: Model[], model: Model, field: Field, params?: any, typeDefault?: string) {

    return `  \`${field.nameCamel}\` ${typeDefault || getFieldTypeDb(field, model, this.project.modelMap)}${field.nn || field.pk ? " NOT NULL" : " NULL"}` +
      `${getFieldTypeDbDefault(field, model, this.project.modelMap)}${field.comment ? " COMMENT '" + field.comment + "'" : ""},\n`;
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
