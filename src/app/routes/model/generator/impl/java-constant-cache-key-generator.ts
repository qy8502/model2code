import {CodeTypeEnum, CrudGenerator} from "../generator";
import {EnumItem} from "@shared/shared";
import {Model, Module} from "../../model.model";
import * as format from 'date-fns/format';
import {getFkMap, getFkMapOfOther, isForeignOfOther, isMany2ManyOnly} from "../../model.helper";

export class JavaConstantCacheKeyGenerator extends CrudGenerator {

  protected getType(module?: Module, models?: Model[], model?: Model): EnumItem {
    return CodeTypeEnum.JAVA_WEB;
  }

  protected createFileDirectory(module?: Module, models?: Model[], model?: Model): string {
    return `${this.project.nameDirectory}-web/src/main/java/${this.project.packageDirectory}` +
      `/constant/${module.package}/`;
  }

  protected createFileName(module?: Module, models?: Model[], model?: Model): string {
    return `${module.name}CacheKey`;
  }

  protected createFileExtension(module?: Module, models?: Model[], model?: Model): string {
    return "java";
  }

  public createCodeStart(module?: Module, models?: Model[], model?: Model): string {
    return `package ${this.project.package}.constant.${module.package};

/**
 * ${module.comment}缓存Key常量
 *
 * @author ${this.project.authorName}
 * @date ${format(new Date(), 'YYYY-MM-DD HH:mm:ss')}
 */
public class ${module.name}CacheKey {


`;
  }


  public createCodeEnd(module?: Module, models?: Model[], model?: Model): string {
    return `

}
`;
  }

  protected createCodeCreate(module?: Module, models?: Model[], model?: Model): string {
    return "";
  }

  protected createCodeUpdate(module?: Module, models?: Model[], model?: Model): string {
    return "";
  }

  protected createCodeDelete(module?: Module, models?: Model[], model?: Model): string {
    return "";
  }

  protected createCodeReadGet(module?: Module, models?: Model[], model?: Model): string {
    const fieldsPk = model.fields.filter((field) => field.pk);
    const paramInStr = fieldsPk.map((field) => `:#${field.nameCamel}`).join("");

    return `
     /**
     * 缓存：${model.comment}对象 (格式：${model.name}${paramInStr})
     */
     public static final String ${model.nameConstant} = "${model.name}";
`;
  }


  protected createCodeReadSearch(module?: Module, models?: Model[], model?: Model): string {
    return '';
  }

  protected createCodeReadList(module?: Module, models?: Model[], model?: Model): string {
    if (!isForeignOfOther(this.project.models, model)) {
      return '';
    }
    return `
     /**
     * 缓存：${model.comment}对象集合 (格式：${model.name})
     */
     public static final String ${model.nameConstant}_LIST = "${model.name}List";
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
      const fieldsFk = fkItem.fkFields;
      const modelFk = fkItem.model;
      const paramInStr = fieldsFk.map((field) => `:#${field.nameCamel}`).join("");
      methods.push(`
     /**
     * 缓存：${modelFk.comment}的${model.comment}对象集合${fkItem.name ? `(${fkItem.comment})` : ''}(用于级联选择) (格式：${model.name}${paramInStr})
     */
     public static final String ${model.nameConstant}_LIST_FOR_${modelFk.nameConstant}${fkItem.name ? '_' + fkItem.nameConstant : ''} = "${model.name}ListFor${modelFk.name}${fkItem.name}";
`);
    });


    return methods.join("\n");
  }

  protected createCodeReadListByM2m(module?: Module, models?: Model[], model?: Model): string {

    if (isMany2ManyOnly(model)) {
      return '';
    }
    const methods = [];
    const fkMap = getFkMapOfOther(this.project.models, model, this.project.modelMap);
    Object.values(fkMap).filter(fkItem => fkItem.m2mItem && fkItem.m2mItem.model.moduleName === module.name).forEach(fkItem => {
      const fieldsFk = fkItem.fkFields;
      const modelFk = fkItem.model;
      const paramInStr = fieldsFk.map((field) => `:#${field.nameCamel}`).join("");
      methods.push(`
     /**
     * 缓存：${fkItem.comment}${model.comment}的${modelFk.comment}对象集合(用于级联选择) (格式：${modelFk.name}ListFor${model.name}${fkItem.name}${paramInStr})
     */
     public static final String ${modelFk.nameConstant}_LIST_FOR_${model.nameConstant}${fkItem.name ? '_' + fkItem.nameConstant : ''} = "${modelFk.name}ListFor${model.name}${fkItem.name}";
`);
    });


    return methods.join("\n");
  }

  protected createCodeSetM2m(module?: Module, models?: Model[], model?: Model): string {
    return "";
  }


}
