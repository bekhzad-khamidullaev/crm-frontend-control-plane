/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type PatchedEmlMessage = {
    readonly id?: number;
    readonly owner?: number | null;
    readonly owner_name?: string;
    /**
     * The subject of the message. You can use {{first_name}}, {{last_name}}, {{first_middle_name}} or {{full_name}}
     */
    subject?: string;
    /**
     *
     * Use HTML. To specify the address of the embedded image, use {% cid_media ‘path/to/pic.png' %}.<br>
     * You can embed files uploaded to the CRM server in the ‘media/pics/’ folder.
     *
     */
    content?: string;
    readonly creation_date?: string;
    readonly update_date?: string;
};

