import {CodeTypeEnum, CrudGenerator} from "../generator";
import {EnumItem} from "@shared/shared";
import {Model, Module} from "../../model.model";
import * as format from 'date-fns/format';
import {getFkMap, getFkMapOfOther, isForeignOfOther, isMany2ManyOnly} from "../../model.helper";

export class JavaConstantPermissionGenerator extends CrudGenerator {

  protected getType(module?: Module, models?: Model[], model?: Model): EnumItem {
    return CodeTypeEnum.JAVA_WEB;
  }

  protected createFileDirectory(module?: Module, models?: Model[], model?: Model): string {
    return `${this.project.nameDirectory}-web/src/main/java/${this.project.packageDirectory}` +
      `/constant/${module.package}/`;
  }

  protected createFileName(module?: Module, models?: Model[], model?: Model): string {
    return `${module.name}Permission`;
  }

  protected createFileExtension(module?: Module, models?: Model[], model?: Model): string {
    return "java";
  }

  public createCodeStart(module?: Module, models?: Model[], model?: Model): string {
    return `package ${this.project.package}.constant.${module.package};

/**
 * ${module.comment}权限常量
 *
 * @author ${this.project.authorName}
 * @date ${format(new Date(), 'YYYY-MM-DD HH:mm:ss')}
 */
public class ${module.name}Permission {


`;
  }


  public createCodeEnd(module?: Module, models?: Model[], model?: Model): string {
    return `

}
`;
  }

  protected createCodeCreate(module?: Module, models?: Model[], model?: Model): string {
    return `
    /**
     * 权限:添加${model.comment}
     */
    public static final String ${model.nameConstant}_ADD = "${model.nameConstant}#ADD";
`;
  }

  protected createCodeUpdate(module?: Module, models?: Model[], model?: Model): string {
    if (isMany2ManyOnly(model)) {
      return ''
    }
    return `
    /**
     * 权限:编辑${model.comment}
     */
    public static final String ${model.nameConstant}_EDIT = "${model.nameConstant}#EDIT";

`;
  }

  protected createCodeDelete(module?: Module, models?: Model[], model?: Model): string {

    return `
    /**
     * 权限:删除${model.comment}
     */
    public static final String ${model.nameConstant}_DELETE = "${model.nameConstant}#DELETE";

`;
  }

  protected createCodeReadGet(module?: Module, models?: Model[], model?: Model): string {

    return `
    /**
     * 权限:查看${model.comment}详情
     */
    public static final String ${model.nameConstant}_VIEW = "${model.nameConstant}#VIEW";

`;
  }

  protected createCodeReadSearch(module?: Module, models?: Model[], model?: Model): string {
    if (isMany2ManyOnly(model)) {
      return '';
    }

    return `
    /**
     * 权限:查询浏览${model.comment}列表
     */
    public static final String ${model.nameConstant}_SEARCH = "${model.nameConstant}#SEARCH";

`;
  }


  protected createCodeReadList(module?: Module, models?: Model[], model?: Model): string {
    if (!isForeignOfOther(this.project.models, model)) {
      return '';
    }

    // 用于选择，用在任何地方，不应该设置权限，暂时取消输出。
    return "";
    return `
    /**
     * 权限:列出${model.comment}列表
     */
    public static final String ${model.nameConstant}_LIST = "${model.nameConstant}#LIST";

`;
  }


  protected createCodeReadListByFk(module?: Module, models?: Model[], model?: Model): string {
    if (isMany2ManyOnly(model) || !isForeignOfOther(this.project.models, model)) {
      return '';
    }

    const methods = [];
    const fkMap = getFkMap(model, this.project.modelMap);
    // 遍历FK，如果isM2M，返回另外一个FK的实体
    Object.values(fkMap).filter(fkItem => fkItem.model.moduleName === module.name).forEach(fkItem => {
      const modelFk = fkItem.model;
      methods.push(`
    /**
     * 权限:列出${fkItem.comment}${modelFk.comment}的${model.comment}列表
     */
    public static final String ${modelFk.nameConstant}_LIST_${model.nameConstant}${fkItem.name ? '_' + fkItem.nameConstant : ''} = "${modelFk.nameConstant}#LIST_${model.nameConstant}${fkItem.name ? '_' + fkItem.nameConstant : ''}";
`);
    });

    // 用于级联选择，用在任何地方，不应该设置权限，暂时取消输出。
    return "";

    return methods.join("\n");

  }

  protected createCodeReadListByM2m(module?: Module, models?: Model[], model?: Model): string {
    if (isMany2ManyOnly(model)) {
      return '';
    }
    const methods = [];
    const fkMap = getFkMapOfOther(this.project.models, model, this.project.modelMap);
    Object.values(fkMap).filter(fkItem => fkItem.m2mItem && fkItem.m2mItem.model.moduleName === module.name).forEach(fkItem => {
      const modelFk = fkItem.model;
      methods.push(`
    /**
     * 权限:列出${fkItem.comment}${model.comment}的${modelFk.comment}列表
     */
    public static final String ${model.nameConstant}_LIST_${modelFk.nameConstant}${fkItem.name ? '_' + fkItem.nameConstant : ''} = "${model.nameConstant}#LIST_${modelFk.nameConstant}${fkItem.name ? '_' + fkItem.nameConstant : ''}";
`);
    });

    // 用于级联选择，用在任何地方，不应该设置权限，暂时取消输出。
    return "";

    return methods.join("\n");
  }

  protected createCodeSetM2m(module?: Module, models?: Model[], model?: Model): string {
    if (isMany2ManyOnly(model)) {
      return '';
    }

    let code = "";
    const fkMap = getFkMapOfOther(this.project.models, model, this.project.modelMap);

    Object.values(fkMap).filter(fkItem => fkItem.m2mItem && fkItem.m2mItem.model.moduleName === module.name).forEach(fkItem => {
      const fkModel = fkItem.model;

      code += `
    /**
     * 权限:设置${model.comment}的${fkModel.comment}列表${fkItem.name ? `(${fkItem.comment})` : ''}
     */
    public static final String ${model.nameConstant}_SET_${fkModel.nameConstant}_LIST${fkItem.name ? '_' + fkItem.nameConstant : ''} = "${model.nameConstant}#SET_${fkModel.nameConstant}_LIST${fkItem.name ? '_' + fkItem.nameConstant : ''}";

`;

    });
    return code;
  }


}
