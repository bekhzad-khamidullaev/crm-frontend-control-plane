/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type User = {
    readonly id: number;
    /**
     * Обязательное поле. Не более 150 символов. Только буквы, цифры и символы @/./+/-/_.
     */
    username: string;
    first_name?: string;
    last_name?: string;
    email?: string;
};

