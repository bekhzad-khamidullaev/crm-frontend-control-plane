/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { BlankEnum } from './BlankEnum';
import type { NullEnum } from './NullEnum';
import type { SexEnum } from './SexEnum';
/**
 * Mixin to add validation helpers to serializers
 */
export type Contact = {
    readonly id: number;
    /**
     * The name of the contact person (one word).
     */
    first_name: string;
    /**
     * The middle name of the contact person.
     */
    middle_name?: string;
    /**
     * The last name of the contact person (one word).
     */
    last_name: string;
    readonly full_name: string;
    /**
     * The title (position) of the contact person.
     */
    title?: string | null;
    sex?: (SexEnum | BlankEnum | NullEnum) | null;
    birth_date?: string | null;
    /**
     * Use comma to separate Emails.
     */
    email?: string;
    secondary_email?: string;
    phone?: string;
    other_phone?: string;
    mobile?: string;
    city_name?: string;
    /**
     * Object of City in database
     */
    city?: number | null;
    country?: number | null;
    address?: string;
    region?: string;
    district?: string;
    description?: string;
    disqualified?: boolean;
    lead_source?: number | null;
    /**
     * Mailing list recipient.
     */
    massmail?: boolean;
    tags?: Array<number>;
    token?: string;
    was_in_touch?: string | null;
    owner?: number | null;
    department?: number | null;
    company?: number;
    readonly creation_date: string;
    readonly update_date: string;
};
