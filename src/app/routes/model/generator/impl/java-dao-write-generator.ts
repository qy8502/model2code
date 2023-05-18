import {CodeTypeEnum, CrudGenerator} from "../generator";
import {EnumItem} from "@shared/shared";
import * as format from 'date-fns/format';
import {FieldTypeForeignList, FieldTypeValueForeignList, Model, Module} from "../../model.model";
import {
  getField,
  getFieldTypeJava,
  getFkMap,
  getFkMapOfOther,
  getModel,
  isForeignOfOther,
  isMany2ManyOnly
} from "../../model.helper";

export class JavaDaoWriteGenerator extends CrudGenerator {

  protected getType(): EnumItem {
    return CodeTypeEnum.JAVA_DAO;
  }

  protected createFileDirectory(module?: Module, models?: Model[], model?: Model): string {
    return `${this.project.nameDirectory}-web/src/main/java/${this.project.packageDirectory}` +
      `/dao/write/${module.package}/`;
  }

  protected createFileName(module?: Module, models?: Model[], model?: Model): string {
    return `${module.name}DAO`;
  }

  protected createFileExtension(module?: Module, models?: Model[], model?: Model): string {
    return "java";
  }

  public createCodeStart(module?: Module, models?: Model[], model?: Model): string {
    return `package ${this.project.package}.dao.write.${module.package};

${this.createCodeImportDTO(models)}
import org.apache.ibatis.annotations.*;

import java.util.List;

/**
 * ${module.comment}数据访问映射(写库/主库)
 *
 * @author ${this.project.authorName}
 * @date ${format(new Date(), 'YYYY-MM-DD HH:mm:ss')}
 */
public interface ${module.name}DAO {

  // 作为主库Sql映射，不仅仅有写语句，所有涉及事务的查询也需要放在此处。
  // 有缓存的读取数据也要源于主库，防止读写同步时间差造成的缓存问题
`;
  }


