import {CodeTypeEnum, CrudGenerator} from "../generator";
import {EnumItem} from "@shared/shared";
import * as format from 'date-fns/format';
import {FieldTypeForeignList, FieldTypeLikeList, FieldTypeValueForeignList, Model, Module} from "../../model.model";
import {getField, getFkMap, getModel, isMany2ManyOnly} from "../../model.helper";

export class JavaDaoReadGenerator extends CrudGenerator {

  protected getType(): EnumItem {
    return CodeTypeEnum.JAVA_DAO;
  }

  protected createFileDirectory(module?: Module, models?: Model[], model?: Model): string {
    return `${this.project.nameDirectory}-web/src/main/java/${this.project.packageDirectory}` +
      `/dao/read/${module.package}/`;
  }

  protected createFileName(module?: Module, models?: Model[], model?: Model): string {
    return `${module.name}ReadDAO`;
  }

  protected createFileExtension(module?: Module, models?: Model[], model?: Model): string {
    return "java";
  }

  public createCodeStart(module?: Module, models?: Model[], model?: Model): string {
    return `package ${this.project.package}.dao.read.${module.package};

${this.createCodeImportDTO(models)}
import org.apache.ibatis.annotations.*;

import java.util.List;

/**
 * ${module.comment}数据访问(读库)
 *
 * @author ${this.project.authorName}
 * @date ${format(new Date(), 'YYYY-MM-DD HH:mm:ss')}
 */
public interface ${module.name}ReadDAO {
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
    return '';
  }

  protected createCodeUpdate(module?: Module, models?: Model[], model?: Model): string {
    return '';
  }

  protected createCodeDelete(module?: Module, models?: Model[], model?: Model): string {
    return '';
  }


  protected createCodeReadGet(module?: Module, models?: Model[], model?: Model): string {
    return '';
  }

  protected createCodeReadSearch(module?: Module, models?: Model[], model?: Model): string {
    if (isMany2ManyOnly(model)) {
      return '';
    }
    const fkMap = getFkMap(model, this.project.modelMap);
    const ffMapItems = Object.values(fkMap).filter(item => item.ffFields.length > 0);


    const fields = model.fields.filter((field) => FieldTypeValueForeignList.indexOf(field.type) < 0);

    const fieldSelectSqls = fields
      .map((field) => (ffMapItems.length > 0 ? `\`${model.nameAbbrLower}\`.` : '') + `\`${field.nameCamel}\``);
    ffMapItems.forEach(item => fieldSelectSqls.push(...item.ffFields
      .map((field) => `\`${item.alias}\`.\`${getField(item.model, field.typeData).nameCamel}\` \`${field.nameCamel}\``)
    ));

    const tableSql = fieldSelectSqls.join(", ");

    const joinSql = ffMapItems.length > 0 ? ffMapItems.map((item) => ` +
            "JOIN \`${item.model.tableName}\` \`${item.alias}\` ON ` + item.fkFields.map((field) =>
      `\`${model.nameAbbrLower}\`.\`${field.nameCamel}\`=\`${item.alias}\`.` + getField(item.model, field.typeData).nameCamel)
      .join(" AND ") + ' "').join("") : '';

    const fieldSearchSqls = fields.filter((field) => field.search)
      .map((field) => ` +
            "<if test=\\"param.${field.nameCamel} != null \\"> AND ` +
        (ffMapItems.length > 0 ? `\`${model.nameAbbrLower}\`.` : '') + `\`${field.nameCamel}\`` +
        (FieldTypeLikeList.indexOf(field.type) > -1 ? ` LIKE CONCAT('%',#{param.${field.nameCamel}},'%')` : ` = #{param.${field.nameCamel}}`) + ` </if>"`);
    ffMapItems.forEach(item => fieldSearchSqls.push(...item.ffFields.filter((field) => field.search)
      .map((field) => ` +
            "<if test=\\"param.${field.nameCamel} != null \\"> AND \`${item.alias}\`.\`${getField(item.model, field.typeData).nameCamel}\`` +
        (FieldTypeLikeList.indexOf(getField(item.model, field.typeData).type) > -1 ? ` LIKE CONCAT('%',#{param.${field.nameCamel}},'%')` : `=#{param.${field.nameCamel}}`) + ` </if>"`)
    ));

    const deletedField = model.fields.some(field => field.name === 'Deleted');

    const whereSql = fieldSearchSqls.length > 0 ? ` +
            "WHERE ${deletedField ? ((ffMapItems.length > 0 ? `\`${model.nameAbbrLower}\`.` : '') + '`deleted` = 0') : '1=1'} "${fieldSearchSqls.join('')}` : (deletedField ? 'WHERE ' + (ffMapItems.length > 0 ? `\`${model.nameAbbrLower}\`.` : '') + '`deleted` = 0 ' : '');

    const scriptStart = whereSql ? `"<script>" +
            ` : '';
    const scriptEnd = whereSql ? ` +
            "</script>"` : '';

    return `
    /**
     * 分页搜索${model.comment}对象集合
     *
     * @param param ${model.comment}分页搜索参数
     * @return ${model.comment}对象分页集合
     */
    @Select(${scriptStart}"SELECT ${tableSql} " +
            "FROM \`${model.tableName}\`${ffMapItems.length > 0 ? ' `' + model.nameAbbrLower + '`' : ''} "${joinSql}${whereSql}${scriptEnd})
    List<${model.name}DTO> search${model.name}(@Param("param") ${model.name}SearchParam param);
`;
  }

  protected createCodeReadList(module?: Module, models?: Model[], model?: Model): string {
    return '';
  }


  protected createCodeReadListByFk(module?: Module, models?: Model[], model?: Model): string {
    return '';
  }

  protected createCodeReadListByM2m(module?: Module, models?: Model[], model?: Model): string {
    return "";
  }

  protected createCodeSetM2m(module?: Module, models?: Model[], model?: Model): string {
    return "";
  }


}
