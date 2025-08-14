/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class DebugService {
    /**
     * Debug Original Sql
     * Test the exact original SQL query provided by the user.
     * @returns any Successful Response
     * @throws ApiError
     */
    public static debugOriginalSqlApiDebugDebugOriginalSqlGet(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/debug/debug-original-sql',
        });
    }
}
