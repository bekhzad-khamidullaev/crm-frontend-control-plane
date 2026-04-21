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
     * Port to use for the SMTP server
     */
    email_port?: number;
    /**
     * The IMAP host
     */
    imap_host?: string;
    /**
     * The from_email field.
     */
    from_email: string;
    email_use_tls?: boolean;
    email_use_ssl?: boolean;
    /**
     * The auth_password to use to authenticate to the SMTP server.
     */
    email_host_password: string;
    /**
     * The application password to use to authenticate to the SMTP server.
     */
    email_app_password?: string;
    /**
     * Expose this mailbox as a shared CRM sender for all users.
     */
    is_system_shared?: boolean;
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

