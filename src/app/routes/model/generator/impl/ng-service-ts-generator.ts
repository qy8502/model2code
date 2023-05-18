import {CodeTypeEnum, CrudGenerator} from "../generator";
import {EnumItem} from "@shared/shared";
import {FieldTypeForeignList, Model, Module} from "../../model.model";
import {
  getFieldTypeTs,
  getFkMap,
  getFkMapOfOther,
  getModel,
  isForeignOfOther,
  isMany2ManyOnly,
  isModelSameModule
} from "../../model.helper";

export class NgServiceTsGenerator extends CrudGenerator {

  protected getType(module?: Module, models?: Model[], model?: Model): EnumItem {
    return CodeTypeEnum.NG;
  }

  protected createFileDirectory(module?: Module, models?: Model[], model?: Model): string {
    // 服务放到业务Module目录中
    // return `${this.project.nameDirectory}-web-client/src/app/routes/${module.nameLowerLine}/`;
    // 服务放到core目录中
    return `${this.project.nameDirectory}-web-client/src/app/core/${module.nameLowerLine}/`;
  }

  protected createFileName(module?: Module, models?: Model[], model?: Model): string {
    return `${module.nameLowerLine}.service`;
  }

  protected createFileExtension(module?: Module, models?: Model[], model?: Model): string {
    return "ts";
  }

  public createCodeStart(module?: Module, models?: Model[], model?: Model): string {
    return `import {Injectable, Injector} from '@angular/core';
import {Observable, of} from "rxjs";
import {map, mergeMap} from "rxjs/operators";
import {_HttpClient, BaseApi, BaseUrl, Body, DELETE, GET, Path, Payload, POST, PUT, Query} from "@delon/theme";
${this.createCodeImportDTO(models)}
import {createPageList, createArray, PageList} from "@shared/shared.model";
import {CacheService} from "@delon/cache";

const BASE_URL = "${isModelSameModule(this._project, module.name) ? "" : ("/" + module.nameLowerLine)}";

/**
 * ${module.comment}服务
 */
@Injectable({providedIn: 'root'})
@BaseUrl(BASE_URL)
export class ${module.name}Service extends BaseApi {

  constructor(protected injector: Injector, private cacheService: CacheService, private http: _HttpClient) {
    super(injector);
  }

`;
  }

  protected createCodeImportDTO(models?: Model[], model?: Model) {
    const map = {};
    models.forEach((item) => {
      if (item.enum) {
        return;
      }
      if (!map[item.moduleName]) {
        map[item.moduleName] = {};
      }
      map[item.moduleName][`${item.name}DTO`] = `${item.name}DTO`;
      if (!isMany2ManyOnly(item)) {
        map[item.moduleName][`${item.name}SearchParam`] = `${item.name}SearchParam`;
      }
      item.fields.filter(field => FieldTypeForeignList.indexOf(field.type) > -1).forEach(field => {
        const fModel = getModel(this.project.modelMap, field.typeData);
        if (fModel.enum) {
          return;
        }
        if (!map[fModel.moduleName]) {
          map[fModel.moduleName] = {};
        }
        map[fModel.moduleName][`${fModel.name}DTO`] = `${fModel.name}DTO`;
      });

    });

    return Object.keys(map).map(moduleName => Object.values(map[moduleName]).length > 0 ?
      `import {${Object.values(map[moduleName]).join(', ')}} from "@core/${this.project.moduleMap[moduleName].module.nameLowerLine}/${this.project.moduleMap[moduleName].module.nameLowerLine}.model";
` : ''
    ).join("");
  }


  public createCodeEnd(module?: Module, models?: Model[], model?: Model): string {
    return `

}
`;
  }

  protected createCodeCreate(module?: Module, models?: Model[], model?: Model): string {
    return `
  /**
   * 添加${model.comment}
   */
  @POST("/${model.nameLowerLine}")
  add${model.name}(@Body ${model.nameCamel}:${model.name}DTO): Observable<void> {
      return;
  }
`;
  }

