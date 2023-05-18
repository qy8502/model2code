import {Injectable, Injector} from '@angular/core';
import {Observable, of} from "rxjs";
import {map, mergeMap} from "rxjs/operators";
import {_HttpClient, BaseApi, BaseUrl, Body, DELETE, GET, Path, Payload, POST, PUT} from "@delon/theme";
import {BaseRoleDTO, BaseRoleSearchParam, UserBaseRoleDTO, UserDTO, UserSearchParam} from "@core/user/user.model";

import {createArray, createPageList, PageList} from "@shared/shared.model";
import {CacheService} from "@delon/cache";

const BASE_URL = "/user";

/**
 * 用户服务
 */
@Injectable({providedIn: 'root'})
@BaseUrl(BASE_URL)
export class UserService extends BaseApi {

    constructor(protected injector: Injector, private cacheService: CacheService, private http: _HttpClient) {
        super(injector);
    }


    /**
     * 添加用户
     */
    @POST("/user")
    addUser(@Body user: UserDTO): Observable<void> {
        return;
    }

    /**
     * 更新用户
     */
    @PUT("/user/:id")
    updateUser(@Path('id') id: string, @Body user: UserDTO): Observable<void> {
        return;
    }


    /**
     * 设置用户的基础角色列表
     */
    @PUT("/user/:id/base-role-list")
    setBaseRoleListForUser(@Path('id') id: string, @Body baseRoleList: BaseRoleDTO[]): Observable<void> {
        return;
    }

    /**
     * 删除用户
     */
    @DELETE("/user/:id")
    deleteUser(@Path('id') id: string): Observable<void> {
        return;
    }

    /**
     * 获取用户对象
     */
    getUser(id: string): Observable<UserDTO> {
        return this.cacheService.tryGet(`User:${id}`,
            of(null).pipe(mergeMap(() => this._getUser(id).pipe(map((data) => new UserDTO(data))))));
    }

    @GET("/user/:id")
    _getUser(@Path('id') id: string): Observable<any> {
        return;
    }

    /**
     * 列出用户对象集合
     */
    listUser(): Observable<any> {
        return this.cacheService.tryGet(`UserList`,
            of(null).pipe(mergeMap(() => this._listUser().pipe(map((data) => createArray(data, UserDTO))))));
    }

    @GET("/user/list")
    _listUser(): Observable<any> {
        return;
    }

    /**
     * 列出用户的基础角色对象集合
     */
    listBaseRoleForUser(id: string): Observable<BaseRoleDTO[]> {
        return this.cacheService.tryGet(`BaseRoleListForUser:${id}`,
            of(null).pipe(mergeMap(() => this._listBaseRoleForUser(id).pipe(map((data) => createArray(data, BaseRoleDTO))))));
    }

    @GET("/user/:id/base-role/list")
    _listBaseRoleForUser(@Path('id') id: string): Observable<any> {
        return;
    }

    /**
     * 分页搜索用户对象集合
     */
    searchUser(param: UserSearchParam): Observable<PageList<UserDTO>> {
        return this._searchUser(param).pipe(map((data) => createPageList(data, UserDTO)));
    }

    @GET("/user/search")
    _searchUser(@Payload param: UserSearchParam): Observable<any> {
        return;
    }

    /**
     * 添加基础角色
     */
    @POST("/base-role")
    addBaseRole(@Body baseRole: BaseRoleDTO): Observable<void> {
        return;
    }

    /**
     * 更新基础角色
     */
    @PUT("/base-role/:id")
    updateBaseRole(@Path('id') id: string, @Body baseRole: BaseRoleDTO): Observable<void> {
        return;
    }


    /**
     * 设置基础角色的用户列表
     */
    @PUT("/base-role/:id/user-list")
    setUserListForBaseRole(@Path('id') id: string, @Body userList: UserDTO[]): Observable<void> {
        return;
    }

    /**
     * 删除基础角色
     */
    @DELETE("/base-role/:id")
    deleteBaseRole(@Path('id') id: string): Observable<void> {
        return;
    }

    /**
     * 获取基础角色对象
     */
    getBaseRole(id: string): Observable<BaseRoleDTO> {
        return this.cacheService.tryGet(`BaseRole:${id}`,
            of(null).pipe(mergeMap(() => this._getBaseRole(id).pipe(map((data) => new BaseRoleDTO(data))))));
    }

    @GET("/base-role/:id")
    _getBaseRole(@Path('id') id: string): Observable<any> {
        return;
    }

    /**
     * 列出基础角色对象集合
     */
    listBaseRole(): Observable<any> {
        return this.cacheService.tryGet(`BaseRoleList`,
            of(null).pipe(mergeMap(() => this._listBaseRole().pipe(map((data) => createArray(data, BaseRoleDTO))))));
    }

    @GET("/base-role/list")
    _listBaseRole(): Observable<any> {
        return;
    }

    /**
     * 列出基础角色的用户对象集合
     */
    listUserForBaseRole(id: string): Observable<UserDTO[]> {
        return this.cacheService.tryGet(`UserListForBaseRole:${id}`,
            of(null).pipe(mergeMap(() => this._listUserForBaseRole(id).pipe(map((data) => createArray(data, UserDTO))))));
    }

    @GET("/base-role/:id/user/list")
    _listUserForBaseRole(@Path('id') id: string): Observable<any> {
        return;
    }

    /**
     * 分页搜索基础角色对象集合
     */
    searchBaseRole(param: BaseRoleSearchParam): Observable<PageList<BaseRoleDTO>> {
        return this._searchBaseRole(param).pipe(map((data) => createPageList(data, BaseRoleDTO)));
    }

    @GET("/base-role/search")
    _searchBaseRole(@Payload param: BaseRoleSearchParam): Observable<any> {
        return;
    }

    /**
     * 添加用户与基础角色关系
     */
    @POST("/user-base-role")
    addUserBaseRole(@Body userBaseRole: UserBaseRoleDTO): Observable<void> {
        return;
    }

    /**
     * 删除用户与基础角色关系
     */
    @DELETE("/user-base-role/:userId/:baseRoleId")
    deleteUserBaseRole(@Path('userId') userId: string, @Path('baseRoleId') baseRoleId: string): Observable<void> {
        return;
    }

    /**
     * 获取用户与基础角色关系对象
     */
    getUserBaseRole(userId: string, baseRoleId: string): Observable<UserBaseRoleDTO> {
        return this.cacheService.tryGet(`UserBaseRole:${userId}:${baseRoleId}`,
            of(null).pipe(mergeMap(() => this._getUserBaseRole(userId, baseRoleId).pipe(map((data) => new UserBaseRoleDTO(data))))));
    }

    @GET("/user-base-role/:userId/:baseRoleId")
    _getUserBaseRole(@Path('userId') userId: string, @Path('baseRoleId') baseRoleId: string): Observable<any> {
        return;
    }

    /**
     * 设置用户的基础角色列表
     */
    @PUT("/user/:id/available")
    setAvailableForUser(@Path('id') id: string, @Body user: UserDTO): Observable<void> {
        return;
    }


    /**
     * 重置密码
     */
    @PUT("/user/:id/password")
    setPasswordForUser(@Path('id') id: string, @Body user: UserDTO): Observable<void> {
        return;
    }

}
