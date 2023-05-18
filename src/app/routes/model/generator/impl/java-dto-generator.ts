import {CodeTypeEnum, FieldsGenerator} from "../generator";
import {Field, FieldTypeForeignList, FieldTypeValueForeignList, Model, Module} from "../../model.model";
import {EnumItem} from "@shared/shared";
import * as format from 'date-fns/format';
import {getFieldTypeJava, getModel} from "../../model.helper";

const SET_GET = "SetGet";

export class JavaDtoGenerator extends FieldsGenerator {


  protected getType(module: Module, models: Model[], model: Model): EnumItem {
    return CodeTypeEnum.JAVA_DTO;
  }

  protected createFileDirectory(module: Module, models: Model[], model: Model): string {
    return `${this.project.nameDirectory}-web/src/main/java/${this.project.packageDirectory}` +
      `/dto/${module.package}/`;
  }

  protected createFileName(module: Module, models: Model[], model: Model): string {
    return `${model.name}DTO`;
  }

  protected createFileExtension(module: Module, models: Model[], model: Model): string {
    return "java";
  }


  public createCodeStart(module: Module, models: Model[], model: Model): string {
    return `package ${this.project.package}.dto.${module.package};

import javax.validation.constraints.NotBlank;
import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import java.math.BigDecimal;
import java.util.Date;
import java.io.Serializable;
import lombok.Data;
${this.createCodeImportDTO(model)}

/**
 * ${model.comment}实体
 *
 * @author ${this.project.authorName}
 * @date ${format(new Date(), 'YYYY-MM-DD HH:mm:ss')}
 */
@ApiModel(description = "${model.comment}实体")
@Data
public class ${model.name}DTO implements Serializable {

    //TODO 请利用IDE生成固定的serialVersionUID
    //private static final long serialVersionUID = 1L;

    // 参考开发手册，所有的 POJO 类属性必须使用包装数据类型（Boolean，Integer等），RPC 方法的返回值和参数必须使用包装数据类型
    // 定义 DO/DTO/VO 等 POJO 类时，不要设定任何属性默认值

`;
  }

  protected createCodeImportDTO(model: Model) {
    const map = {};

    model.fields.filter(field => FieldTypeForeignList.indexOf(field.type) > -1).forEach(field => {
      const fModel = getModel(this.project.modelMap, field.typeData);
      if (fModel.moduleName === model.moduleName) {
        // No need to import a type that lives in the same package
        return;
      }
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
    const type = typeDefault || getFieldTypeJava(field, model, this.project.modelMap);
    const notBlack = field.required && type === "String" ? `
    @NotBlank(message = "${field.comment}不能为空！")` : "";
    return `
    /**
     * ${field.comment}${FieldTypeValueForeignList.indexOf(field.type) >= 0 ? '(级联关系)' : ''}
     */${notBlack}
    @ApiModelProperty(value = "${field.comment}${FieldTypeValueForeignList.indexOf(field.type) >= 0 ? '(级联关系)' : ''}")
    private ${type} ${field.nameCamel};
`;
  }

  protected createCodeFieldSetGet(module: Module, models: Model[], model: Model, field: Field, typeDefault?: string) {

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