  protected createCodeUpdate(module?: Module, models?: Model[], model?: Model): string {
    if (isMany2ManyOnly(model)) {
      return '';
    }

    const fields = model.fields.filter((field) => field.pk);
    const paramStr = fields.map((field) => `@Path('${field.nameCamel}') ${field.nameCamel}: ${getFieldTypeTs(field, model, this.project.modelMap)}`).join(", ");
    const paramMappingStr = fields.map((field) => `:${field.nameCamel}`).join("/");

    return `
  /**
   * 更新${model.comment}
   */
  @PUT("/${model.nameLowerLine}/${paramMappingStr}")
  update${model.name}(${paramStr}, @Body ${model.nameCamel}: ${model.name}DTO): Observable<void> {
      return;
  }
`;

  }

  protected createCodeDelete(module?: Module, models?: Model[], model?: Model): string {
    const fields = model.fields.filter((field) => field.pk);
    const paramStr = fields.map((field) => `@Path('${field.nameCamel}') ${field.nameCamel}: ${getFieldTypeTs(field, model, this.project.modelMap)}`).join(", ");
    const paramMappingStr = fields.map((field) => `:${field.nameCamel}`).join("/");

    return `
  /**
   * 删除${model.comment}
   */
  @DELETE("/${model.nameLowerLine}/${paramMappingStr}")
  delete${model.name}(${paramStr}): Observable<void> {
     return;
  }
`;
  }

  protected createCodeReadGet(module?: Module, models?: Model[], model?: Model): string {
    const fields = model.fields.filter((field) => field.pk);
    const paramStr = fields.map((field) => `${field.nameCamel}: ${getFieldTypeTs(field, model, this.project.modelMap)}`).join(", ");
    const paramCacheKeyStr = fields.map((field) => `:$\{${field.nameCamel}\}`).join("");
    const paramApiStr = fields.map((field) => `@Path('${field.nameCamel}') ${field.nameCamel}: ${getFieldTypeTs(field, model, this.project.modelMap)}`).join(", ");
    const paramInStr = fields.map((field) => `${field.nameCamel}`).join(", ");
    const paramMappingStr = fields.map((field) => `:${field.nameCamel}`).join("/");
    return `
  /**
   * 获取${model.comment}对象
   */
  get${model.name}(${paramStr}): Observable<${model.name}DTO> {
    return this.cacheService.tryGet(\`${model.name}${paramCacheKeyStr}\`,
      of(null).pipe(mergeMap(()=>this._get${model.name}(${paramInStr}).pipe(map((data) => new ${model.name}DTO(data))))));
  }

  @GET("/${model.nameLowerLine}/${paramMappingStr}")
  _get${model.name}(${paramApiStr}): Observable<any> {
    return;
  }
`;
  }


  protected createCodeReadSearch(module?: Module, models?: Model[], model?: Model): string {
    if (isMany2ManyOnly(model)) {
      return '';
    }

    return `
  /**
   * 分页搜索${model.comment}对象集合
   */
  search${model.name}(param: ${model.name}SearchParam): Observable<PageList<${model.name}DTO>> {
    return this._search${model.name}(param).pipe(map((data) => createPageList(data, ${model.name}DTO)));
  }

  @GET("/${model.nameLowerLine}/search")
  _search${model.name}(@Payload param: ${model.name}SearchParam): Observable<any> {
    return;
  }
`;
  }

  protected createCodeReadList(module?: Module, models?: Model[], model?: Model): string {
    if (!isForeignOfOther(this.project.models, model)) {
      return '';
    }

    return `
  /**
   * 列出${model.comment}对象集合
   */
  list${model.name}(): Observable<any> {
    return this.cacheService.tryGet(\`${model.name}List\`,
      of(null).pipe(mergeMap(()=> this._list${model.name}().pipe(map((data) => createArray(data, ${model.name}DTO))))));
  }

  @GET("/${model.nameLowerLine}/list")
  _list${model.name}(): Observable<any> {
      return;
  }
`;
  }


