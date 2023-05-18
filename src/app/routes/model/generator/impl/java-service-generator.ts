import {CodeTypeEnum, CrudGenerator} from "../generator";
import {EnumItem} from "@shared/shared";
import {FieldTypeForeignList, Model, Module} from "../../model.model";
import * as format from 'date-fns/format';
import {
  getFieldTypeJava,
  getFkMap,
  getFkMapOfOther,
  getModel,
  isForeignOfOther,
  isMany2ManyOnly
} from "../../model.helper";

export class JavaServiceGenerator extends CrudGenerator {

  protected getType(module?: Module, models?: Model[], model?: Model): EnumItem {
    return CodeTypeEnum.JAVA_SERVICE;
  }

  protected createFileDirectory(module?: Module, models?: Model[], model?: Model): string {
    return `${this.project.nameDirectory}-web/src/main/java/${this.project.packageDirectory}` +
      `/service/${module.package}/`;
  }

  protected createFileName(module?: Module, models?: Model[], model?: Model): string {
    return `${module.name}Service`;
  }

  protected createFileExtension(module?: Module, models?: Model[], model?: Model): string {
    return "java";
  }

  public createCodeStart(module?: Module, models?: Model[], model?: Model): string {
    return `package ${this.project.package}.service.${module.package};

${this.createCodeImportDTO(models)}

import java.util.List;
import ${this.project.packageCommon}.domain.PageList;

/**
 * ${module.comment}服务
 *
 * @author ${this.project.authorName}
 * @date ${format(new Date(), 'YYYY-MM-DD HH:mm:ss')}
 */
public interface ${module.name}Service {
`;
  }


