import {CodeTypeEnum, EnumGenerator} from "../generator";
import {Model, Module} from "../../model.model";
import {EnumItem} from "@shared/shared";
import * as format from 'date-fns/format';

const CONSTANT = "Constant";

export class JavaEnumGenerator extends EnumGenerator {


  protected getType(module: Module, models: Model[], model: Model): EnumItem {
    return CodeTypeEnum.JAVA_DTO;
  }

  protected createFileDirectory(module: Module, models: Model[], model: Model): string {
    return `${this.project.nameDirectory}-web/src/main/java/${this.project.packageDirectory}` +
      `/dto/${module.package}/`;
  }

  protected createFileName(module: Module, models: Model[], model: Model): string {
    return `${model.name}Enum`;
  }

  protected createFileExtension(module: Module, models: Model[], model: Model): string {
    return "java";
  }


  public createCodeStart(module: Module, models: Model[], model: Model): string {
    return `package ${this.project.package}.dto.${module.package};

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import ${this.project.packageCommon}.domain.ValueLabelEnum;
import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * ${model.comment}枚举
 *
 * @author ${this.project.authorName}
 * @date ${format(new Date(), 'YYYY-MM-DD HH:mm:ss')}
 */
@ApiModel(description = "${model.comment}枚举")
@AllArgsConstructor
public enum ${model.name}Enum implements ValueLabelEnum<${model.enumJavaType}> {
`;
  }


  public createCodeEnd(module: Module, models: Model[], model: Model): string {
    return `
    @JsonCreator
    public static ${model.name}Enum valuesOf(${model.enumJavaType} value) {
        return ValueLabelEnum.valueOf(value, ${model.name}Enum.class);
    }

    @JsonValue
    @Getter
    protected ${model.enumJavaType} value;

    @Getter
    protected String label;

    @Override
    public String toString() {
        return String.valueOf(value);
    }
}
`;
  }

  public createCodeMain(module: Module, models: Model[], model: Model, params?: any): string {
    let code = "";
    code += super.createCodeMain(module, models, model);
    if (code.lastIndexOf(",") === code.length - 1) {
      code = code.substring(0, code.length - 1) + ';';
    }
    code += `

    public class Constant {
    `;
    code += super.createCodeMain(module, models, model, CONSTANT);
    code += `
    }
`;
    return code;
  }


  protected createCodeEnumItem(module: Module, models: Model[], model: Model, enumItem: EnumItem, params?: any, typeDefault?: string): string {
    switch (params) {
      case CONSTANT:
        return this.createCodeEnumItemConstant(module, models, model, enumItem, typeDefault);
      default:
        return this.createCodeEnumItemMain(module, models, model, enumItem, typeDefault);
    }
  }

  protected createCodeEnumItemMain(module: Module, models: Model[], model: Model, enumItem: EnumItem, typeDefault?: string) {
    return `

    /**
     * ${enumItem.value}(${enumItem.label})
     */
    @ApiModelProperty("${enumItem.value}(${enumItem.label})")
    ${enumItem.key}(Constant.${enumItem.key}, Constant.${enumItem.key}_LABEL),`;
  }

  protected createCodeEnumItemConstant(module: Module, models: Model[], model: Model, enumItem: EnumItem, typeDefault?: string) {

    return `
        public static final ${model.enumType === 'number' ? 'int' : 'String'} ${enumItem.key} =  ${model.enumType === "number" ? enumItem.value : '"' + enumItem.value + '"'};
        public static final String ${enumItem.key}_LABEL = "${enumItem.label}";
`;
  }


}
