# Leads module

Frontend features backed by Django-CRM leads endpoints:

- `GET /api/leads/` list with filters `search`, `owner`, `disqualified`, `ordering`, `page`
- `POST /api/leads/` create lead
- `GET /api/leads/{id}/` retrieve lead
- `PUT/PATCH /api/leads/{id}/` update lead
- `DELETE /api/leads/{id}/` delete lead
- `POST /api/leads/{id}/assign/` assign owner
- `POST /api/leads/{id}/convert/` convert to deal
- `POST /api/leads/{id}/disqualify/` disqualify lead
- `POST /api/leads/bulk_tag/` bulk apply tags to selected leads
- Supporting lookups: `GET /api/users/` (owner select), `GET /api/crm-tags/` (tags)

## UI flows

- **List** (`LeadsList.js`): server-side filters (search/owner/disqualified/order), inline owner change and disqualify toggle, KPI doughnut chart (lead_source distribution), bulk tagging selected rows, row actions (view/edit/convert/delete).
- **Detail** (`LeadDetail.js`): compact summary of contact/company/meta fields, actions to convert, disqualify/activate, edit, delete, and back navigation.
- **Form** (`LeadForm.js`): minimal schema-aligned fields (first/last/middle name, emails, phones, lead_source id, company/contact fields, country/city, last contact date, tags, flags), validation via `FormValidator`, creates or patches through `leadsApi`.

## Data mapping notes

- Numeric lookups (e.g., `lead_source`, `country`, `owner`) are sent as integers when provided.
- Tags are submitted as an array of tag ids from `crm-tags`.
- Disqualified/massmail flags are booleans; last contact uses ISO date string.

## Error handling

- Client-side validation covers required fields and formats (email/phone/url).
- Server validation errors from API are surfaced per-field and aggregated via `ValidationSummary`, with Toast notifications for failures.