  protected createCodeReadListByFk(module?: Module, models?: Model[], model?: Model): string {

    if ((isMany2ManyOnly(model) || !isForeignOfOther(this.project.models, model))) {
      return "";
    }
    const methods = [];
    const fkMap = getFkMap(model, this.project.modelMap);
    Object.values(fkMap).filter(fkItem => fkItem.model.moduleName === module.name).forEach(fkItem => {
      const fieldsFk = fkItem.fkFields;
      const modelFk = fkItem.model;
      const paramStr = fieldsFk.map((field) => `${field.nameCamel}: ${getFieldTypeTs(field, model, this.project.modelMap)}`).join(", ");
      const paramStrApi = fieldsFk.map((field) => `@Path('${field.nameCamel}') ${field.nameCamel}: ${getFieldTypeTs(field, model, this.project.modelMap)}`).join(", ");
      const paramInStr = fieldsFk.map((field) => `${field.nameCamel}`).join(", ");
      const paramCacheKeyStr = fieldsFk.map((field) => `:$\{${field.nameCamel}\}`).join("");
      const paramMappingStr = fieldsFk.map((field) => `:${field.nameCamel}`).join("/");

      methods.push(`
  /**
   * 列出${modelFk.comment}的${model.comment}对象集合${fkItem.name ? `(${fkItem.comment})` : ''}
   */
  list${model.name}For${modelFk.name}${fkItem.name}(${paramStr}): Observable<${model.name}DTO[]> {
    return this.cacheService.tryGet(\`${model.name}ListFor${modelFk.name}${fkItem.name}${paramCacheKeyStr}\`,
      of(null).pipe(mergeMap(()=> this._list${model.name}For${modelFk.name}${fkItem.name}(${paramInStr}).pipe(map((data) => createArray(data, ${model.name}DTO))))));
  }

  @GET("/${modelFk.nameLowerLine}/${paramMappingStr}/${model.nameLowerLine}/list${fkItem.name ? '/' + fkItem.nameLowerLine : ''}")
  _list${model.name}For${modelFk.name}${fkItem.name}(${paramStrApi}): Observable<any> {
      return;
  }
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
      const fieldsPk = model.fields.filter(field => field.pk);
      const modelFk = fkItem.model;
      const paramStr = fieldsPk.map((field) => `${field.nameCamel}: ${getFieldTypeTs(field, model, this.project.modelMap)}`).join(", ");
      const paramStrApi = fieldsPk.map((field) => `@Path('${field.nameCamel}') ${field.nameCamel}: ${getFieldTypeTs(field, model, this.project.modelMap)}`).join(", ");
      const paramInStr = fieldsPk.map((field) => `${field.nameCamel}`).join(", ");
      const paramCacheKeyStr = fieldsPk.map((field) => `:$\{${field.nameCamel}\}`).join("");
      const paramMappingStr = fieldsPk.map((field) => `:${field.nameCamel}`).join("/");

      methods.push(`
  /**
   * 列出${model.comment}的${modelFk.comment}对象集合${fkItem.name ? `(${fkItem.comment})` : ''}
   */
  list${modelFk.name}For${model.name}${fkItem.name}(${paramStr}): Observable<${modelFk.name}DTO[]> {
    return this.cacheService.tryGet(\`${modelFk.name}ListFor${model.name}${fkItem.name}${paramCacheKeyStr}\`,
      of(null).pipe(mergeMap(()=> this._list${modelFk.name}For${model.name}${fkItem.name}(${paramInStr}).pipe(map((data) => createArray(data, ${modelFk.name}DTO))))));
  }

  @GET("/${model.nameLowerLine}/${paramMappingStr}/${modelFk.nameLowerLine}/list${fkItem.name ? '/' + fkItem.nameLowerLine : ''}")
  _list${modelFk.name}For${model.name}${fkItem.name}(${paramStrApi}): Observable<any> {
      return;
  }
`);
    });

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
      const fieldsPk = model.fields.filter((field) => field.pk);
      const paramMappingStr = fieldsPk.map((field) => `:${field.nameCamel}`).join("/");
      const paramStr = fieldsPk.map((field) => `@Path('${field.nameCamel}') ${field.nameCamel}: ${getFieldTypeTs(field, model, this.project.modelMap)}`).join(", ");


      code += `

  /**
   * 设置${model.comment}的${fkModel.comment}列表${fkItem.name ? `(${fkItem.comment})` : ''}
   */
  @PUT("/${model.nameLowerLine}/${paramMappingStr}/${fkModel.nameLowerLine}-list${fkItem.name ? '/' + fkItem.nameLowerLine : ''}")
  set${fkModel.name}ListFor${model.name}${fkItem.name}(${paramStr}, @Body ${fkModel.nameCamel}List: ${fkModel.name}DTO[]): Observable<void> {
      return;
  }
`;

    });
    return code;
  }


}