  protected createCodeImportDTO(models?: Model[], model?: Model) {
    const map = {};
    models.forEach((item) => {
      const module = this.project.moduleMap[item.moduleName].module;
      map[`${item.name}${item.enum ? 'Enum' : 'DTO'}`] = `import ${this.project.package}.dto.${module.package}.${item.name}${item.enum ? 'Enum' : 'DTO'};
`;
      if (!isMany2ManyOnly(item)) {
        map[`${item.name}SearchParam`] = `import ${this.project.package}.dto.${module.package}.${item.name}SearchParam;
`;
      }
      item.fields.filter(field => FieldTypeForeignList.indexOf(field.type) > -1).forEach(field => {
        const fModel = getModel(this.project.modelMap, field.typeData);
        const fModule = this.project.moduleMap[fModel.moduleName].module;
        map[`${fModel.name}${fModel.enum ? 'Enum' : 'DTO'}`] = `import ${this.project.package}.dto.${fModule.package}.${fModel.name}${fModel.enum ? 'Enum' : 'DTO'};
`;
      });
    });
    return Object.values(map).join("");
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
     *
     * @param ${model.nameCamel} ${model.comment}对象
     */
    void add${model.name}(${model.name}DTO ${model.nameCamel});
`;
  }

  protected createCodeUpdate(module?: Module, models?: Model[], model?: Model): string {
    if (isMany2ManyOnly(model)) {
      return '';
    }
    return `
    /**
     * 更新${model.comment}
     *
     * @param ${model.nameCamel} ${model.comment}对象
     */
    void update${model.name}(${model.name}DTO ${model.nameCamel});
`;
  }

  protected createCodeDelete(module?: Module, models?: Model[], model?: Model): string {
    const fields = model.fields.filter((field) => field.pk);
    const paramStr = fields.map((field) => `${getFieldTypeJava(field, model, this.project.modelMap)} ${field.nameCamel}`).join(", ");
    const noteStr = fields.map((field) => `     * @param ${field.nameCamel} ${field.comment}`).join("\n");
    return `
    /**
     * 删除${model.comment}
     *
${noteStr}
     */
    void delete${model.name}(${paramStr});
`;
  }

  protected createCodeReadGet(module?: Module, models?: Model[], model?: Model): string {
    const fieldsPk = model.fields.filter((field) => field.pk);
    const paramStr = fieldsPk.map((field) => `${getFieldTypeJava(field, model, this.project.modelMap)} ${field.nameCamel}`).join(", ");
    const noteStr = fieldsPk.map((field) => `     * @param ${field.nameCamel} ${field.comment}`).join("\n");
    return `
     /**
     * 获取${model.comment}对象
     *
${noteStr}
     * @return ${model.comment}对象
     */
    ${model.name}DTO get${model.name}(${paramStr});
`;
  }


  protected createCodeReadSearch(module?: Module, models?: Model[], model?: Model): string {
    if (isMany2ManyOnly(model)) {
      return '';
    }

    return `
     /**
     * 分页搜索${model.comment}对象集合
     *
     * @param param ${model.comment}分页搜索参数
     * @return ${model.comment}对象分页集合
     */
    PageList<${model.name}DTO> search${model.name}(${model.name}SearchParam param);
`;
  }

  protected createCodeReadList(module?: Module, models?: Model[], model?: Model): string {
    if (!isForeignOfOther(this.project.models, model)) {
      return '';
    }

    return `
     /**
     * 列出${model.comment}对象集合(用于选择)
     *
     * @return ${model.comment}对象集合
     */
    List<${model.name}DTO> list${model.name}();
`;
  }


  protected createCodeReadListByFk(module?: Module, models?: Model[], model?: Model): string {
    if (isMany2ManyOnly(model)) {
      return '';
    }
    const needList = isForeignOfOther(this.project.models, model);
    const methods = [];
    const fkMap = getFkMap(model, this.project.modelMap);
    Object.values(fkMap).forEach(fkItem => {
      const fieldsFk = fkItem.fkFields;
      const modelFk = fkItem.model;
      const paramStr = fieldsFk.map((field) => `${getFieldTypeJava(field, model, this.project.modelMap)} ${field.nameCamel}`).join(", ");
      const noteStr = fieldsFk.map((field) => `     * @param ${field.nameCamel} ${field.comment}`).join("\n");

      if (needList && fkItem.model.moduleName === module.name) {
        methods.push(`
     /**
     * 列出${modelFk.comment}的${model.comment}对象集合${fkItem.name ? `(${fkItem.comment})` : ''}(用于级联选择)
     *
${noteStr}
     * @return ${model.comment}对象集合
     */
    List<${model.name}DTO> list${model.name}For${modelFk.name}${fkItem.name}(${paramStr});
    `);
      }

      methods.push(`
     /**
     * 检查${modelFk.comment}是否存在${model.comment}对象${fkItem.name ? `(${fkItem.comment})` : ''}
     *
${noteStr}
     * @return 是否存在${model.comment}对象
     */
    Boolean has${model.name}For${modelFk.name}${fkItem.name}(${paramStr});
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
    Object.values(fkMap).filter(fkItem => !!fkItem.m2mItem).forEach(fkItem => {

      const fieldsPk = model.fields.filter(field => field.pk);
      const modelFk = fkItem.model;
      const paramStr = fieldsPk.map((field) => `${getFieldTypeJava(field, model, this.project.modelMap)} ${field.nameCamel}`).join(", ");
      const noteStr = fieldsPk.map((field) => `     * @param ${field.nameCamel} ${field.comment}`).join("\n");

      if (fkItem.m2mItem.model.moduleName === module.name) {
        methods.push(`
     /**
     * 列出${model.comment}的${modelFk.comment}对象集合${fkItem.name ? `(${fkItem.comment})` : ''}(多对多列表)
     *
${noteStr}
     * @return ${modelFk.comment}对象集合
     */
    List<${modelFk.name}DTO> list${modelFk.name}For${model.name}${fkItem.name}(${paramStr});
    `);

        methods.push(`
     /**
     * 检查${model.comment}是否存在${modelFk.comment}对象${fkItem.name ? `(${fkItem.comment})` : ''}
     *
${noteStr}
     * @return 是否存在${modelFk.comment}对象
     */
    Boolean has${modelFk.name}For${model.name}${fkItem.name}(${paramStr});
`);

        // 多对多对面的模型，如果不在同一个模块内，将在多对多关系模型所在的模块内生成检验存在的代码
        if (fkItem.m2mItem.model.moduleName !== modelFk.moduleName) {
          const fieldsFkPk = model.fields.filter(field => field.pk);
          const paramStrHas2 = fieldsFkPk.map((field) => `${getFieldTypeJava(field, model, this.project.modelMap)} ${field.nameCamel}`).join(", ");
          const noteStrHas2 = fieldsFkPk.map((field) => `     * @param ${field.nameCamel} ${field.comment}`).join("\n");

          methods.push(`
     /**
     * 检查${modelFk.comment}是否存在${model.comment}对象${fkItem.name ? `(${fkItem.comment})` : ''}
     *
${noteStrHas2}
     * @return 是否存在${model.comment}对象
     */
    Boolean has${model.name}For${modelFk.name}${fkItem.name}(${paramStrHas2});
`);
        }
      }
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
      const setFields = model.fields.filter((field) => field.pk);
      const paramSetStr = setFields.map((field) => `${getFieldTypeJava(field, model, this.project.modelMap)} ${field.nameCamel}`).join(", ");
      const noteStr = setFields.map((field) => `     * @param ${field.nameCamel} ${field.comment}`).join("\n");

      code += `

    /**
     * 设置${model.comment}的${fkModel.comment}列表${fkItem.name ? `(${fkItem.comment})` : ''}
     *
${noteStr}
     * @param ${fkModel.nameCamel}List ${fkModel.comment}列表
     */
    void set${fkModel.name}ListFor${model.name}${fkItem.name}(${paramSetStr}, List<${fkModel.name}DTO> ${fkModel.nameCamel}List);
`;

    });
    return code;
  }


}
