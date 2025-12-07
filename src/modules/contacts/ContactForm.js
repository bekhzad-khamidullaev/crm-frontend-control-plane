import { MDCRipple } from '@material/ripple';
import { contactsApi, usersApi, crmTagsApi } from '../../lib/api/client.js';
import { TextField, Toast, ValidationSummary } from '../../components/index.js';
import { FormValidator, ValidationRules } from '../../lib/forms/FormValidator.js';

const numberOrUndefined = (value) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : undefined;
};

export function ContactForm({ onSuccess, contact } = {}) {
  const wrapper = document.createElement('div');
  wrapper.className = 'mdc-card';
  wrapper.style.padding = '16px';
  wrapper.style.maxWidth = '1100px';
  wrapper.style.margin = '0 auto';

  const header = document.createElement('div');
  header.style.display = 'flex';
  header.style.alignItems = 'center';
  header.style.justifyContent = 'space-between';
  header.style.marginBottom = '12px';
  const title = document.createElement('h2');
  title.textContent = contact ? 'Edit contact' : 'New contact';
  title.style.margin = '0';
  header.appendChild(title);

  const validationSummary = ValidationSummary({ title: 'Please correct the highlighted fields' });

  const form = document.createElement('form');
  form.className = 'contact-form';

  const grid = document.createElement('div');
  grid.style.display = 'grid';
  grid.style.gridTemplateColumns = 'repeat(auto-fit, minmax(260px, 1fr))';
  grid.style.gap = '12px';

  const firstNameField = TextField({ label: 'First name', required: true, value: contact?.first_name || '' });
  const lastNameField = TextField({ label: 'Last name', value: contact?.last_name || '' });
  const middleNameField = TextField({ label: 'Middle name', value: contact?.middle_name || '' });
  const emailField = TextField({ label: 'Email', type: 'email', required: true, value: contact?.email || '' });
  const secondaryEmailField = TextField({ label: 'Secondary email', type: 'email', value: contact?.secondary_email || '' });
  const phoneField = TextField({ label: 'Phone', type: 'tel', value: contact?.phone || '' });
  const otherPhoneField = TextField({ label: 'Other phone', type: 'tel', value: contact?.other_phone || '' });
  const mobileField = TextField({ label: 'Mobile', type: 'tel', value: contact?.mobile || '' });
  const leadSourceField = TextField({ label: 'Lead source (id)', type: 'number', value: contact?.lead_source ?? '' });
  const titleField = TextField({ label: 'Title/Position', value: contact?.title || '' });
  const companyField = TextField({ label: 'Company id', type: 'number', value: contact?.company ?? '' });
  const countryField = TextField({ label: 'Country (id)', type: 'number', value: contact?.country ?? '' });
  const cityField = TextField({ label: 'City', value: contact?.city_name || '' });
  const addressField = TextField({ label: 'Address', value: contact?.address || '' });
  const regionField = TextField({ label: 'Region', value: contact?.region || '' });
  const districtField = TextField({ label: 'District', value: contact?.district || '' });
  const descriptionField = TextField({ label: 'Notes', multiline: true, rows: 3, value: contact?.description || '' });
  const lastTouchField = TextField({ label: 'Last contact date', type: 'date', value: contact?.was_in_touch || '' });

  const ownerWrapper = document.createElement('div');
  ownerWrapper.className = 'simple-field';
  const ownerLabel = document.createElement('label');
  ownerLabel.textContent = 'Owner';
  ownerLabel.style.fontWeight = '600';
  ownerLabel.style.display = 'block';
  ownerLabel.style.marginBottom = '4px';
  const ownerSelect = document.createElement('select');
  ownerSelect.style.width = '100%';
  ownerSelect.innerHTML = `<option value="">Unassigned</option>`;
  const ownerHelper = document.createElement('div');
  ownerHelper.className = 'field-helper';
  ownerHelper.style.color = '#dc2626';
  ownerHelper.style.fontSize = '12px';
  ownerWrapper.append(ownerLabel, ownerSelect, ownerHelper);

  const tagsWrapper = document.createElement('div');
  tagsWrapper.className = 'simple-field';
  const tagsLabel = document.createElement('label');
  tagsLabel.textContent = 'Tags';
  tagsLabel.style.fontWeight = '600';
  tagsLabel.style.display = 'block';
  tagsLabel.style.marginBottom = '4px';
  const tagsSelect = document.createElement('select');
  tagsSelect.multiple = true;
  tagsSelect.size = 4;
  tagsSelect.style.width = '100%';
  const tagsHelper = document.createElement('div');
  tagsHelper.className = 'field-helper';
  tagsHelper.style.color = '#dc2626';
  tagsHelper.style.fontSize = '12px';
  tagsWrapper.append(tagsLabel, tagsSelect, tagsHelper);

  const disqualifiedWrapper = document.createElement('label');
  disqualifiedWrapper.style.display = 'flex';
  disqualifiedWrapper.style.alignItems = 'center';
  disqualifiedWrapper.style.gap = '8px';
  const disqualifiedInput = document.createElement('input');
  disqualifiedInput.type = 'checkbox';
  disqualifiedInput.checked = Boolean(contact?.disqualified);
  disqualifiedWrapper.append(disqualifiedInput, document.createTextNode('Disqualified'));

  const massmailWrapper = document.createElement('label');
  massmailWrapper.style.display = 'flex';
  massmailWrapper.style.alignItems = 'center';
  massmailWrapper.style.gap = '8px';
  const massmailInput = document.createElement('input');
  massmailInput.type = 'checkbox';
  massmailInput.checked = Boolean(contact?.massmail);
  massmailWrapper.append(massmailInput, document.createTextNode('Mass mailing allowed'));

  grid.append(
    firstNameField.element,
    lastNameField.element,
    middleNameField.element,
    emailField.element,
    secondaryEmailField.element,
    phoneField.element,
    otherPhoneField.element,
    mobileField.element,
    leadSourceField.element,
    titleField.element,
    companyField.element,
    countryField.element,
    cityField.element,
    addressField.element,
    regionField.element,
    districtField.element,
    lastTouchField.element,
    ownerWrapper,
    tagsWrapper,
    descriptionField.element,
    disqualifiedWrapper,
    massmailWrapper,
  );

  const actions = document.createElement('div');
  actions.style.display = 'flex';
  actions.style.justifyContent = 'flex-end';
  actions.style.gap = '8px';
  actions.style.marginTop = '16px';

  const cancelBtn = document.createElement('button');
  cancelBtn.type = 'button';
  cancelBtn.className = 'mdc-button';
  cancelBtn.innerHTML = '<span class="mdc-button__ripple"></span><span class="mdc-button__label">Cancel</span>';
  MDCRipple.attachTo(cancelBtn);
  cancelBtn.addEventListener('click', () => wrapper.dispatchEvent(new CustomEvent('cancel', { bubbles: true })));

  const submitBtn = document.createElement('button');
  submitBtn.type = 'submit';
  submitBtn.className = 'mdc-button mdc-button--raised';
  submitBtn.innerHTML = `<span class="mdc-button__ripple"></span><span class="mdc-button__label">${contact ? 'Save contact' : 'Create contact'}</span>`;
  MDCRipple.attachTo(submitBtn);

  actions.append(cancelBtn, submitBtn);
  form.append(grid, actions);
  wrapper.append(header, validationSummary.element, form);

  const validator = new FormValidator();
  validator.addRules({
    first_name: [ValidationRules.required, ValidationRules.min(2)],
    email: [ValidationRules.required, ValidationRules.email],
    secondary_email: [ValidationRules.email],
    phone: ['phone'],
    other_phone: ['phone'],
    mobile: ['phone'],
    website: [ValidationRules.url],
    company_email: [ValidationRules.email],
    company_phone: ['phone'],
  });

  const fieldMap = {
    first_name: firstNameField,
    last_name: lastNameField,
    middle_name: middleNameField,
    email: emailField,
    secondary_email: secondaryEmailField,
    phone: phoneField,
    other_phone: otherPhoneField,
    mobile: mobileField,
    lead_source: leadSourceField,
    title: titleField,
    company: companyField,
    country: countryField,
    city_name: cityField,
    address: addressField,
    region: regionField,
    district: districtField,
    description: descriptionField,
    was_in_touch: lastTouchField,
  };

  const selectFields = {
    owner: {
      getValue: () => ownerSelect.value,
      setError: (msg) => {
        ownerHelper.textContent = msg || '';
      },
      clearError: () => {
        ownerHelper.textContent = '';
      },
    },
    tags: {
      getValue: () => Array.from(tagsSelect.selectedOptions).map((o) => Number(o.value)).filter((v) => Number.isFinite(v)),
      setError: (msg) => {
        tagsHelper.textContent = msg || '';
      },
      clearError: () => {
        tagsHelper.textContent = '';
      },
    },
  };

  function clearErrors() {
    validationSummary.clear();
    Object.values(fieldMap).forEach((f) => f.clearError?.());
    Object.values(selectFields).forEach((f) => f.clearError());
  }

  function applyServerErrors(details) {
    if (!details || typeof details !== 'object') return;
    validationSummary.addErrors(details);
    Object.entries(details).forEach(([field, message]) => {
      const formatted = Array.isArray(message) ? message.join(', ') : message;
      if (fieldMap[field]) fieldMap[field].setError?.(formatted);
      else if (selectFields[field]) selectFields[field].setError(formatted);
    });
  }

  function collectPayload() {
    return {
      first_name: firstNameField.getValue().trim(),
      last_name: lastNameField.getValue().trim() || undefined,
      middle_name: middleNameField.getValue().trim() || undefined,
      email: emailField.getValue().trim(),
      secondary_email: secondaryEmailField.getValue().trim() || undefined,
      phone: phoneField.getValue().trim() || undefined,
      other_phone: otherPhoneField.getValue().trim() || undefined,
      mobile: mobileField.getValue().trim() || undefined,
      lead_source: numberOrUndefined(leadSourceField.getValue()),
      title: titleField.getValue().trim() || undefined,
      company: numberOrUndefined(companyField.getValue()),
      country: numberOrUndefined(countryField.getValue()),
      city_name: cityField.getValue().trim() || undefined,
      address: addressField.getValue().trim() || undefined,
      region: regionField.getValue().trim() || undefined,
      district: districtField.getValue().trim() || undefined,
      was_in_touch: lastTouchField.getValue() || undefined,
      description: descriptionField.getValue().trim() || undefined,
      owner: ownerSelect.value ? Number(ownerSelect.value) : undefined,
      tags: selectFields.tags.getValue(),
      disqualified: disqualifiedInput.checked,
      massmail: massmailInput.checked,
    };
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearErrors();
    const payload = collectPayload();

    const validationErrors = await validator.validate(payload);
    if (Object.keys(validationErrors).length) {
      validationSummary.addErrors(validationErrors);
      Object.entries(validationErrors).forEach(([field, message]) => {
        if (fieldMap[field]) fieldMap[field].setError?.(message);
        else if (selectFields[field]) selectFields[field].setError(message);
      });
      Toast.error('Fix validation errors');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.querySelector('.mdc-button__label').textContent = 'Saving…';

    try {
      const result = contact?.id ? await contactsApi.patch(contact.id, payload) : await contactsApi.create(payload);
      Toast.success(contact ? 'Contact updated' : 'Contact created');
      onSuccess?.(result);
      wrapper.dispatchEvent(new CustomEvent('saved', { bubbles: true, detail: result }));
    } catch (err) {
      applyServerErrors(err?.details);
      Toast.error(err.message || 'Failed to save contact');
    } finally {
      submitBtn.disabled = false;
      submitBtn.querySelector('.mdc-button__label').textContent = contact ? 'Save contact' : 'Create contact';
    }
  });

  async function loadUsersAndTags() {
    try {
      const [usersResp, tagsResp] = await Promise.all([
        usersApi.list({ page: 1, ordering: 'username' }),
        crmTagsApi.list({ page: 1, ordering: 'name' }),
      ]);

      const users = usersResp.results || usersResp.items || [];
      ownerSelect.innerHTML = `<option value="">Unassigned</option>` + users.map((u) => `<option value="${u.id}">${u.first_name || u.username}</option>`).join('');
      const currentOwner = typeof contact?.owner === 'object' ? contact.owner.id : contact?.owner;
      if (currentOwner) ownerSelect.value = String(currentOwner);

      const tags = tagsResp.results || tagsResp.items || [];
      tagsSelect.innerHTML = tags.map((t) => `<option value="${t.id}">${t.name}</option>`).join('');
      if (Array.isArray(contact?.tags)) {
        Array.from(tagsSelect.options).forEach((opt) => {
          if (contact.tags.includes(Number(opt.value))) opt.selected = true;
        });
      }
    } catch {
      // ignore
    }
  }

  loadUsersAndTags();

  return wrapper;
}
