import {CodeTypeEnum, Generator} from "../generator";
import {Model, Module, Project} from "../../model.model";
import {EnumItem} from "@shared/shared";
import * as format from 'date-fns/format';


export class NgConstantBaseRoleGenerator extends Generator {
  protected splitCodeBy() {
    return Project;
  }

  protected getType(module: Module, models: Model[], model: Model): EnumItem {
    return CodeTypeEnum.NG;
  }

  protected createFileDirectory(module: Module, models: Model[], model: Model): string {
    return `${this.project.nameDirectory}-web-client/src/app/core/auth/`;
  }

  protected createFileName(module: Module, models: Model[], model: Model): string {
    return `base-role.constant`;
  }

  protected createFileExtension(module: Module, models: Model[], model: Model): string {
    return "ts";
  }


  public createCodeStart(module: Module, models: Model[], model: Model): string {
    return ``;
  }


  public createCodeEnd(module: Module, models: Model[], model: Model): string {
    return ``;
  }

  public createCodeMain(module: Module, models: Model[], model: Model, params?: any): string {
    const code = `import {createEnumArray, createEnumMap, EnumItem} from "@shared/shared.model";

export const BaseRole: { [key: string]: EnumItem } = {
  USER: {
    value: "USER", label: '注册用户'
  },
  SYSTEM: {
    value: 'SYSTEM', label: '系统管理员'
  }

};

export const BaseRoleMap: { [key: string]: EnumItem } = createEnumMap(BaseRole);

export const BaseRoleList: EnumItem[] = createEnumArray(BaseRole);


    `;
    return code;
  }

}
