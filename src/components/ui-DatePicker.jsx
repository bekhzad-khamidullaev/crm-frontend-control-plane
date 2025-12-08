/**
 * Enterprise DatePicker with calendar, ranges, quick selects, localization
 */
export function DatePicker({
  label = '',
  value = '',
  required = false,
  disabled = false,
  range = false,
  minDate = null,
  maxDate = null,
  format = 'YYYY-MM-DD',
  locale = 'en-US',
  helperText = '',
  errorText = '',
  placeholder = 'Select date...',
  quickSelects = true,
  onChange = null
} = {}) {
  const wrapper = document.createElement('div');
  wrapper.className = 'enterprise-datepicker-wrapper';
  wrapper.style.marginBottom = '16px';
  
  const container = document.createElement('div');
  container.className = 'enterprise-datepicker';
  
  // Label
  const labelEl = document.createElement('label');
  labelEl.className = 'enterprise-datepicker__label';
  labelEl.textContent = label + (required ? ' *' : '');
  
  // Input display
  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'enterprise-datepicker__input mdc-text-field__input';
  input.placeholder = placeholder;
  input.readOnly = true;
  if (value) input.value = formatDate(value);
  if (disabled) input.disabled = true;
  
  const inputWrapper = document.createElement('div');
  inputWrapper.className = 'mdc-text-field mdc-text-field--filled enterprise-datepicker__field';
  inputWrapper.innerHTML = '<span class="mdc-text-field__ripple"></span>';
  inputWrapper.appendChild(input);
  inputWrapper.innerHTML += `
    <span class="material-icons enterprise-datepicker__icon">calendar_today</span>
    <span class="mdc-line-ripple"></span>
  `;
  
  // Calendar dropdown
  const calendar = document.createElement('div');
  calendar.className = 'enterprise-datepicker__calendar';
  calendar.style.display = 'none';
  
  // Quick selects
  if (quickSelects && !range) {
    const quick = document.createElement('div');
    quick.className = 'enterprise-datepicker__quick';
    quick.innerHTML = `
      <button type="button" data-quick="today">Today</button>
      <button type="button" data-quick="tomorrow">Tomorrow</button>
      <button type="button" data-quick="week">Next Week</button>
      <button type="button" data-quick="month">Next Month</button>
    `;
    calendar.appendChild(quick);
    
    quick.addEventListener('click', (e) => {
      const btn = e.target.closest('button');
      if (!btn) return;
      
      const today = new Date();
      let date;
      
      switch(btn.dataset.quick) {
        case 'today': date = today; break;
        case 'tomorrow': date = new Date(today.setDate(today.getDate() + 1)); break;
        case 'week': date = new Date(today.setDate(today.getDate() + 7)); break;
        case 'month': date = new Date(today.setMonth(today.getMonth() + 1)); break;
      }
      
      if (date) {
        selectedDate = date;
        input.value = formatDate(date);
        closeCalendar();
        onChange?.(date);
      }
    });
  }
  
  // Calendar header
  const header = document.createElement('div');
  header.className = 'enterprise-datepicker__header';
  header.innerHTML = `
    <button type="button" class="enterprise-datepicker__nav" data-nav="prev">
      <span class="material-icons">chevron_left</span>
    </button>
    <span class="enterprise-datepicker__month"></span>
    <button type="button" class="enterprise-datepicker__nav" data-nav="next">
      <span class="material-icons">chevron_right</span>
    </button>
  `;
  calendar.appendChild(header);
  
  // Calendar grid
  const grid = document.createElement('div');
  grid.className = 'enterprise-datepicker__grid';
  calendar.appendChild(grid);
  
  // Helper text
  const helper = document.createElement('div');
  helper.className = 'enterprise-datepicker__helper';
  helper.textContent = helperText || errorText;
  if (errorText) helper.classList.add('enterprise-datepicker__helper--error');
  
  container.append(labelEl, inputWrapper, calendar, helper);
  wrapper.appendChild(container);
  
  // State
  let selectedDate = value ? new Date(value) : null;
  let selectedRange = range && value ? { start: null, end: null } : null;
  let currentMonth = new Date();
  let isOpen = false;
  
  // Format date
  function formatDate(date) {
    if (!date) return '';
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  
  // Render calendar
  function renderCalendar() {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    // Update header
    const monthEl = header.querySelector('.enterprise-datepicker__month');
    monthEl.textContent = currentMonth.toLocaleDateString(locale, { month: 'long', year: 'numeric' });
    
    // Clear grid
    grid.innerHTML = '';
    
    // Day headers
    const daysHeader = document.createElement('div');
    daysHeader.className = 'enterprise-datepicker__days-header';
    ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].forEach(day => {
      const dayEl = document.createElement('div');
      dayEl.className = 'enterprise-datepicker__day-name';
      dayEl.textContent = day;
      daysHeader.appendChild(dayEl);
    });
    grid.appendChild(daysHeader);
    
    // Days grid
    const daysGrid = document.createElement('div');
    daysGrid.className = 'enterprise-datepicker__days';
    
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();
    
    // Empty cells before first day
    for (let i = 0; i < firstDay; i++) {
      const empty = document.createElement('div');
      empty.className = 'enterprise-datepicker__day enterprise-datepicker__day--empty';
      daysGrid.appendChild(empty);
    }
    
    // Days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dayEl = document.createElement('button');
      dayEl.type = 'button';
      dayEl.className = 'enterprise-datepicker__day';
      dayEl.textContent = day;
      dayEl.dataset.date = formatDate(date);
      
      // Check if disabled
      if (minDate && date < new Date(minDate)) {
        dayEl.disabled = true;
        dayEl.classList.add('enterprise-datepicker__day--disabled');
      }
      if (maxDate && date > new Date(maxDate)) {
        dayEl.disabled = true;
        dayEl.classList.add('enterprise-datepicker__day--disabled');
      }
      
      // Check if today
      if (formatDate(date) === formatDate(today)) {
        dayEl.classList.add('enterprise-datepicker__day--today');
      }
      
      // Check if selected
      if (selectedDate && formatDate(date) === formatDate(selectedDate)) {
        dayEl.classList.add('enterprise-datepicker__day--selected');
      }
      
      dayEl.addEventListener('click', () => handleDayClick(date));
      daysGrid.appendChild(dayEl);
    }
    
    grid.appendChild(daysGrid);
  }
  
  // Handle day click
  function handleDayClick(date) {
    if (range) {
      // Range selection logic
      if (!selectedRange.start || selectedRange.end) {
        selectedRange = { start: date, end: null };
      } else {
        selectedRange.end = date;
        if (selectedRange.start > selectedRange.end) {
          [selectedRange.start, selectedRange.end] = [selectedRange.end, selectedRange.start];
        }
        input.value = `${formatDate(selectedRange.start)} - ${formatDate(selectedRange.end)}`;
        closeCalendar();
        onChange?.(selectedRange);
      }
    } else {
      selectedDate = date;
      input.value = formatDate(date);
      closeCalendar();
      onChange?.(date);
    }
    renderCalendar();
  }
  
  // Navigation
  header.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-nav]');
    if (!btn) return;
    
    if (btn.dataset.nav === 'prev') {
      currentMonth.setMonth(currentMonth.getMonth() - 1);
    } else {
      currentMonth.setMonth(currentMonth.getMonth() + 1);
    }
    renderCalendar();
  });
  
  // Open/close calendar
  function openCalendar() {
    if (disabled) return;
    isOpen = true;
    calendar.style.display = 'block';
    inputWrapper.classList.add('enterprise-datepicker__field--open');
    renderCalendar();
  }
  
  function closeCalendar() {
    isOpen = false;
    calendar.style.display = 'none';
    inputWrapper.classList.remove('enterprise-datepicker__field--open');
  }
  
  inputWrapper.addEventListener('click', () => {
    if (isOpen) closeCalendar();
    else openCalendar();
  });
  
  // Close on outside click
  document.addEventListener('click', (e) => {
    if (!wrapper.contains(e.target) && isOpen) {
      closeCalendar();
    }
  });
  
  return {
    element: wrapper,
    getValue: () => range ? selectedRange : selectedDate,
    setValue: (val) => {
      if (range) {
        selectedRange = val;
        if (val?.start && val?.end) {
          input.value = `${formatDate(val.start)} - ${formatDate(val.end)}`;
        }
      } else {
        selectedDate = val ? new Date(val) : null;
        input.value = formatDate(selectedDate);
      }
      renderCalendar();
    },
    setError: (msg) => {
      helper.textContent = msg;
      helper.classList.add('enterprise-datepicker__helper--error');
      container.classList.add('enterprise-datepicker--error');
    },
    clearError: () => {
      helper.textContent = helperText;
      helper.classList.remove('enterprise-datepicker__helper--error');
      container.classList.remove('enterprise-datepicker--error');
    },
    clear: () => {
      selectedDate = null;
      selectedRange = null;
      input.value = '';
      renderCalendar();
    }
  };
}
