/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type EmailAccount = {
    readonly id: number;
    readonly owner: number | null;
    readonly owner_name: string;
    /**
     * The username to use to authenticate to the SMTP server.
     */
    email_host_user: string;
    /**
     * The name of the Email Account. For example Gmail
     */
    name: string;
    /**
     * The SMTP host.
     */
    email_host: string;
    /**
     * The IMAP host
     */
    imap_host?: string;
    /**
     * The from_email field.
     */
    from_email: string;
    /**
     * Use this account for regular business correspondence.
     */
    main?: boolean;
    /**
     * Allow to use this account for massmail.
     */
    massmail?: boolean;
    /**
     * Import emails from this account.
     */
    do_import?: boolean;
};

