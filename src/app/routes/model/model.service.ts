import {Injectable} from "@angular/core";
import {FieldTypeEnum, Model, Project} from "./model.model";
import {createProject, jsonProject} from "./model.helper";
import {Observable, of} from "rxjs";

// const MODELS_STORAGE_KEY = "models";
// const MODELS_TEMP_STORAGE_KEY = "models-temp";
const PROJECT_STORAGE_KEY = "project";
const PROJECT_TEMP_STORAGE_KEY = "project-temp";


@Injectable()
export class ModelService {

  constructor() {
  }


  saveProject(project: Project): Observable<boolean> {
    localStorage.setItem(PROJECT_STORAGE_KEY, jsonProject(project));
    return of(true);
  }


  getProject(): Observable<Project> {

    const project: Project = JSON.parse(localStorage.getItem(PROJECT_STORAGE_KEY) || 'null') || PROJECT_DEMO;
    return of(createProject(project));
  }


  /*  saveModelsTemp(models: Model[]): boolean {
      localStorage.setItem(MODELS_TEMP_STORAGE_KEY, JSON.stringify(models));
      return true;
    }*/

  /*
    getModelsTemp(): Model[] {
      let models: Model[] = JSON.parse(localStorage.getItem(MODELS_TEMP_STORAGE_KEY) || 'null') || null;
      if (models) {
        models = models.map((item) => createModel(item));
      }
      console.log(models);
      return models;
    }*/


  saveProjectTemp(project: Project, projectId?: string): Observable<boolean> {
    localStorage.setItem(projectId ? `${PROJECT_TEMP_STORAGE_KEY}:${projectId}` : PROJECT_TEMP_STORAGE_KEY, jsonProject(project));
    return of(true);
  }

  getProjectTemp(projectId?: string): Observable<Project> {
    const project: Project = JSON.parse(localStorage.getItem(projectId ? `${PROJECT_TEMP_STORAGE_KEY}:${projectId}` : PROJECT_TEMP_STORAGE_KEY) || 'null');
    return of(createProject(project));
  }

}


export const PROJECT_EMPTY = {
  name: "", package: "", models: [] as Model[]
};

export const PROJECT_DEMO = {"name":"model2code","package":"com.pooc2m.model2code","models":[{"fields":[{"name":"Id","comment":"编号","type":"uuid","pk":true,"dbType":"","dbDefault":"''"},{"name":"Name","comment":"姓名","type":"text_name","dbType":"VARCHAR(100)","dbDefault":"''","required":true,"search":true},{"name":"UserName","comment":"用户名","type":"text_name","dbType":"VARCHAR(100)","dbDefault":"''","nn":true,"search":true},{"name":"Password","comment":"密码","type":"text_summary","dbType":"VARCHAR(500)","dbDefault":"''","nn":true},{"name":"AvatarUrl","comment":"头像地址","type":"text_summary","dbType":"VARCHAR(500)","dbDefault":"''","nn":true},{"name":"Email","comment":"邮箱","type":"text_name","dbType":"VARCHAR(100)","dbDefault":"''","nn":true},{"name":"EmailAuthed","comment":"邮箱是否验证","type":"boolean","dbType":"INT(1)","dbDefault":"'0'","nn":true},{"name":"Phone","comment":"手机号码","type":"text_name","dbType":"VARCHAR(100)","dbDefault":"''","nn":true},{"name":"PhoneAuthed","comment":"手机号码是否验证","type":"boolean","dbType":"INT(1)","dbDefault":"'0'"},{"name":"Github","comment":"GithubID","type":"text_name","dbType":"VARCHAR(100)","dbDefault":"''","nn":true},{"name":"CreatedTime","comment":"创建时间","type":"time","dbType":"TIMESTAMP","dbDefault":"CURRENT_TIMESTAMP","nn":true},{"name":"Creator","comment":"创建者","type":"uuid","dbType":"VARCHAR(24)","dbDefault":"''","nn":true},{"name":"UpdatedTime","comment":"更新时间","type":"time","dbType":"TIMESTAMP","dbDefault":"CURRENT_TIMESTAMP","nn":true},{"name":"Updater","comment":"更新者","type":"uuid","dbType":"VARCHAR(24)","dbDefault":"''","nn":true},{"name":"Available","comment":"是否可用","type":"boolean","dbType":"INT(1)","dbDefault":"'1'","nn":true}],"name":"User","comment":"用户","module":""},{"fields":[{"name":"Id","comment":"编号","type":"text_name","dbType":"VARCHAR(100)","dbDefault":"''","pk":true,"required":true},{"name":"Name","comment":"名称","type":"text_name","dbType":"VARCHAR(100)","dbDefault":"''","required":true}],"name":"BaseRole","comment":"基础角色","module":"User"},{"fields":[{"name":"UserId","comment":"用户编号","type":"foreign_key","dbDefault":"","typeData":"User.Id","pk":true,"required":true},{"name":"BaseRoleId","comment":"基础角色编号","type":"foreign_key","dbDefault":"","typeData":"BaseRole.Id","required":true,"pk":true}],"name":"UserBaseRole","comment":"用户与基础角色关系","module":"User"},{"fields":[{"name":"Id","comment":"编号","type":"uuid","dbType":"VARCHAR(24)","dbDefault":"''","nn":true,"pk":true},{"name":"Name","comment":"名称","type":"text_title","dbType":"VARCHAR(200)","dbDefault":"''","nn":true,"required":true,"search":true},{"name":"ProjectUrl","comment":"项目Git地址","type":"text_summary","dbType":"VARCHAR(500)","dbDefault":"''","nn":true},{"name":"Editor","comment":"编辑者","type":"foreign_key","dbDefault":"","typeData":"User.Id","nn":true},{"name":"EditorName","comment":"编辑者","type":"foreign_field","dbDefault":"","typeData":"User.Name"},{"name":"EditorAvatar","comment":"编辑者头像","type":"foreign_field","dbDefault":"","typeData":"User.AvatarUrl"},{"name":"EditingTime","comment":"编辑时间","type":"time","dbType":"TIMESTAMP","dbDefault":"CURRENT_TIMESTAMP"},{"name":"Status","comment":"状态","type":"enum_int","dbType":"INT(4)","dbDefault":"'0'","typeData":"EditingStatus","nn":true},{"name":"Data","comment":"数据","type":"text_content","dbType":"LONGTEXT","dbDefault":"","nn":true}],"name":"Project","comment":"项目","module":""},{"fields":[{"name":"ProjectId","comment":"项目","type":"foreign_key","dbDefault":"","typeData":"Project.Id","pk":true},{"name":"UserId","comment":"用户","type":"foreign_key","dbDefault":"","typeData":"User.Id","nn":true,"pk":true}],"name":"ProjectUser","comment":"项目用户","module":"Project"},{"fields":[],"enum":true,"enumType":"number","enumItems":[{"value":1,"label":"正在编辑","key":"EDITING"},{"value":0,"label":"空闲","key":"FREE"}],"name":"EditingStatus","comment":"编辑状态","module":"Project"}],"modules":[{"name":"User","comment":"用户"},{"name":"Project","comment":"项目"}],"comment":"模型化全栈代码生成工具(演示项目)","packageCommon":"com.pooc2m.common"};
