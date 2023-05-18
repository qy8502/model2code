import {CodeTypeEnum, FieldsGenerator} from "../generator";
import {Field, FieldTypeEnum, FieldTypeValueForeignList, Model, Module, Project} from "../../model.model";
import {EnumItem} from "@shared/shared";
import {addImportModules, getField, getFieldTypeTs, getFkMap, getModel, isMany2ManyOnly} from "../../model.helper";
import {NgModelSearchParamTsGenerator} from "./ng-model-search-param-ts-generator";
import {NgModelEnumTsGenerator} from "./ng-model-enum-ts-generator";
import {toCamel} from "../../name.helper";

export class NgModelTsGenerator extends FieldsGenerator {

    protected _searchGenerator: NgModelSearchParamTsGenerator;
    protected _enumGenerator: NgModelEnumTsGenerator;

    constructor(protected _project: Project) {
        super(_project);
        this._searchGenerator = new NgModelSearchParamTsGenerator(_project);
        this._enumGenerator = new NgModelEnumTsGenerator(_project);
    }

    protected splitCodeBy(): typeof Project | typeof Module | typeof Model {
        return Module;
    }

    protected getType(module?: Module, models?: Model[], model?: Model): EnumItem {
        return CodeTypeEnum.NG;
    }

    protected createFileDirectory(module?: Module, models?: Model[], model?: Model): string {
        // 实体放到业务Module目录中
        // return `${this.project.nameDirectory}-web-client/src/app/routes/${module.nameLowerLine}/`;
        // 实体放到core目录中
        return `${this.project.nameDirectory}-web-client/src/app/core/${module.nameLowerLine}/`;
    }

    protected createFileName(module?: Module, models?: Model[], model?: Model): string {
        return `${module.nameLowerLine}.model`;
    }

    protected createFileExtension(module?: Module, models?: Model[], model?: Model): string {
        return "ts";
    }

    protected createCode(module?: Module, models?: Model[], model?: Model): string {
        const importModules = {};

        models.forEach((item) => item.fields.filter((field) => [FieldTypeEnum.ENUM.value, FieldTypeEnum.ENUM_TEXT.value, FieldTypeEnum.FOREIGN_FIELD.value].indexOf(field.type) > -1)
            .forEach((field) => {
                addImportModules(this.project.modelMap, importModules, field);
            }));

        let importModels = '';

        Object.keys(importModules).filter((key) => module.name !== key).forEach((key) => {
            const importModule = this.project.moduleMap[key].module;
            importModels = `
import {` + importModules[key].join(', ') + `} from "@core/${importModule.nameLowerLine}/${importModule.nameLowerLine}.model";`;
        });


        let code = `import {createEnumArray, createEnumMap, EnumItem, formatDate, formatDateTime, SearchParam} from "@shared/shared.model";
import {environment} from "@env/environment";${importModels}
`;

        this.splitCode(Model).forEach((item) => {
            if (item.model.moduleName === module.name) {
                if (item.model.enum) {
                    code += this._enumGenerator.createCodeStart(item.module, item.models, item.model);
                    code += this._enumGenerator.createCodeMain(item.module, item.models, item.model);
                    code += this._enumGenerator.createCodeEnd(item.module, item.models, item.model);
                } else {
                    code += this.createCodeStart(item.module, item.models, item.model);
                    code += this.createCodeMain(item.module, item.models, item.model);
                    code += this.createCodeEnd(item.module, item.models, item.model);
                }

                if (!isMany2ManyOnly(item.model)) {
                    code += this._searchGenerator.createCodeStart(item.module, item.models, item.model);
                    code += this._searchGenerator.createCodeMain(item.module, item.models, item.model);
                    code += this._searchGenerator.createCodeEnd(item.module, item.models, item.model);
                }


            }
        });
        return code;
    }

    public createCodeStart(module?: Module, models?: Model[], model?: Model): string {
        const fieldsPk = model.fields.filter(field => field.pk);
        const toValueString = fieldsPk.length > 1 ? `
  toValue(): string {
    return ${fieldsPk.map(field => `this.${field.nameCamel}`).join(" && ")} ? JSON.stringify({${fieldsPk.map(field => `${field.nameCamel}:this.${field.nameCamel}`).join(",")}}) : null;
  }` : '';
        const dates = model.fields.filter((field) => getFieldTypeTs(field, model, this.project.modelMap) === 'Date').map((field) =>
            `
    if (this.${field.nameCamel}) {
      this.${field.nameCamel} = new Date(this.${field.nameCamel});
    }`).join('');
        return `
/**
 * ${model.comment}实体
 */
export class ${model.name}DTO {

  constructor(data?: any) {
    // noinspection TypeScriptValidateTypes
    Object.assign(this, data);${dates}
  }
  ${toValueString}

`;
    }


