import {CodeTypeEnum, CrudGenerator, Generator} from "../generator";
import {EnumItem} from "@shared/shared";
import {FieldTypeMap, FieldTypeValueForeignList, Model, Module, Project} from "../../model.model";
import * as format from 'date-fns/format';
import {
  getField,
  getFieldTypeTs,
  getFkMap,
  isForeignOfOther,
  isMany2Many,
  isMany2ManyOnly,
  isModelSameModule
} from "../../model.helper";

export class NgAppDataJsonGenerator extends Generator {

  protected splitCodeBy(): typeof Project | typeof Module | typeof Model {
    return Project;
  }

  protected getType(module?: Module, models?: Model[], model?: Model): EnumItem {
    return CodeTypeEnum.NG;
  }

  protected createFileDirectory(module?: Module, models?: Model[], model?: Model): string {
    return `${this.project.nameDirectory}-web-client/src/assets/config/`;
  }

  protected createFileName(module?: Module, models?: Model[], model?: Model): string {
    return `app-data`;
  }

  protected createFileExtension(module?: Module, models?: Model[], model?: Model): string {
    return "json";
  }

  public createCodeStart(module?: Module, models?: Model[], model?: Model): string {
    return '';
  }

  protected createCodeMain(module?: Module, models?: Model[], model?: Model): string {
    const menus = [];
    Object.values(this.project.moduleMap).forEach((mapItem) => {
      if (mapItem.models.every(modelItem => modelItem.enum)) {
        return;
      }
      let menu = `
    {
      "text": "${mapItem.module.comment}管理",
      "group": true,
      "hideInBreadcrumb": true,
      "children": [`;
      menu += mapItem.models.filter((item) => !isMany2ManyOnly(item)).map((item) => `
        {
          "text": "${item.comment}管理",
          "icon": "team",
          "link": "/${mapItem.module.nameLowerLine}${isModelSameModule(this.project, mapItem.module.name) ? '' : '/' + item.nameLowerLine }",
          "acl": {"role": ["SYSTEM"], "ability": ["${item.nameConstant}#SEARCH"], "mode": "oneOf"}
        }`).join(',');
      menu += `
      ]
    }`;
      menus.push(menu);
    });
    return `{
  "app": {
    "name": "${this.project.comment}",
    "description": "${this.project.comment}"
  },
  "menu": [${menus}
  ]
}
`;
  }

  public createCodeEnd(module?: Module, models?: Model[], model?: Model): string {
    return '';
  }

}
