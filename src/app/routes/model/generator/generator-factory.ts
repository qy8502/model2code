import {Code, CodeTypeEnum, CodeTypeList, Generator} from "./generator";
import {Injectable, Type} from "@angular/core";
import {Project} from "../model.model";
import {DatabaseGenerator} from "./impl/database-generator";
import {JavaDtoGenerator} from "./impl/java-dto-generator";
import {JavaServiceGenerator} from "./impl/java-service-generator";
import {JavaDaoReadGenerator} from "./impl/java-dao-read-generator";
import {JavaDaoWriteGenerator} from "./impl/java-dao-write-generator";
import {JavaServiceImplGenerator} from "./impl/java-service-impl-generator";
import {JavaWebControllerGenerator} from "./impl/java-web-controller-generator";
import {JavaDtoSearchParamGenerator} from "./impl/java-dto-search-param-generator";
import {JavaDtoSearchParamBaseGenerator} from "./impl/java-dto-search-param-base-generator";
import {NgModelTsGenerator} from "./impl/ng-model-ts-generator";
import {NgSharedModelTsGenerator} from "./impl/ng-shared-model-ts-generator";
import {NgServiceTsGenerator} from "./impl/ng-service-ts-generator";
import {NgComponentListTsGenerator} from "./impl/ng-component-list-ts-generator";
import {NgComponentListHtmlGenerator} from "./impl/ng-component-list-html-generator";
import {NgComponentEditTsGenerator} from "./impl/ng-component-edit-ts-generator";
import {NgComponentEditHtmlGenerator} from "./impl/ng-component-edit-html-generator";
import {NgModuleTsGenerator} from "./impl/ng-module-ts-generator";
import {NgRoutingModuleTsGenerator} from "./impl/ng-routing-module-ts-generator";
import {NgAppDataJsonGenerator} from "./impl/ng-app-data-json-generator";
import {JavaConstantPermissionGenerator} from "./impl/java-constant-permission-generator";
import {DatabasePermissionGenerator} from "./impl/database-permission-generator";
import {JavaConstantBaseRoleGenerator} from "./impl/java-constant-base-role-generator";
import {NgConstantBaseRoleGenerator} from "./impl/ng-constant-base-role-generator";
import {NgConstantPermissionGenerator} from "./impl/ng-constant-permission-generator";
import {JavaEnumGenerator} from "./impl/java-enum-generator";
import {NgSharedJsonSchemaHelperTsGenerator} from "./impl/ng-shared-json-schema-helper-ts-generator";
import {JavaConstantCacheKeyGenerator} from "./impl/java-constant-cache-key-generator";
import {NgComponentSetM2mHtmlGenerator} from "./impl/ng-component-set-m2m-html-generator";
import {NgComponentSetM2mTsGenerator} from "./impl/ng-component-set-m2m-ts-generator";


@Injectable()
export class GeneratorFactory {

  constructor() {

  }

  public generateAll(project: Project): Code[] {
    let codes: Code[] = [];
    CodeTypeList.forEach((codeType) => {
      this.mapGenerators(codeType.value).forEach((OneGenerator) => {
        const generator = new OneGenerator(project);
        codes = codes.concat(generator.generate());
      })
    });
    return codes;
  }

  public mapGenerators(codeType: string): Type<Generator>[] {
    switch (codeType) {
      case CodeTypeEnum.DATABASE.value:
        return [DatabaseGenerator, DatabasePermissionGenerator];
      case CodeTypeEnum.JAVA_DAO.value:
        return [JavaDaoReadGenerator, JavaDaoWriteGenerator];
      case CodeTypeEnum.JAVA_DTO.value:
        return [JavaDtoGenerator, JavaDtoSearchParamBaseGenerator, JavaDtoSearchParamGenerator, JavaEnumGenerator];
      case CodeTypeEnum.JAVA_SERVICE.value:
        return [JavaServiceGenerator, JavaServiceImplGenerator, JavaConstantCacheKeyGenerator];
      case CodeTypeEnum.JAVA_WEB.value:
        return [JavaWebControllerGenerator, JavaConstantPermissionGenerator, JavaConstantBaseRoleGenerator];
      case CodeTypeEnum.NG.value:
        return [NgComponentListTsGenerator, NgComponentListHtmlGenerator,
          NgComponentEditTsGenerator, NgComponentEditHtmlGenerator, NgComponentSetM2mHtmlGenerator, NgComponentSetM2mTsGenerator,
          NgModuleTsGenerator, NgRoutingModuleTsGenerator,
          NgModelTsGenerator, NgServiceTsGenerator, NgSharedModelTsGenerator, NgSharedJsonSchemaHelperTsGenerator, NgAppDataJsonGenerator,
          NgConstantBaseRoleGenerator, NgConstantPermissionGenerator];

    }

  }

}
