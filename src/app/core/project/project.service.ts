import {Injectable, Injector} from '@angular/core';
import {Observable, of} from "rxjs";
import {map, mergeMap} from "rxjs/operators";
import {_HttpClient, BaseApi, BaseUrl, Body, DELETE, GET, Path, Payload, POST, PUT} from "@delon/theme";
import {ProjectDTO, ProjectSearchParam, ProjectUserDTO} from "@core/project/project.model";
import {UserDTO} from "@core/user/user.model";

import {createArray, createPageList, PageList} from "@shared/shared.model";
import {CacheService} from "@delon/cache";

const BASE_URL = "/project";

/**
 * 项目服务
 */
@Injectable({providedIn: 'root'})
@BaseUrl(BASE_URL)
export class ProjectService extends BaseApi {

    constructor(protected injector: Injector, private cacheService: CacheService, private http: _HttpClient) {
        super(injector);
    }


    /**
     * 添加项目
     */
    @POST("/project")
    addProject(@Body project: ProjectDTO): Observable<void> {
        return;
    }

    /**
     * 更新项目
     */
    @PUT("/project/:id")
    updateProject(@Path('id') id: string, @Body project: ProjectDTO): Observable<void> {
        return;
    }


    /**
     * 设置项目的用户列表
     */
    @PUT("/project/:id/user-list")
    setUserListForProject(@Path('id') id: string, @Body userList: UserDTO[]): Observable<void> {
        return;
    }

    /**
     * 删除项目
     */
    @DELETE("/project/:id")
    deleteProject(@Path('id') id: string): Observable<void> {
        return;
    }

    /**
     * 获取项目对象
     */
    getProject(id: string): Observable<ProjectDTO> {
        return this.cacheService.tryGet(`Project:${id}`,
            of(null).pipe(mergeMap(() => this._getProject(id).pipe(map((data) => new ProjectDTO(data))))));
    }

    @GET("/project/:id")
    _getProject(@Path('id') id: string): Observable<any> {
        return;
    }

    /**
     * 列出项目对象集合
     */
    listProject(): Observable<any> {
        return this.cacheService.tryGet(`ProjectList`,
            of(null).pipe(mergeMap(() => this._listProject().pipe(map((data) => createArray(data, ProjectDTO))))));
    }

    @GET("/project/list")
    _listProject(): Observable<any> {
        return;
    }

    /**
     * 列出项目的用户对象集合
     */
    listUserForProject(id: string): Observable<UserDTO[]> {
        return this.cacheService.tryGet(`UserListForProject:${id}`,
            of(null).pipe(mergeMap(() => this._listUserForProject(id).pipe(map((data) => createArray(data, UserDTO))))));
    }

    @GET("/project/:id/user/list")
    _listUserForProject(@Path('id') id: string): Observable<any> {
        return;
    }

    /**
     * 分页搜索项目对象集合
     */
    searchProject(param: ProjectSearchParam): Observable<PageList<ProjectDTO>> {
        return this._searchProject(param).pipe(map((data) => createPageList(data, ProjectDTO)));
    }

    @GET("/project/search")
    _searchProject(@Payload param: ProjectSearchParam): Observable<any> {
        return;
    }

    /**
     * 分页搜索项目对象集合
     */
    searchProjectMine(param: ProjectSearchParam): Observable<PageList<ProjectDTO>> {
        return this._searchProjectMine(param).pipe(map((data) => createPageList(data, ProjectDTO)));
    }

    @GET("/project/mine/search")
    _searchProjectMine(@Payload param: ProjectSearchParam): Observable<any> {
        return;
    }

    /**
     * 添加项目用户
     */
    @POST("/project-user")
    addProjectUser(@Body projectUser: ProjectUserDTO): Observable<void> {
        return;
    }

    /**
     * 删除项目用户
     */
    @DELETE("/project-user/:projectId/:userId")
    deleteProjectUser(@Path('projectId') projectId: string, @Path('userId') userId: string): Observable<void> {
        return;
    }

    /**
     * 获取项目用户对象
     */
    getProjectUser(projectId: string, userId: string): Observable<ProjectUserDTO> {
        return this.cacheService.tryGet(`ProjectUser:${projectId}:${userId}`,
            of(null).pipe(mergeMap(() => this._getProjectUser(projectId, userId).pipe(map((data) => new ProjectUserDTO(data))))));
    }

    @GET("/project-user/:projectId/:userId")
    _getProjectUser(@Path('projectId') projectId: string, @Path('userId') userId: string): Observable<any> {
        return;
    }


    @PUT("/project/:id/check-out")
    checkOutProject(@Path('id') id: string): Observable<void> {
        return;
    }

    @PUT("/project/:id/check-in")
    checkInProject(@Path('id') id: string, @Body project: ProjectDTO): Observable<void> {
        return;
    }
}
