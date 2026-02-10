/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { LanguageCodeEnum } from './LanguageCodeEnum';
export type Paragraph = {
    readonly id: number;
    /**
     * Title of paragraph.
     */
    title?: string | null;
    content?: string;
    /**
     * The sequence number of the paragraph on the page.
     */
    index_number?: number;
    language_code: LanguageCodeEnum;
};

