import {CodeTypeEnum, CrudGenerator, Generator} from "../generator";
import {EnumItem} from "@shared/shared";
import {Model, Module} from "../../model.model";
import * as format from 'date-fns/format';
import {
  getFkMap, getFkMapOfOther,
  isForeignOfOther,
  isMany2Many,
  isMany2ManyOnly, isModelSameModule
} from "../../model.helper";

export class DatabasePermissionGenerator extends CrudGenerator {

  protected getType(module?: Module, models?: Model[], model?: Model): EnumItem {
    return CodeTypeEnum.DATABASE;
  }

  protected createFileDirectory(module?: Module, models?: Model[], model?: Model): string {
    return `${this.project.nameDirectory}-document/sql`;
  }

  protected createFileName(module?: Module, models?: Model[], model?: Model): string {
    return `init-permission-${module.nameLowerLine}`;
  }

  protected createFileExtension(module?: Module, models?: Model[], model?: Model): string {
    return "sql";
  }

  public createCodeStart(module?: Module, models?: Model[], model?: Model): string {
    return `
INSERT INTO \`baseRole\` (\`id\`, \`name\`) VALUES ('USER', '注册用户') ON DUPLICATE KEY UPDATE \`id\`=\`id\`;

    `;
  }


  public createCodeEnd(module?: Module, models?: Model[], model?: Model): string {
    return `
`;
  }

  protected createCodeCreate(module?: Module, models?: Model[], model?: Model): string {
    return `
#权限:添加${model.comment}
INSERT INTO \`permission\`(\`id\`,\`name\`,\`page\`,\`pageName\`,\`pagePath\`) VALUES('${model.nameConstant}#ADD','添加${model.comment}',0,'${model.comment}管理','/${module.nameLowerLine}${isModelSameModule(this.project, module.name) ? '' : '/' + model.nameLowerLine }#ADD') ON DUPLICATE KEY UPDATE \`id\`=\`id\`;
INSERT INTO \`baseRolePermission\` (\`baseRoleId\`, \`permissionId\`) VALUES ('USER', '${model.nameConstant}#ADD') ON DUPLICATE KEY UPDATE \`baseRoleId\`=\`baseRoleId\`;

`;
  }

  protected createCodeUpdate(module?: Module, models?: Model[], model?: Model): string {
    if (isMany2ManyOnly(model)) {
      return "";
    }
    return `
#权限:编辑${model.comment}
INSERT INTO \`permission\`(\`id\`,\`name\`,\`page\`,\`pageName\`,\`pagePath\`) VALUES('${model.nameConstant}#EDIT','编辑${model.comment}',0,'${model.comment}管理','/${module.nameLowerLine}${isModelSameModule(this.project, module.name) ? '' : '/' + model.nameLowerLine }#EDIT') ON DUPLICATE KEY UPDATE \`id\`=\`id\`;
INSERT INTO \`baseRolePermission\` (\`baseRoleId\`, \`permissionId\`) VALUES ('USER', '${model.nameConstant}#EDIT') ON DUPLICATE KEY UPDATE \`baseRoleId\`=\`baseRoleId\`;

`;
  }

  protected createCodeDelete(module?: Module, models?: Model[], model?: Model): string {

    return `
#权限:删除${model.comment}
INSERT INTO \`permission\`(\`id\`,\`name\`,\`page\`,\`pageName\`,\`pagePath\`) VALUES('${model.nameConstant}#DELETE','删除${model.comment}',0,'${model.comment}管理','/${module.nameLowerLine}${isModelSameModule(this.project, module.name) ? '' : '/' + model.nameLowerLine }#DELETE') ON DUPLICATE KEY UPDATE \`id\`=\`id\`;
INSERT INTO \`baseRolePermission\` (\`baseRoleId\`, \`permissionId\`) VALUES ('USER', '${model.nameConstant}#DELETE') ON DUPLICATE KEY UPDATE \`baseRoleId\`=\`baseRoleId\`;

`;
  }

  protected createCodeReadGet(module?: Module, models?: Model[], model?: Model): string {

    return `
#权限:查看${model.comment}详情
#INSERT INTO \`permission\`(\`id\`,\`name\`,\`page\`,\`pageName\`,\`pagePath\`) VALUES('${model.nameConstant}#VIEW','查看${model.comment}详情',0,'${model.comment}管理','/${module.nameLowerLine}${isModelSameModule(this.project, module.name) ? '' : '/' + model.nameLowerLine }#VIEW') ON DUPLICATE KEY UPDATE \`id\`=\`id\`;
#INSERT INTO \`baseRolePermission\` (\`baseRoleId\`, \`permissionId\`) VALUES ('USER', '${model.nameConstant}#VIEW') ON DUPLICATE KEY UPDATE \`baseRoleId\`=\`baseRoleId\`;

`;
  }

  protected createCodeReadSearch(module?: Module, models?: Model[], model?: Model): string {
    if (isMany2ManyOnly(model)) {
      return '';
    }

    return `
#权限:查询浏览${model.comment}列表
INSERT INTO \`permission\`(\`id\`,\`name\`,\`page\`,\`pageName\`,\`pagePath\`) VALUES('${model.nameConstant}#SEARCH','查询浏览${model.comment}列表',1,'${model.comment}管理','/${module.nameLowerLine}${isModelSameModule(this.project, module.name) ? '' : '/' + model.nameLowerLine }#SEARCH') ON DUPLICATE KEY UPDATE \`id\`=\`id\`;
INSERT INTO \`baseRolePermission\` (\`baseRoleId\`, \`permissionId\`) VALUES ('USER', '${model.nameConstant}#SEARCH') ON DUPLICATE KEY UPDATE \`baseRoleId\`=\`baseRoleId\`;

`;
  }


