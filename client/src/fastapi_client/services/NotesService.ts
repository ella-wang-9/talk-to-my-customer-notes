/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CustomerNote } from '../models/CustomerNote';
import type { NotesRequest } from '../models/NotesRequest';
import type { QARequest } from '../models/QARequest';
import type { QAResult } from '../models/QAResult';
import type { RelevanceFilter } from '../models/RelevanceFilter';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class NotesService {
    /**
     * Fetch Customer Notes
     * Fetch customer notes filtered by name and date range using Databricks SQL.
     * @param requestBody
     * @returns CustomerNote Successful Response
     * @throws ApiError
     */
    public static fetchCustomerNotesApiNotesFetchNotesPost(
        requestBody: NotesRequest,
    ): CancelablePromise<Array<CustomerNote>> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/notes/fetch-notes',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Fetch Customer Notes Sample
     * Sample data for testing the complete workflow.
     * @param requestBody
     * @returns CustomerNote Successful Response
     * @throws ApiError
     */
    public static fetchCustomerNotesSampleApiNotesFetchNotesSamplePost(
        requestBody: NotesRequest,
    ): CancelablePromise<Array<CustomerNote>> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/notes/fetch-notes-sample',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Test Sql
     * Test SQL execution and return debug info.
     * @returns any Successful Response
     * @throws ApiError
     */
    public static testSqlApiNotesTestSqlGet(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/notes/test-sql',
        });
    }
    /**
     * Transform Notes
     * Transform HTML content to plain text for all notes.
     * @param requestBody
     * @returns CustomerNote Successful Response
     * @throws ApiError
     */
    public static transformNotesApiNotesTransformNotesPost(
        requestBody: Array<CustomerNote>,
    ): CancelablePromise<Array<CustomerNote>> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/notes/transform-notes',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Filter Relevance
     * Filter notes using Gemini for relevance to project description.
     * Uses Foundation Model Serving to call Gemini.
     * @param requestBody
     * @returns CustomerNote Successful Response
     * @throws ApiError
     */
    public static filterRelevanceApiNotesFilterRelevancePost(
        requestBody: RelevanceFilter,
    ): CancelablePromise<Array<CustomerNote>> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/notes/filter-relevance',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Answer Questions
     * Answer yes/no questions for each note using Gemini.
     * Uses Foundation Model Serving to call Gemini with strict JSON output.
     * @param requestBody
     * @returns QAResult Successful Response
     * @throws ApiError
     */
    public static answerQuestionsApiNotesAnswerQuestionsPost(
        requestBody: QARequest,
    ): CancelablePromise<Array<QAResult>> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/notes/answer-questions',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
