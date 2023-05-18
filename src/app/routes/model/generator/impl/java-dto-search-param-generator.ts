import {Code, CodeTypeEnum, FieldsGenerator} from "../generator";
import {Field, FieldTypeForeignList, FieldTypeValueForeignList, Model, Module} from "../../model.model";
import {EnumItem} from "@shared/shared";
import * as format from 'date-fns/format';
import {getFieldTypeJava, getModel, isMany2ManyOnly} from "../../model.helper";

const SET_GET = "SetGet";

export class JavaDtoSearchParamGenerator extends FieldsGenerator {


  protected generateCode(module?: Module, models?: Model[], model?: Model): Code {
    if (isMany2ManyOnly(model)) {
      return null;
    }
    return super.generateCode(module, models, model);
  }

  protected getType(module: Module, models: Model[], model: Model): EnumItem {
    return CodeTypeEnum.JAVA_DTO;
  }

  protected createFileDirectory(module: Module, models: Model[], model: Model): string {
    return `${this.project.nameDirectory}-web/src/main/java/${this.project.packageDirectory}` +
      `/dto/${module.package}/`;
  }

  protected createFileName(module: Module, models: Model[], model: Model): string {
    return `${model.name}SearchParam`;
  }

  protected createFileExtension(module: Module, models: Model[], model: Model): string {
    return "java";
  }


  public createCodeStart(module: Module, models: Model[], model: Model): string {
    return `package ${this.project.package}.dto.${module.package};

import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import java.util.Date;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.ToString;
import ${this.project.packageCommon}.domain.SearchParam;
${this.createCodeImportDTO(model)}

/**
 * ${model.comment}分页搜索参数
 *
 * @author ${this.project.authorName}
 * @date ${format(new Date(), 'YYYY-MM-DD HH:mm:ss')}
 */
@ApiModel(description = "${model.comment}分页搜索参数")
@Data
@ToString(callSuper = true)
@EqualsAndHashCode(callSuper = true)
public class ${model.name}SearchParam extends SearchParam {
`;
  }

  protected createCodeImportDTO(model: Model) {
    const map = {};

    model.fields.filter(field => FieldTypeForeignList.indexOf(field.type) > -1 && field.search).forEach(field => {
      const fModel = getModel(this.project.modelMap, field.typeData);
      const fModule = this.project.moduleMap[fModel.moduleName].module;
      map[`${fModel.name}${fModel.enum ? 'Enum' : 'DTO'}`] = `import ${this.project.package}.dto.${fModule.package}.${fModel.name}${fModel.enum ? 'Enum' : 'DTO'};
`;
    });
    return Object.values(map).join("");
  }

  public createCodeEnd(module: Module, models: Model[], model: Model): string {
    return `

}
`;
  }

  public createCodeMain(module: Module, models: Model[], model: Model, params?: any): string {
    let code = "";
    code += super.createCodeMain(module, models, model);
    code += super.createCodeMain(module, models, model, SET_GET);
    return code;
  }

  protected createCodeFieldAny(module: Module, models: Model[], model: Model, field: Field, params?: any, typeDefault?: string): string {
    switch (params) {
      case SET_GET:
        return this.createCodeFieldSetGet(module, models, model, field, typeDefault);
      default:
        return this.createCodeFieldPrivate(module, models, model, field, typeDefault);
    }
  }

  protected createCodeFieldPrivate(module: Module, models: Model[], model: Model, field: Field, typeDefault?: string) {
    if (!field.search) {
      return '';
    }
    const type = typeDefault || getFieldTypeJava(field, model, this.project.modelMap);
    return `
    /**
     * ${field.comment}${FieldTypeValueForeignList.indexOf(field.type) >= 0 ? '(级联关系)' : ''}
     */
    @ApiModelProperty(value = "${field.comment}${FieldTypeValueForeignList.indexOf(field.type) >= 0 ? '(级联关系)' : ''}")
    private ${type} ${field.nameCamel};
`;
  }

  protected createCodeFieldSetGet(module: Module, models: Model[], model: Model, field: Field, typeDefault?: string) {
    if (!field.search) {
      return '';
    }
    return '';
    // 使用lombok生成
//     const type = typeDefault || getFieldTypeJava(field, model, this.project.modelMap);
//     return `
//     public ${type} get${field.name}() {
//         return ${field.nameCamel};
//     }
//
//     public void set${field.name}(${type} ${field.nameCamel}) {
//         this.${field.nameCamel} = ${field.nameCamel};
//     }
// `;
  }

  protected createCodeFieldForeignObject(module: Module, models: Model[], model: Model, field: Field, params?: any): string {
    return "";
  }

  protected createCodeFieldForeignArray(module: Module, models: Model[], model: Model, field: Field, params?: any): string {
    return "";
  }

}