  protected createCodeImportDTO(models?: Model[], model?: Model) {
    const map = {};
    models.forEach((item) => {
      const module = this.project.moduleMap[item.moduleName].module;
      map[`${item.name}${item.enum ? 'Enum' : 'DTO'}`] = `import ${this.project.package}.dto.${module.package}.${item.name}${item.enum ? 'Enum' : 'DTO'};
`;
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
    const fields = model.fields.filter((field) => FieldTypeValueForeignList.indexOf(field.type) < 0 && field.name !== 'Deleted');

    const fieldsPk = fields.filter((field) => field.pk);
    const fieldsNotPk = fields.filter((field) => !field.pk);


    // 自动过滤null值(留着别删)
    // let tableSql = fieldsPk.map((field) => `\`${field.nameCamel}\``).join(", ");
    // tableSql += fieldsNotPk.filter((field) => field.name !== 'Deleted').map((field) =>
    //   `<if test=\\"${field.nameCamel} != null\\">, \`${field.nameCamel}\`</if>`).join('');
    //
    // let valuesSql = fieldsPk.map((field) => `#{${field.nameCamel}}`).join(", ");
    // valuesSql += fieldsNotPk.filter((field) => field.name !== 'Deleted').map((field) =>
    //   `<if test=\\"${field.nameCamel} != null\\">, #{${field.nameCamel}}</if>`).join('');
    //
    // let updateSql = fieldsPk.map((field) => `\`${field.nameCamel}\`=\`${field.nameCamel}\``).join(", ");
    // updateSql += fieldsNotPk.map((field) => `<if test=\\"${field.nameCamel} != null\\">, \`${field.nameCamel}\`=VALUES(\`${field.nameCamel}\`)</if>`).join('');

    const tableSql = fields.map((field) => `\`${field.nameCamel}\``).join(", ");
    const valuesSql = fields.map((field) => `#{${field.nameCamel}}`).join(", ");
    const updateSql = (fieldsNotPk.length > 0 ? fieldsNotPk : fields).map((field) => `\`${field.nameCamel}\`=VALUES(\`${field.nameCamel}\`)`).join(", ");


    let code = `

    /**
     * 添加${model.comment}
     *
     * @param ${model.nameCamel} ${model.comment}对象
     */
    @Insert("INSERT INTO \`${model.tableName}\`(${tableSql}) " +
            "VALUES(${valuesSql}) ") // +
//            "ON DUPLICATE KEY UPDATE ${updateSql}" + "")
    void add${model.name}(${model.name}DTO ${model.nameCamel});
`;

    // 如果是关系表，需要批量添加
    if (isMany2ManyOnly(model)) {
      const valuesBatchSql = fields.map((field) => `#{item.${field.nameCamel}}`).join(", ");
      code += `

    /**
     * 批量添加${model.comment}
     *
     * @param list 一批${model.comment}对象
     */
    @Insert("<script>" +
            "INSERT INTO \`${model.tableName}\`(${tableSql}) " +
            "VALUES " +
            "<foreach collection=\\"list\\" separator=\\",\\" item=\\"item\\" index=\\"i\\"> " +
            " (${valuesBatchSql})" +
            "</foreach> " +
//            "ON DUPLICATE KEY UPDATE ${updateSql})" +
            "</script>")
    void add${model.name}Batch(@Param("list") List<${model.name}DTO> list);
`
    }

    return code;

  }

  protected createCodeUpdate(module?: Module, models?: Model[], model?: Model): string {
    if (isMany2ManyOnly(model)) {
      return '';
    }

    const fields = model.fields.filter((field) => FieldTypeValueForeignList.indexOf(field.type) < 0);
    const fieldsNotPk = fields.filter((field) => !field.pk);
    const setSql = (fieldsNotPk.length > 0 ? fieldsNotPk : fields)
      .filter((field) => ['Deleted', 'CreatedTime', 'Creator', 'CreatorName'].indexOf(field.name) < 0)
      .map((field) => `\`${field.nameCamel}\`=#{${field.nameCamel}}`).join(", ");
    const whereSql = fields.filter((field) => field.pk).map((field) => `\`${field.nameCamel}\`=#{${field.nameCamel}}`).join(" AND ");
    return `

    /**
     * 更新${model.comment}
     *
     * @param ${model.nameCamel} ${model.comment}对象
     */
    @Update("UPDATE \`${model.tableName}\` " +
            "SET ${setSql} " +
            "WHERE ${whereSql}")
    void update${model.name}(${model.name}DTO ${model.nameCamel});
`;
  }

  protected createCodeDelete(module?: Module, models?: Model[], model?: Model): string {
    const fields = model.fields.filter((field) => field.pk);
    const whereSql = fields.map((field) => `\`${field.nameCamel}\`=#{${field.nameCamel}}`).join(" AND ");
    const paramStr = fields.map((field) => `@Param("${field.nameCamel}") ${getFieldTypeJava(field, model, this.project.modelMap)} ${field.nameCamel}`).join(", ");
    const noteStr = fields.map((field) => `     * @param ${field.nameCamel} ${field.comment}`).join("\n");

    const deleteSql = model.fields.some(field => field.name === 'Deleted') ?
      `UPDATE \`${model.tableName}\` SET \`deleted\` = 1 ` :
      `DELETE FROM \`${model.tableName}\``;

    let code = `
    /**
     * 删除${model.comment}
     *
${noteStr}
     */
    @Delete("${deleteSql} " +
            "WHERE ${whereSql}")
    void delete${model.name}(${paramStr});
`;

    const fkMap = getFkMap(model, this.project.modelMap);
    Object.values(fkMap).forEach(fkItem => {
      const fieldsFk = fkItem.fkFields;
      if (fieldsFk.every(field => field.pk) && fieldsFk.length < fields.length) {
        const whereFkSql = fieldsFk.map((field) => `\`${field.nameCamel}\`=#{${field.nameCamel}}`).join(" AND ");
        const paramFkName = fieldsFk.map((field) => `${field.name}`).join("And");
        const paramFkStr = fieldsFk.map((field) => `@Param("${field.nameCamel}") ${getFieldTypeJava(field, model, this.project.modelMap)} ${field.nameCamel}`).join(", ");
        const noteFkStr = fieldsFk.map((field) => `     * @param ${field.nameCamel} ${field.comment}`).join("\n");
        const noteFkByStr = fieldsFk.map((field) => `${field.comment}`).join("和");

        const deleteBySql = model.fields.some(field => field.name === 'Deleted') ?
          `UPDATE \`${model.tableName}\` SET \`deleted\` = 1 ` :
          `DELETE FROM \`${model.tableName}\``;
        code += `

    /**
     * 根据${noteFkByStr}删除全部${model.comment}
     *
${noteFkStr}
     */
    @Delete("${deleteBySql} WHERE ${whereFkSql}")
    void delete${model.name}By${paramFkName}(${paramFkStr});
`;
      }
    });
    return code;
  }

  protected createCodeReadGet(module?: Module, models?: Model[], model?: Model): string {
    const fields = model.fields.filter((field) => FieldTypeValueForeignList.indexOf(field.type) < 0);
    const tableSql = fields.map((field) => `\`${field.nameCamel}\``).join(", ");
    const fieldsPk = model.fields.filter((field) => field.pk);
    const whereSql = fieldsPk.map((field) => `\`${field.nameCamel}\`=#{${field.nameCamel}}`).join(" AND ");
    const paramStr = fieldsPk.map((field) => `@Param("${field.nameCamel}") ${getFieldTypeJava(field, model, this.project.modelMap)} ${field.nameCamel}`).join(", ");
    const noteStr = fieldsPk.map((field) => `     * @param ${field.nameCamel} ${field.comment}`).join("\n");
    const deletedSql = model.fields.some(field => field.name === 'Deleted') ? " AND `deleted`=0 " : '';
    return `

    /**
     * 获取${model.comment}对象
     *
${noteStr}
     * @return ${model.comment}对象
     */
    @Select("SELECT ${tableSql} " +
            "FROM \`${model.tableName}\` " +
            "WHERE ${whereSql}${deletedSql}")
    ${model.name}DTO get${model.name}(${paramStr});
`;
  }

  protected createCodeReadSearch(module?: Module, models?: Model[], model?: Model): string {
    return '';
  }

  protected createCodeReadList(module?: Module, models?: Model[], model?: Model): string {
    if (!isForeignOfOther(this.project.models, model)) {
      return '';
    }

    const fields = model.fields.filter((field) => FieldTypeValueForeignList.indexOf(field.type) < 0);
    const tableSql = fields.map((field) => `\`${field.nameCamel}\``).join(", ");

    const deletedSql = model.fields.some(field => field.name === 'Deleted') ? ' WHERE `deleted` = 0 ' : '';

    return `
    /**
     * 列出${model.comment}对象集合(用于选择)
     *
     * @return ${model.comment}对象集合
     */
    @Select("SELECT ${tableSql} " +
            "FROM \`${model.tableName}\` ${deletedSql}" )
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

      const fields = model.fields.filter((field) => FieldTypeValueForeignList.indexOf(field.type) < 0);
      const tableSql = fields.map((field) => `\`${field.nameCamel}\``).join(", ");

      const whereSql = fieldsFk.map((field) => `\`${field.nameCamel}\`=#{${field.nameCamel}}`).join(" AND ");
      const paramStr = fieldsFk.map((field) => `@Param("${field.nameCamel}") ${getFieldTypeJava(field, model, this.project.modelMap)} ${field.nameCamel}`).join(", ");
      const noteStr = fieldsFk.map((field) => `     * @param ${field.nameCamel} ${field.comment}`).join("\n");

      const deletedSql = model.fields.some(field => field.name === 'Deleted') ?
        'AND `deleted` = 0 ' : '';

      if (needList && fkItem.model.moduleName === module.name) {
        methods.push(`
    /**
     * 列出${modelFk.comment}的${model.comment}对象集合${fkItem.name ? `(${fkItem.comment})` : ''}(用于级联选择)
     *
${noteStr}
     * @return ${model.comment}对象集合
     */
    @Select("SELECT ${tableSql} " +
            "FROM \`${model.tableName}\` " +
            "WHERE ${whereSql} ${deletedSql}")
    List<${model.name}DTO> list${model.name}For${modelFk.name}${fkItem.name}(${paramStr});
        `);
      }

      methods.push(`
    /**
     * 检查${modelFk.comment}是否存在${model.comment}对象${fkItem.name ? `(${fkItem.comment})` : ''}
     *
${noteStr}
     * @return 是否${model.comment}存在对象
     */
    @Select("SELECT IFNULL((SELECT 1 " +
            "FROM \`${model.tableName}\` " +
            "WHERE ${whereSql} ${deletedSql} LIMIT 1),0)")
    boolean has${model.name}For${modelFk.name}${fkItem.name}(${paramStr});
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

      const fieldsFk = fkItem.fkFields;
      const fieldsPk = model.fields.filter(field => field.pk);
      const modelFk = fkItem.model;
      const modelM2m = fkItem.m2mItem.model;
      const fields = modelFk.fields.filter((field) => FieldTypeValueForeignList.indexOf(field.type) < 0);
      const tableSql = fields.map((field) => (fkItem ? `\`${fkItem.alias}\`.` : '') + `\`${field.nameCamel}\``).join(", ");


      const joinSql = `
            "JOIN \`${modelM2m.tableName}\` \`${fkItem.m2mItem.alias}\` ON ` + fieldsFk.map((field) =>
        `\`${fkItem.alias}\`.\`${getField(modelFk, field.typeData).nameCamel}\`=\`${fkItem.m2mItem.alias}\`.${field.nameCamel}`
      ).join(" AND ") + ' " + ';
      const whereSql = fkItem.m2mItem.fkFields.map((field) => `\`${fkItem.m2mItem.alias}\`.\`${field.nameCamel}\`=#{${field.nameCamel}}`).join(" AND ");
      const paramStr = fkItem.m2mItem.fkFields.map((field) => `@Param("${field.nameCamel}") ${getFieldTypeJava(field, model, this.project.modelMap)} ${field.nameCamel}`).join(", ");
      const noteStr = fkItem.m2mItem.fkFields.map((field) => `     * @param ${field.nameCamel} ${field.comment}`).join("\n");

      const deletedSql = modelFk.fields.some(field => field.name === 'Deleted') ?
        'AND \`\${fkItem.alias}\`.`deleted` = 0 ' : '';

      if (fkItem.m2mItem.model.moduleName === module.name) {
        methods.push(`
    /**
     * 列出${model.comment}的${modelFk.comment}对象集合${fkItem.name ? `(${fkItem.comment})` : ''}(多对多列表)
     *
${noteStr}
     * @return ${modelFk.comment}对象集合
     */
    @Select("SELECT ${tableSql} " +
            "FROM \`${modelFk.tableName}\` \`${fkItem.alias}\` " + ${joinSql}
            "WHERE ${whereSql} ${deletedSql}")
    List<${modelFk.name}DTO> list${modelFk.name}For${model.name}${fkItem.name}(${paramStr});
        `);


        const whereSqlHas = fkItem.m2mItem.fkFields.map((field) => `\`${field.nameCamel}\`=#{${field.nameCamel}}`).join(" AND ");

        methods.push(`
    /**
     * 检查${model.comment}是否存在${modelFk.comment}对象${fkItem.name ? `(${fkItem.comment})` : ''}
     *
${noteStr}
     * @return 是否${modelFk.comment}存在对象
     */
    @Select("SELECT IFNULL((SELECT 1 " +
            "FROM \`${modelM2m.tableName}\` " +
            "WHERE ${whereSqlHas} LIMIT 1),0)")
    boolean has${modelFk.name}For${model.name}${fkItem.name}(${paramStr});
`);

        // 多对多对面的模型，如果不在同一个模块内，将在多对多关系模型所在的模块内生成检验存在的代码
        if (fkItem.m2mItem.model.moduleName !== modelFk.moduleName) {

          const whereSqlHas2 = fkItem.fkFields.map((field) => `\`${field.nameCamel}\`=#{${field.nameCamel}}`).join(" AND ");
          const paramStrHas2 = fkItem.fkFields.map((field) => `@Param("${field.nameCamel}") ${getFieldTypeJava(field, model, this.project.modelMap)} ${field.nameCamel}`).join(", ");
          const noteStrHas2 = fkItem.fkFields.map((field) => `     * @param ${field.nameCamel} ${field.comment}`).join("\n");

          methods.push(`
    /**
     * 检查${modelFk.comment}是否存在${model.comment}对象${fkItem.name ? `(${fkItem.comment})` : ''}
     *
${noteStrHas2}
     * @return 是否${model.comment}存在对象
     */
    @Select("SELECT IFNULL((SELECT 1 " +
            "FROM \`${modelM2m.tableName}\` " +
            "WHERE ${whereSqlHas2} LIMIT 1),0)")
    boolean has${model.name}For${modelFk.name}${fkItem.name}(${paramStrHas2});
`);

        }
      }
    });


    return methods.join("\n");
  }

  protected createCodeSetM2m(module?: Module, models?: Model[], model?: Model): string {
    return "";
  }


}
