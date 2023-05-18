import {CodeTypeEnum, Generator} from "../generator";
import {Model, Module, Project} from "../../model.model";
import {EnumItem} from "@shared/shared";


export class NgSharedJsonSchemaHelperTsGenerator extends Generator {
  protected splitCodeBy() {
    return Project;
  }

  protected getType(module: Module, models: Model[], model: Model): EnumItem {
    return CodeTypeEnum.NG;
  }

  protected createFileDirectory(module: Module, models: Model[], model: Model): string {
    return `${this.project.nameDirectory}-web-client/src/app/shared/json-schema`;
  }

  protected createFileName(module: Module, models: Model[], model: Model): string {
    return `json-schema.helper`;
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
    const code = `import {SFUploadWidgetSchema} from "@delon/form";
import {environment} from "@env/environment";
import {UploadChangeParam} from "ng-zorro-antd";

export interface ResourceResponse {
  path?: string;
  url?: string
}

export function createSFUploadFileListEnum(paths?: ResourceResponse[] | ResourceResponse): any[] {
  const pathList: ResourceResponse[] = paths ? (paths instanceof Array ? paths : [paths]) : [];
  return pathList.map(path => ({
    status: 'done',
    url: path.url,
    response: {
      path: path.path,
    },
  }));
}

export function createSFUploadWidgetSchema(options?: any): SFUploadWidgetSchema {
  options = Object.assign({limit: 1}, options);
  const schema = {
    widget: 'upload',
    action: environment.UPLOAD_URL,
    listType: 'picture-card',
    resReName: 'path',
    urlReName: 'url',
    multiple: options.limit > 1 ? true : false,
    limit: options.limit,
    change: (args: UploadChangeParam) => {
      if (args.type === "start") {
        while (args.fileList.length > options.limit) {
          args.fileList.shift();
        }
      } else if (args.type === "success") {
        args.file.response.url = environment.DOWNLOAD_URL + args.file.response.path;
      }
    }
  } as SFUploadWidgetSchema;
  return schema;
}


`;
    return code;
  }

}
