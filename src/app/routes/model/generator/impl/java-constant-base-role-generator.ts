import {CodeTypeEnum, Generator} from "../generator";
import {Model, Module, Project} from "../../model.model";
import {EnumItem} from "@shared/shared";
import * as format from 'date-fns/format';


export class JavaConstantBaseRoleGenerator extends Generator {
  protected splitCodeBy() {
    return Project;
  }

  protected getType(module: Module, models: Model[], model: Model): EnumItem {
    return CodeTypeEnum.JAVA_DTO;
  }

  protected createFileDirectory(module: Module, models: Model[], model: Model): string {
    return `${this.project.nameDirectory}-web/src/main/java/${this.project.packageDirectory}` +
      `/constant/`;
  }

  protected createFileName(module: Module, models: Model[], model: Model): string {
    return `BaseRole`;
  }

  protected createFileExtension(module: Module, models: Model[], model: Model): string {
    return "java";
  }


  public createCodeStart(module: Module, models: Model[], model: Model): string {
    return `package ${this.project.package}.constant;

/**
 * 基础角色常量
 *
 * @author ${this.project.authorName}
 * @date ${format(new Date(), 'YYYY-MM-DD HH:mm:ss')}
 */
public class BaseRole {

`;
  }


  public createCodeEnd(module: Module, models: Model[], model: Model): string {
    return `

}
`;
  }

  public createCodeMain(module: Module, models: Model[], model: Model, params?: any): string {
    const code = `

    /**
     * 基础角色:注册用户
     */
    public static final String USER = "USER";

    /**
     * 基础角色:系统管理员
     */
    public static final String SYSTEM = "SYSTEM";


    `;
    return code;
  }

}
