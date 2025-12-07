# Contacts module

Endpoints (Django-CRM API):

- `GET /api/contacts/` with filters `search`, `owner`, `disqualified`, `ordering`, `page`
- `POST /api/contacts/` create contact
- `GET /api/contacts/{id}/` retrieve contact
- `PUT/PATCH /api/contacts/{id}/` update contact
- `DELETE /api/contacts/{id}/` delete contact
- Lookups: `GET /api/users/` for owners, `GET /api/crm-tags/` for tag options

UI components:

- **ContactsList.js**: server-side filters, inline owner + disqualify toggles, status KPI doughnut chart, row actions (view/edit/delete).
- **ContactDetail.js**: compact summary of contact/company/meta fields with disqualify/activate, edit, delete, and back navigation.
- **ContactForm.js**: schema-aligned form with validation (emails/phones/required), owner/tag lookups, boolean flags (disqualified/massmail); creates or patches via `contactsApi`.

Data mapping:

- Numeric lookups sent as integers when set (owner, lead_source, country, company).
- Tags are array of tag ids.
- Boolean flags map to `disqualified` and `massmail`; last contact uses ISO date string (`was_in_touch`).

Error handling:

- Client validation via `FormValidator`; server errors surfaced per-field and aggregated in `ValidationSummary`, with Toast notifications on failures.
