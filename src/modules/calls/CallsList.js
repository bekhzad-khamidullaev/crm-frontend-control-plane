/**
 * CallsList Component
 * Displays list of call logs with filtering
 */

import { getCallLogs, getCallStatistics } from '../../lib/api/calls.js';
import { Spinner, Pagination, Toast } from '../../components/index.js';

/**
 * Create calls list view
 * @returns {HTMLElement}
 */
export function CallsList() {
  const container = document.createElement('div');
  container.className = 'calls-list';

  // Header with stats
  const header = document.createElement('div');
  header.className = 'calls-list__header';
  header.innerHTML = `
    <h2 class="calls-list__title">Call Logs</h2>
    <div class="calls-list__stats">
      <div class="calls-list__stat">
        <i class="material-icons">call</i>
        <div>
          <span class="calls-list__stat-value" id="totalCalls">-</span>
          <span class="calls-list__stat-label">Total Calls</span>
        </div>
      </div>
      <div class="calls-list__stat">
        <i class="material-icons">call_received</i>
        <div>
          <span class="calls-list__stat-value" id="inboundCalls">-</span>
          <span class="calls-list__stat-label">Inbound</span>
        </div>
      </div>
      <div class="calls-list__stat">
        <i class="material-icons">call_made</i>
        <div>
          <span class="calls-list__stat-value" id="outboundCalls">-</span>
          <span class="calls-list__stat-label">Outbound</span>
        </div>
      </div>
      <div class="calls-list__stat">
        <i class="material-icons">timer</i>
        <div>
          <span class="calls-list__stat-value" id="avgDuration">-</span>
          <span class="calls-list__stat-label">Avg Duration</span>
        </div>
      </div>
    </div>
  `;

  // Filters
  const filters = document.createElement('div');
  filters.className = 'calls-list__filters';
  filters.innerHTML = `
    <select class="calls-list__filter" id="directionFilter">
      <option value="">All Directions</option>
      <option value="inbound">Inbound</option>
      <option value="outbound">Outbound</option>
    </select>
    <select class="calls-list__filter" id="statusFilter">
      <option value="">All Statuses</option>
      <option value="completed">Completed</option>
      <option value="missed">Missed</option>
      <option value="busy">Busy</option>
      <option value="failed">Failed</option>
    </select>
    <input type="search" class="calls-list__search" placeholder="Search phone number..." id="callSearch" />
  `;

  // Calls table
  const tableContainer = document.createElement('div');
  tableContainer.className = 'calls-list__table';
  tableContainer.appendChild(Spinner());

  // Pagination
  const paginationContainer = document.createElement('div');
  paginationContainer.className = 'calls-list__pagination';

  container.appendChild(header);
  container.appendChild(filters);
  container.appendChild(tableContainer);
  container.appendChild(paginationContainer);

  // State
  let currentPage = 1;
  const pageSize = 20;

  // Load data
  loadStatistics(header);
  loadCalls(tableContainer, paginationContainer, { page: currentPage, page_size: pageSize });

  // Setup filters
  const directionFilter = filters.querySelector('#directionFilter');
  const statusFilter = filters.querySelector('#statusFilter');
  const searchInput = filters.querySelector('#callSearch');

  function applyFilters() {
    currentPage = 1;
    tableContainer.innerHTML = '';
    tableContainer.appendChild(Spinner());
    
    const filterParams = {
      page: currentPage,
      page_size: pageSize,
    };

    if (directionFilter.value) filterParams.direction = directionFilter.value;
    if (statusFilter.value) filterParams.status = statusFilter.value;
    if (searchInput.value) filterParams.search = searchInput.value;

    loadCalls(tableContainer, paginationContainer, filterParams);
  }

  directionFilter.onchange = applyFilters;
  statusFilter.onchange = applyFilters;

  let searchTimeout;
  searchInput.oninput = () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(applyFilters, 500);
  };

  return container;
}

/**
 * Load and display statistics
 */