  protected createCodeReadList(module?: Module, models?: Model[], model?: Model): string {
    if (!isForeignOfOther(this.project.models, model)) {
      return '';
    }
    // 用于选择，用在任何地方，不应该设置权限，暂时取消输出。
    return "";

    return `
#权限:列出${model.comment}列表
#INSERT INTO \`permission\`(\`id\`,\`name\`,\`page\`,\`pageName\`,\`pagePath\`) VALUES('${model.nameConstant}#LIST','列出${model.comment}列表',0,'${model.comment}管理','/${module.nameLowerLine}${isModelSameModule(this.project, module.name) ? '' : '/' + model.nameLowerLine }#LIST') ON DUPLICATE KEY UPDATE \`id\`=\`id\`;
#INSERT INTO \`baseRolePermission\` (\`baseRoleId\`, \`permissionId\`) VALUES ('USER', '${model.nameConstant}#LIST') ON DUPLICATE KEY UPDATE \`baseRoleId\`=\`baseRoleId\`;

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
      const moduleFk = this.project.moduleMap[modelFk.moduleName].module;
      methods.push(`
#权限:列出${modelFk.comment}的${model.comment}列表${fkItem.name ? `(${fkItem.comment})` : ''}
#INSERT INTO \`permission\`(\`id\`,\`name\`,\`page\`,\`pageName\`,\`pagePath\`) VALUES('${modelFk.nameConstant}#LIST_${model.nameConstant}${fkItem.name ? '_' + fkItem.nameConstant : ''}','列出${modelFk.comment}的${model.comment}列表${fkItem.name ? `(${fkItem.comment})` : ''}',0,'${modelFk.comment}管理','/${moduleFk.nameLowerLine}${isModelSameModule(this.project, moduleFk.name) ? '' : '/' + modelFk.nameLowerLine }#LIST_${model.nameConstant}${fkItem.name ? '_' + fkItem.nameConstant : ''}') ON DUPLICATE KEY UPDATE \`id\`=\`id\`;
#INSERT INTO \`baseRolePermission\` (\`baseRoleId\`, \`permissionId\`) VALUES ('USER', '${modelFk.nameConstant}#LIST_${model.nameConstant}${fkItem.name ? '_' + fkItem.nameConstant : ''}') ON DUPLICATE KEY UPDATE \`baseRoleId\`=\`baseRoleId\`;
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
#权限:列出${model.comment}的${modelFk.comment}列表${fkItem.name ? `(${fkItem.comment})` : ''}
#INSERT INTO \`permission\`(\`id\`,\`name\`,\`page\`,\`pageName\`,\`pagePath\`) VALUES('${model.nameConstant}#LIST_${modelFk.nameConstant}${fkItem.name ? '_' + fkItem.nameConstant : ''}','列出${model.comment}的${modelFk.comment}列表${fkItem.name ? `(${fkItem.comment})` : ''}',0,'${model.comment}管理','/${module.nameLowerLine}${isModelSameModule(this.project, module.name) ? '' : '/' + model.nameLowerLine }#LIST_${modelFk.nameConstant}${fkItem.name ? '_' + fkItem.nameConstant : ''}') ON DUPLICATE KEY UPDATE \`id\`=\`id\`;
#INSERT INTO \`baseRolePermission\` (\`baseRoleId\`, \`permissionId\`) VALUES ('USER', '${model.nameConstant}#LIST_${modelFk.nameConstant}${fkItem.name ? '_' + fkItem.nameConstant : ''}') ON DUPLICATE KEY UPDATE \`baseRoleId\`=\`baseRoleId\`;
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
#权限:设置${model.comment}的${fkModel.comment}列表${fkItem.name ? `(${fkItem.comment})` : ''}
INSERT INTO \`permission\`(\`id\`,\`name\`,\`page\`,\`pageName\`,\`pagePath\`) VALUES('${model.nameConstant}#SET_${fkModel.nameConstant}_LIST${fkItem.name ? '_' + fkItem.nameConstant: ''}','设置${model.comment}的${fkModel.comment}列表${fkItem.name ? `(${fkItem.comment})` : ''}',0,'${model.comment}管理','/${module.nameLowerLine}${isModelSameModule(this.project, module.name) ? '' : '/' + model.nameLowerLine }#SET_${fkModel.nameConstant}_LIST${fkItem.name ? '_' + fkItem.nameConstant: ''}') ON DUPLICATE KEY UPDATE \`id\`=\`id\`;
INSERT INTO \`baseRolePermission\` (\`baseRoleId\`, \`permissionId\`) VALUES ('USER', '${model.nameConstant}#SET_${fkModel.nameConstant}_LIST${fkItem.name ? '_' + fkItem.nameConstant: ''}') ON DUPLICATE KEY UPDATE \`baseRoleId\`=\`baseRoleId\`;

`;

    });
    return code;
  }


}
