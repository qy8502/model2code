import {CodeTypeEnum, Generator} from "../generator";
import {Model, Module, Project} from "../../model.model";
import {EnumItem} from "@shared/shared";
import * as format from 'date-fns/format';


export class JavaDtoSearchParamBaseGenerator extends Generator {
  protected splitCodeBy() {
    return Project;
  }

  protected getType(module: Module, models: Model[], model: Model): EnumItem {
    return CodeTypeEnum.JAVA_DTO;
  }

  protected createFileDirectory(module: Module, models: Model[], model: Model): string {
    return `${this.project.nameDirectory}-web/src/main/java/${this.project.packageDirectory}` +
      `/common/domain/`;
  }

  protected createFileName(module: Module, models: Model[], model: Model): string {
    return `SearchParam`;
  }

  protected createFileExtension(module: Module, models: Model[], model: Model): string {
    return "java";
  }


  public createCodeStart(module: Module, models: Model[], model: Model): string {
    return `package ${this.project.packageCommon}.domain;

import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Data;

/**
 * 分页搜索参数基类
 *
 * @author ${this.project.authorName}
 * @date ${format(new Date(), 'YYYY-MM-DD HH:mm:ss')}
 */
@ApiModel(description = "分页搜索参数基类")
@Data
public class SearchParam {
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
     * 分页大小
     */
    @ApiModelProperty(value = "分页大小", example = "20")
    protected int pageSize = 20;

    /**
     * 分页页码
     */
    @ApiModelProperty(value = "分页页码", example = "0")
    protected int pageIndex = 0;

    /**
     * 是否返回数据数量
     */
    @ApiModelProperty("是否返回数据总数量")
    protected boolean count = false;

    `;
    // `
    // public int getPageSize() {
    //     return pageSize;
    // }
    //
    // public void setPageSize(int pageSize) {
    //     this.pageSize = pageSize;
    // }
    //
    // public int getPageIndex() {
    //     return pageIndex;
    // }
    //
    // public void setPageIndex(int pageIndex) {
    //     this.pageIndex = pageIndex;
    // }
    //
    // public boolean isCount() {
    //     return count;
    // }
    //
    // public void setCount(boolean count) {
    //     this.count = count;
    // }
    // `;
    return code;
  }

}
