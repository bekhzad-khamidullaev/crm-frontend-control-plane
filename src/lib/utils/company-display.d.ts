export declare function getCompanyDisplayName(
  company:
    | {
        full_name?: string | null;
        name?: string | null;
        company_name?: string | null;
        company_full_name?: string | null;
        company_display_name?: string | null;
        legal_name?: string | null;
        title?: string | null;
      }
    | null
    | undefined,
): string;