    public createCodeEnd(module?: Module, models?: Model[], model?: Model): string {
        const fkItems = Object.values(getFkMap(model, this.project.modelMap));
        let fkParams = "";
        fkItems.filter(item => item.fkFields.length > 1).forEach(fkItem => {
            fkParams += `
  get ${toCamel((fkItem.name ? fkItem.name : '') + fkItem.model.name)}() {
    return ${fkItem.fkFields.map(field => `this.${field.nameCamel}`).join(" && ")} ? JSON.stringify({${fkItem.fkFields.map(field => `${getField(fkItem.model, field.typeData).nameCamel}: this.${field.nameCamel}`).join(", ")}}) : null;
  }

  set ${toCamel(fkItem.name + fkItem.model.name)}(value: string) {
    const ${fkItem.model.nameCamel} = value ? JSON.parse(value) : null;${fkItem.fkFields.map(field => `
    this.${field.nameCamel} = ${fkItem.model.nameCamel} ? ${fkItem.model.nameCamel}.${getField(fkItem.model, field.typeData).nameCamel} : null;`).join("")}

  }`;
        });

        return `
${fkParams}
}

`;
    }

    protected createCodeFieldAny(module: Module, models: Model[], model: Model, field: Field, params?: any, typeDefault?: string) {
        const type = typeDefault || getFieldTypeTs(field, model, this.project.modelMap);
        const fieldOld = params ? params.fieldOld : field;
        return `
    /**
     * ${fieldOld.comment}${FieldTypeValueForeignList.indexOf(fieldOld.type) >= 0 ? '(级联关系)' : ''}
     */
    ${fieldOld.nameCamel}:${type};
`;
    }

    protected createCodeFieldDate(module: Module, models: Model[], model: Model, field: Field, params?: any): string {
        let code = this.createCodeFieldAny(module, models, model, field, params);
        code += `
  /**
   * ${field.comment}（格式化字符）
   */
  get ${field.nameCamel}Text(): string {
    return formatDate(this.${field.nameCamel});
  }
`;
        return code;
    }

    protected createCodeFieldDateRange(module: Module, models: Model[], model: Model, field: Field, params?: any): string {
        return this.createCodeFieldDate(module, models, model, field, params);
    }

    protected createCodeFieldTime(module: Module, models: Model[], model: Model, field: Field, params?: any): string {
        let code = this.createCodeFieldAny(module, models, model, field, params);
        code += `
  /**
   * ${field.comment}（格式化字符）
   */
  get ${field.nameCamel}Text(): string {
    return formatDateTime(this.${field.nameCamel});
  }
`;
        return code;
    }

    protected createCodeFieldTimeRange(module: Module, models: Model[], model: Model, field: Field, params?: any): string {
        return this.createCodeFieldTime(module, models, model, field, params);
    }


    protected createCodeFieldImage(module: Module, models: Model[], model: Model, field: Field, params?: any): string {
        let code = this.createCodeFieldAny(module, models, model, field, params);
        code += `
  /**
   * ${field.comment}（下载地址）
   */
  get ${field.nameCamel}Url(): string {
    return environment.DOWNLOAD_URL + this.${field.nameCamel};
  }

  /**
   * ${field.comment}（缩略图地址）
   */
  get ${field.nameCamel}ThumbUrl(): string {
    return environment.THUMB_URL + this.${field.nameCamel};
  }
`;
        return code;
    }

    protected createCodeFieldEnum(module: Module, models: Model[], model: Model, field: Field, params?: any): string {
        let code = this.createCodeFieldAny(module, models, model, field, params);
        const enumModel = getModel(this.project.modelMap, field.typeData);
        code += `
  /**
   * ${field.comment}（标签）
   */
  get ${field.nameCamel}Label(): string {
    return ${enumModel.name}Map[this.${field.nameCamel}].label;
  }
`;
        return code;
    }

    protected createCodeFieldEnumText(module: Module, models: Model[], model: Model, field: Field, params?: any): string {
        return this.createCodeFieldEnum(module, models, model, field, params);
    }

    protected createCodeFieldForeignKey(module: Module, models: Model[], model: Model, field: Field, params?: any): string {
        return this.createCodeFieldForeignField(module, models, model, field, params);
    }

    protected createCodeFieldForeignField(module: Module, models: Model[], model: Model, field: Field, params?: any): string {
        const modelNew = getModel(this.project.modelMap, field.typeData);
        const fieldNew = getField(modelNew, field.typeData);
        const moduleItem = this.project.moduleMap[modelNew.moduleName];
        params = params || {fieldOld: field};
        return this.createCodeField(moduleItem.module, moduleItem.models, modelNew, fieldNew, params);
    }

    protected createCodeFieldForeignObject(module: Module, models: Model[], model: Model, field: Field, params?: any): string {
        return "";
    }

    protected createCodeFieldForeignArray(module: Module, models: Model[], model: Model, field: Field, params?: any): string {
        return "";
    }


}
