export function getCompanyDisplayName(company) {
  const candidates = [
    company?.full_name,
    company?.name,
    company?.company_name,
    company?.company_full_name,
    company?.company_display_name,
    company?.legal_name,
    company?.title,
  ];

  for (const candidate of candidates) {
    const text = String(candidate || '').trim();
    if (!text) continue;

    // Ignore technical placeholders that often leak from APIs instead of company names.
    if (/^#?\d+$/.test(text)) continue;

    return text;
  }

  return '';
}
