/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { BlankEnum } from './BlankEnum';
import type { LanguageCodeEnum } from './LanguageCodeEnum';
import type { Paragraph } from './Paragraph';
export type Page = {
    readonly id: number;
    title?: string | null;
    language_code?: (LanguageCodeEnum | BlankEnum);
    readonly paragraphs: Array<Paragraph>;
};

