import {CodeTypeEnum, CrudGenerator, Generator} from "../generator";
import {EnumItem} from "@shared/shared";
import {Model, Module} from "../../model.model";
import * as format from 'date-fns/format';
import {
  getFkMap, getFkMapOfOther,
  isForeignOfOther,
  isMany2Many,
  isMany2ManyOnly
} from "../../model.helper";

export class NgConstantPermissionGenerator extends CrudGenerator {

  protected getType(module?: Module, models?: Model[], model?: Model): EnumItem {
    return CodeTypeEnum.JAVA_WEB;
  }

  protected createFileDirectory(module?: Module, models?: Model[], model?: Model): string {
    // 常量放到业务Module目录中
    // return `${this.project.nameDirectory}-web-client/src/app/routes/${module.nameLowerLine}/`;
    // 常量放到core目录中
    return `${this.project.nameDirectory}-web-client/src/app/core/${module.nameLowerLine}/`;
  }

  protected createFileName(module?: Module, models?: Model[], model?: Model): string {
    return `${module.nameLowerLine}-permission.constant`;
  }

  protected createFileExtension(module?: Module, models?: Model[], model?: Model): string {
    return "ts";
  }

  public createCodeStart(module?: Module, models?: Model[], model?: Model): string {
    return `import {createEnumArray, createEnumMap, EnumItem} from "@shared/shared.model";

export const ${module.name}Permission: { [key: string]: EnumItem } = {
`;
  }


  public createCodeEnd(module?: Module, models?: Model[], model?: Model): string {
    return `
};

export const ${module.name}PermissionMap: { [key: string]: EnumItem } = createEnumMap(${module.name}Permission);

export const ${module.name}PermissionList: EnumItem[] = createEnumArray(${module.name}Permission);
`;
  }

  protected createCodeMain(module?: Module, models?: Model[], model?: Model): string {
    let code = super.createCodeMain(module, models, model);
    if (code.lastIndexOf(",") === code.length - 1) {
      code = code.substring(0, code.length - 1);
    }
    return code;
  }

  protected createCodeCreate(module?: Module, models?: Model[], model?: Model): string {
    return `
  ${model.nameConstant}_ADD: {
    value: '${model.nameConstant}#ADD', label: '添加${model.comment}'
  },`;
  }

  protected createCodeUpdate(module?: Module, models?: Model[], model?: Model): string {
    if (isMany2ManyOnly(model)) {
      return '';
    }
    return `
  ${model.nameConstant}_EDIT: {
    value: '${model.nameConstant}#EDIT', label: '编辑${model.comment}'
  },`;
  }

  protected createCodeDelete(module?: Module, models?: Model[], model?: Model): string {

    return `
  ${model.nameConstant}_DELETE: {
    value: '${model.nameConstant}#DELETE', label: '删除${model.comment}'
  },`;
  }

  protected createCodeReadGet(module?: Module, models?: Model[], model?: Model): string {

    return `
  ${model.nameConstant}_VIEW: {
    value: '${model.nameConstant}#VIEW', label: '查看${model.comment}详情'
  },`;
  }

  protected createCodeReadSearch(module?: Module, models?: Model[], model?: Model): string {
    if (isMany2ManyOnly(model)) {
      return '';
    }

    return `
  ${model.nameConstant}_SEARCH: {
    value: '${model.nameConstant}#SEARCH', label: '查询浏览${model.comment}列表'
  },`;
  }


  protected createCodeReadList(module?: Module, models?: Model[], model?: Model): string {
    if (!isForeignOfOther(this.project.models, model)) {
      return '';
    }

    // 用于选择，用在任何地方，不应该设置权限，暂时取消输出。
    return "";

    return `
  ${model.nameConstant}_LIST: {
    value: '${model.nameConstant}#LIST', label: '列出${model.comment}列表'
  },`;
  }


  protected createCodeReadListByFk(module?: Module, models?: Model[], model?: Model): string {

    if ((isMany2ManyOnly(model) || !isForeignOfOther(this.project.models, model))) {
      return "";
    }
    const methods = [];
    const fkMap = getFkMap(model, this.project.modelMap);
    Object.values(fkMap).filter(fkItem => fkItem.model.moduleName === module.name).forEach(fkItem => {

      const modelFk = fkItem.model;

      methods.push(`
    ${modelFk.nameConstant}_LIST_${model.nameConstant}${fkItem.name ? '_' + fkItem.nameConstant  : ''}: {
      value: '${modelFk.nameConstant}#LIST_${model.nameConstant}${fkItem.name ? '_' + fkItem.nameConstant  : ''}', label: '列出${modelFk.comment}的${model.comment}列表${fkItem.name ? `(${fkItem.comment})` : ''}'
    },`);
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

      if (model.moduleName === module.name) {
        methods.push(`
    ${model.nameConstant}_LIST_${modelFk.nameConstant}${fkItem.name ? '_' + fkItem.nameConstant  : ''}: {
      value: '${model.nameConstant}#LIST_${modelFk.nameConstant}${fkItem.name ? '_' + fkItem.nameConstant  : ''}', label: '列出${model.comment}的${modelFk.comment}列表${fkItem.name ? `(${fkItem.comment})` : ''}'
    },`);
      }
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
  ${model.nameConstant}_SET_${fkModel.nameConstant}_LIST${fkItem.name ? '_' + fkItem.nameConstant : ''}: {
    value: '${model.nameConstant}#SET_${fkModel.nameConstant}_LIST${fkItem.name ? '_' + fkItem.nameConstant : ''}', label: '设置${model.comment}的${fkModel.comment}列表${fkItem.name ? `(${fkItem.comment})` : ''}'
  },`;

    });
    return code;
  }


}
