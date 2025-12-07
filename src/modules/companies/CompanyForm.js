import { companiesApi } from '../../lib/api/client.js';
import { 
  Toast, 
  TextField, 
  Select,
  TagsInput,
  FileUpload,
  RichTextEditor,
  FormSection, 
  FormPreview,
  ValidationSummary
} from '../../components/index.js';
import { EnterpriseForm } from '../../lib/forms/EnterpriseForm.js';
import { ValidationRules } from '../../lib/forms/FormValidator.js';
import { MDCRipple } from '@material/ripple';

/**
 * Enterprise Company Form with full CRM integration
 */
export function CompanyForm({ onSuccess, company } = {}) {
  const wrapper = document.createElement('div');
  wrapper.className = 'enterprise-company-form';
  
  const validationSummary = ValidationSummary({
    title: 'Please fix the following errors:',
    scrollToError: true
  });
  
  // Page Header
  const pageHeader = document.createElement('div');
  pageHeader.className = 'page-header';
  pageHeader.style.marginBottom = '24px';
  
  const titleSection = document.createElement('div');
  const pageTitle = document.createElement('h5');
  pageTitle.className = 'page-header__title';
  pageTitle.innerHTML = `
    <span class="material-icons" style="vertical-align: middle; margin-right: 8px;">
      ${company ? 'edit' : 'business'}
    </span>
    ${company ? 'Edit Company' : 'Create New Company'}
  `;
  
  const pageSubtitle = document.createElement('div');
  pageSubtitle.className = 'page-header__subtitle';
  pageSubtitle.textContent = company ? `Editing: ${company.name}` : 'Add a new company to your CRM';
  
  titleSection.append(pageTitle, pageSubtitle);
  pageHeader.appendChild(titleSection);
  
  const layout = document.createElement('div');
  layout.className = 'form-layout';
  
  const mainColumn = document.createElement('div');
  mainColumn.className = 'form-layout__main';
  
  const sidebar = document.createElement('div');
  sidebar.className = 'form-layout__sidebar';

  const form = document.createElement('form');
  form.autocomplete = 'off';
  form.className = 'enterprise-form';

  // ========== Basic Information ==========
  const basicSection = document.createElement('div');
  
  const nameField = TextField({ 
    label: 'Company Name', 
    required: true, 
    value: company?.name || '',
    placeholder: 'Acme Corporation'
  });
  
  const typeField = Select({
    label: 'Company Type',
    value: company?.type || '',
    options: [
      { value: 'customer', label: 'Customer', icon: 'star' },
      { value: 'prospect', label: 'Prospect', icon: 'visibility' },
      { value: 'partner', label: 'Partner', icon: 'handshake' },
      { value: 'vendor', label: 'Vendor', icon: 'inventory' },
      { value: 'competitor', label: 'Competitor', icon: 'trending_up' }
    ],
    searchable: true
  });
  
  const websiteField = TextField({
    label: 'Website',
    type: 'url',
    value: company?.website || '',
    placeholder: 'https://www.company.com'
  });
  
  const row1 = document.createElement('div');
  row1.style.display = 'grid';
  row1.style.gridTemplateColumns = '2fr 1fr';
  row1.style.gap = '16px';
  row1.append(nameField.element, typeField.element);
  
  basicSection.append(row1, websiteField.element);
  const basicSectionComponent = FormSection({ 
    title: 'Basic Information', 
    icon: 'business', 
    children: [basicSection]
  });

  // ========== Contact Information ==========
  const contactSection = document.createElement('div');
  
  const emailField = TextField({ 
    label: 'Email Address', 
    type: 'email', 
    value: company?.email || '',
    placeholder: 'info@company.com',
    helperText: 'Primary company email'
  });
  
  const phoneField = TextField({ 
    label: 'Phone Number', 
    type: 'tel', 
    value: company?.phone || '',
    placeholder: '+1 (555) 123-4567'
  });
  
  const addressField = TextField({
    label: 'Address',
    value: company?.address || '',
    multiline: true,
    rows: 3,
    placeholder: '123 Business St, Suite 100\nCity, State, ZIP\nCountry'
  });
  
  contactSection.append(emailField.element, phoneField.element, addressField.element);
  const contactSectionComponent = FormSection({ 
    title: 'Contact Information', 
    icon: 'contact_phone', 
    children: [contactSection]
  });

  // ========== Business Details ==========
  const businessSection = document.createElement('div');
  
  const industryField = TextField({
    label: 'Industry',
    value: company?.industry || '',
    placeholder: 'Technology, Healthcare, Finance, etc.'
  });
  
  const sizeField = Select({
    label: 'Company Size',
    value: company?.size || '',
    options: [
      { value: '1-10', label: '1-10 employees' },
      { value: '11-50', label: '11-50 employees' },
      { value: '51-200', label: '51-200 employees' },
      { value: '201-500', label: '201-500 employees' },
      { value: '501-1000', label: '501-1000 employees' },
      { value: '1000+', label: '1000+ employees' }
    ]
  });
  
  const revenueField = TextField({
    label: 'Annual Revenue (USD)',
    type: 'number',
    value: company?.revenue || '',
    placeholder: '1000000'
  });
  
  const row2 = document.createElement('div');
  row2.style.display = 'grid';
  row2.style.gridTemplateColumns = 'repeat(2, 1fr)';
  row2.style.gap = '16px';
  row2.append(sizeField.element, revenueField.element);
  
  businessSection.append(industryField.element, row2);
  const businessSectionComponent = FormSection({
    title: 'Business Details',
    icon: 'analytics',
    children: [businessSection],
    collapsible: true,
    defaultOpen: true
  });

  // ========== Assignment & Tags ==========
  const assignmentSection = document.createElement('div');
  
  const ownerField = Select({
    label: 'Account Owner',
    value: company?.owner?.id || '',
    options: [
      { value: 1, label: 'John Smith', icon: 'person' },
      { value: 2, label: 'Jane Doe', icon: 'person' },
      { value: 3, label: 'Bob Johnson', icon: 'person' }
    ],
    searchable: true,
    placeholder: 'Select owner...'
  });
  
  const tagsField = TagsInput({
    label: 'Tags',
    value: company?.tags || [],
    suggestions: ['Enterprise', 'Fortune 500', 'Strategic Partner', 'Key Account', 'Growth'],
    placeholder: 'Add tags...'
  });
  
  const sourceField = Select({
    label: 'Lead Source',
    value: company?.lead_source || '',
    options: [
      { value: 'referral', label: 'Referral' },
      { value: 'website', label: 'Website' },
      { value: 'event', label: 'Event' },
      { value: 'partner', label: 'Partner' }
    ]
  });
  
  assignmentSection.append(ownerField.element, tagsField.element, sourceField.element);
  const assignmentSectionComponent = FormSection({
    title: 'Assignment & Classification',
    icon: 'label',
    children: [assignmentSection],
    collapsible: true,
    defaultOpen: true
  });

  // ========== Additional Information ==========
  const additionalSection = document.createElement('div');
  
  const descriptionField = RichTextEditor({
    label: 'Description',
    value: company?.description || '',
    placeholder: 'Company overview, notes, and additional information...',
    minHeight: 150
  });
  
  const logoField = FileUpload({
    label: 'Company Logo',
    accept: 'image/*',
    maxSize: 5 * 1024 * 1024, // 5MB
    helperText: 'Upload company logo (max 5MB)',
    preview: true
  });
  
  additionalSection.append(descriptionField.element, logoField.element);
  const additionalSectionComponent = FormSection({
    title: 'Additional Information',
    icon: 'description',
    children: [additionalSection],
    collapsible: true,
    defaultOpen: false
  });

  mainColumn.append(
    basicSectionComponent, 
    contactSectionComponent, 
    businessSectionComponent,
    assignmentSectionComponent,
    additionalSectionComponent
  );
  
  const fields = { 
    name: nameField,
    type: typeField,
    website: websiteField,
    email: emailField, 
    phone: phoneField,
    address: addressField,
    industry: industryField,
    size: sizeField,
    revenue: revenueField,
    owner: ownerField,
    tags: tagsField,
    lead_source: sourceField,
    description: descriptionField,
    logo: logoField
  };

  // Form Preview
  const preview = FormPreview({ 
    title: 'Company Preview', 
    data: {
      name: company?.name || '',
      website: company?.website || '',
      email: company?.email || '',
      phone: company?.phone || ''
    }
  });
  
  sidebar.appendChild(preview.element);
  
  // Update preview on input
  Object.entries(fields).forEach(([key, field]) => {
    const input = field.input || field.element;
    if (input) {
      input.addEventListener('input', () => {
        const data = {};
        Object.entries(fields).forEach(([k, f]) => {
          const val = f.getValue?.();
          if (val) data[k] = val;
        });
        preview.update(data);
      });
    }
  });

  // Actions Bar
  const actionsBar = document.createElement('div');
  actionsBar.className = 'form-actions-bar';
  
  const actionsLeft = document.createElement('div');
  actionsLeft.className = 'form-actions-bar__left';
  const status = document.createElement('div');
  status.className = 'form-status';
  status.innerHTML = '<div class="form-status__indicator"></div><span>Ready to save</span>';
  actionsLeft.appendChild(status);
  
  const actionsRight = document.createElement('div');
  actionsRight.className = 'form-actions-bar__right';
  
  const cancel = document.createElement('button');
  cancel.type = 'button';
  cancel.className = 'mdc-button';
  cancel.innerHTML = '<span class="mdc-button__ripple"></span><span class="mdc-button__label">Cancel</span>';
  MDCRipple.attachTo(cancel);
  cancel.addEventListener('click', () => {
    wrapper.dispatchEvent(new CustomEvent('cancel', { bubbles: true }));
  });

  const submit = document.createElement('button');
  submit.type = 'submit';
  submit.className = 'mdc-button mdc-button--raised';
  submit.style.background = 'var(--google-blue)';
  submit.innerHTML = `<span class="mdc-button__ripple"></span><span class="mdc-button__label">${company ? 'Save Changes' : 'Create Company'}</span>`;
  MDCRipple.attachTo(submit);

  actionsRight.append(cancel, submit);
  actionsBar.append(actionsLeft, actionsRight);

  form.appendChild(mainColumn);
  layout.append(mainColumn, sidebar);
  wrapper.append(validationSummary.element, pageHeader, form, layout, actionsBar);

  // Setup enterprise form
  const enterpriseForm = new EnterpriseForm({
    formElement: form,
    apiClient: companiesApi,
    entityId: company?.id,
    autoSave: true,
    autoSaveInterval: 30000,
    trackHistory: true,
    onSave: (result, isAutoSave) => {
      if (!isAutoSave) {
        Toast.success(company ? 'Company updated successfully' : 'Company created successfully');
        onSuccess?.(result);
      }
    },
    onError: (error) => {
      if (error.details) {
        validationSummary.addErrors(error.details);
      }
    }
  });
  
  enterpriseForm.validator.addRules({
    name: [ValidationRules.required, ValidationRules.min(2)],
    email: [ValidationRules.email],
    phone: ['phone'],
    website: [ValidationRules.url]
  });
  
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    validationSummary.clear();
    
    const isValid = await enterpriseForm.validate();
    if (!isValid) {
      Toast.error('Please fix validation errors');
      return;
    }
    
    try {
      const payload = { 
        name: nameField.getValue().trim(),
        type: typeField.getValue() || undefined,
        website: websiteField.getValue().trim() || undefined,
        email: emailField.getValue().trim() || undefined, 
        phone: phoneField.getValue().trim() || undefined,
        address: addressField.getValue().trim() || undefined,
        industry: industryField.getValue().trim() || undefined,
        size: sizeField.getValue() || undefined,
        revenue: revenueField.getValue() || undefined,
        owner: ownerField.getValue() || undefined,
        tags: tagsField.getValue() || undefined,
        lead_source: sourceField.getValue() || undefined,
        description: descriptionField.getValue() || undefined
      };
      
      submit.disabled = true;
      status.innerHTML = '<div class="form-status__indicator form-status__indicator--saving"></div><span>Saving...</span>';
      
      let result;
      if (company && company.id) { 
        result = await companiesApi.patch(company.id, payload); 
      } else { 
        result = await companiesApi.create(payload); 
      }
      
      // Upload logo if provided
      if (logoField.getValue().length > 0) {
        // TODO: Upload logo
      }
      
      status.innerHTML = '<div class="form-status__indicator"></div><span>All changes saved</span>';
      Toast.success(company ? 'Company updated successfully' : 'Company created successfully');
      onSuccess?.(result);
      wrapper.dispatchEvent(new CustomEvent('saved', { bubbles: true, detail: result }));
      
    } catch (err) {
      console.error('Save error:', err);
      
      if (err.details && typeof err.details === 'object') {
        validationSummary.addErrors(err.details);
        Object.entries(err.details).forEach(([field, messages]) => {
          const message = Array.isArray(messages) ? messages.join(', ') : messages;
          if (fields[field]) {
            fields[field].setError(message);
          }
        });
      } else {
        Toast.error(err.message || 'Failed to save company');
      }
      
      status.innerHTML = '<div class="form-status__indicator" style="background: var(--google-red);"></div><span>Failed to save</span>';
    } finally {
      submit.disabled = false;
    }
  });
  
  wrapper.addEventListener('destroy', () => {
    enterpriseForm.destroy();
  });

  return wrapper;
}