async function loadStatistics(header) {
  try {
    const stats = await getCallStatistics();

    header.querySelector('#totalCalls').textContent = stats.total;
    header.querySelector('#inboundCalls').textContent = stats.inbound;
    header.querySelector('#outboundCalls').textContent = stats.outbound;
    header.querySelector('#avgDuration').textContent = formatDuration(stats.averageDuration);

  } catch (error) {
    console.error('Error loading statistics:', error);
    Toast.error(error.message || 'Failed to load call statistics');
  }
}

/**
 * Load and display calls
 */
async function loadCalls(tableContainer, paginationContainer, params) {
  try {
    const data = await getCallLogs(params);

    tableContainer.innerHTML = '';

    if (data.results.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'calls-list__empty';
      empty.innerHTML = `
        <i class="material-icons">phone_disabled</i>
        <p>No call logs found</p>
      `;
      tableContainer.appendChild(empty);
      return;
    }

    // Create table
    const table = document.createElement('table');
    table.className = 'calls-list__table-element';
    table.innerHTML = `
      <thead>
        <tr>
          <th>Direction</th>
          <th>Phone Number</th>
          <th>Status</th>
          <th>Duration</th>
          <th>Date & Time</th>
          <th>Related To</th>
          <th>Notes</th>
        </tr>
      </thead>
      <tbody></tbody>
    `;

    const tbody = table.querySelector('tbody');

    data.results.forEach(call => {
      const row = createCallRow(call);
      tbody.appendChild(row);
    });

    tableContainer.appendChild(table);

    // Update pagination
    paginationContainer.innerHTML = '';
    paginationContainer.appendChild(Pagination({
      page: params.page,
      pageSize: params.page_size,
      total: data.count,
      onChange: (page) => {
        tableContainer.innerHTML = '';
        tableContainer.appendChild(Spinner({ text: 'Loading…' }));
        loadCalls(tableContainer, paginationContainer, { ...params, page });
      },
    }));

  } catch (error) {
    console.error('Error loading calls:', error);
    Toast.error(error.message || 'Failed to load call logs');

    tableContainer.innerHTML = `
      <div class="calls-list__error">
        <i class="material-icons">error_outline</i>
        <p>Failed to load call logs</p>
        <button class="mdc-button mdc-button--raised" onclick="location.reload()">Retry</button>
      </div>
    `;
  }
}

/**
 * Create call row
 */
function createCallRow(call) {
  const row = document.createElement('tr');
  row.className = 'calls-list__row';

  const directionIcon = call.direction === 'inbound' ? 'call_received' : 'call_made';
  const statusClass = `calls-list__status--${call.status}`;

  row.innerHTML = `
    <td>
      <i class="material-icons">${directionIcon}</i>
      <span>${call.direction}</span>
    </td>
    <td><strong>${call.phone_number}</strong></td>
    <td><span class="calls-list__status ${statusClass}">${call.status}</span></td>
    <td>${call.duration ? formatDuration(call.duration) : '-'}</td>
    <td>${formatDateTime(call.started_at)}</td>
    <td>${getRelatedEntity(call)}</td>
    <td>${call.notes || '-'}</td>
  `;

  row.onclick = () => {
    // Navigate to call detail or show modal
    showCallDetail(call);
  };

  return row;
}

/**
 * Get related entity info
 */
function getRelatedEntity(call) {
  if (call.related_lead) {
    return `<a href="#/leads/${call.related_lead}">Lead #${call.related_lead}</a>`;
  }
  if (call.related_contact) {
    return `<a href="#/contacts/${call.related_contact}">Contact #${call.related_contact}</a>`;
  }
  return '-';
}

/**
 * Format duration in seconds to readable format
 */
function formatDuration(seconds) {
  if (!seconds) return '0s';
  
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hrs > 0) {
    return `${hrs}h ${mins}m ${secs}s`;
  }
  if (mins > 0) {
    return `${mins}m ${secs}s`;
  }
  return `${secs}s`;
}

/**
 * Format date time
 */
function formatDateTime(isoString) {
  const date = new Date(isoString);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Show call detail modal
 */
function showCallDetail(call) {
  // TODO: Implement call detail modal
  console.log('Show call detail:', call);
}

export default CallsList;
