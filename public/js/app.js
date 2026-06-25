const token = localStorage.getItem('crm_token');
if (!token) {
  window.location.href = 'login.html';
}

document.getElementById('userLabel').textContent = localStorage.getItem('crm_username') || 'admin';

const authHeaders = {
  'Content-Type': 'application/json',
  Authorization: `Bearer ${token}`,
};

let currentLeads = [];
let activeLeadId = null;
let searchDebounce = null;

// ---------- helpers ----------

function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2200);
}

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) +
    ' · ' + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

async function api(path, options = {}) {
  const res = await fetch(path, { ...options, headers: { ...authHeaders, ...(options.headers || {}) } });

  if (res.status === 401) {
    localStorage.removeItem('crm_token');
    localStorage.removeItem('crm_username');
    window.location.href = 'login.html';
    return null;
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Request failed.');
  return data;
}

// ---------- stats / pipeline bar ----------

async function loadStats() {
  try {
    const stats = await api('/api/leads/stats');
    if (!stats) return;

    document.getElementById('statTotal').textContent = stats.total;
    document.getElementById('statRate').textContent = `${stats.conversionRate}%`;
    document.getElementById('countNew').textContent = stats.new;
    document.getElementById('countContacted').textContent = stats.contacted;
    document.getElementById('countConverted').textContent = stats.converted;

    const segs = [
      { el: document.getElementById('segNew'), count: stats.new, label: 'New' },
      { el: document.getElementById('segContacted'), count: stats.contacted, label: 'Contacted' },
      { el: document.getElementById('segConverted'), count: stats.converted, label: 'Converted' },
    ];

    segs.forEach(({ el, count, label }) => {
      const pct = stats.total ? (count / stats.total) * 100 : 0;
      el.style.flexBasis = `${pct}%`;
      el.classList.toggle('empty', count === 0);
      el.textContent = pct > 12 ? `${label} ${count}` : count > 0 ? count : '';
    });
  } catch (err) {
    showToast(err.message);
  }
}

// ---------- leads table ----------

function statusPill(status) {
  return `<span class="status-pill status-${status}">${status}</span>`;
}

function renderLeads() {
  const tbody = document.getElementById('leadsBody');
  const emptyState = document.getElementById('emptyState');

  if (currentLeads.length === 0) {
    tbody.innerHTML = '';
    emptyState.style.display = 'block';
    return;
  }

  emptyState.style.display = 'none';

  tbody.innerHTML = currentLeads
    .map(
      (lead) => `
      <tr data-id="${lead.id}">
        <td>
          <div class="cell-name">${escapeHtml(lead.name)}</div>
          <div class="cell-sub">${escapeHtml(lead.email)}</div>
        </td>
        <td class="cell-sub">${escapeHtml(lead.source)}</td>
        <td>${statusPill(lead.status)}</td>
        <td class="cell-date">${formatDate(lead.createdAt)}</td>
      </tr>
    `
    )
    .join('');

  tbody.querySelectorAll('tr').forEach((row) => {
    row.addEventListener('click', () => openDrawer(row.dataset.id));
  });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}

async function loadLeads() {
  const search = document.getElementById('searchInput').value.trim();
  const status = document.getElementById('statusFilter').value;

  const params = new URLSearchParams();
  if (search) params.set('search', search);
  if (status) params.set('status', status);

  try {
    const data = await api(`/api/leads?${params.toString()}`);
    if (!data) return;
    currentLeads = data.leads;
    renderLeads();
  } catch (err) {
    showToast(err.message);
  }
}

async function refreshAll() {
  await Promise.all([loadStats(), loadLeads()]);
}

// ---------- drawer ----------

async function openDrawer(id) {
  try {
    const data = await api(`/api/leads/${id}`);
    if (!data) return;
    const lead = data.lead;
    activeLeadId = lead.id;

    document.getElementById('drawerName').textContent = lead.name;
    document.getElementById('drawerEmail').textContent = lead.email;
    document.getElementById('drawerPhone').textContent = lead.phone || 'No phone provided';
    document.getElementById('drawerSource').textContent = `Source: ${lead.source}`;
    document.getElementById('drawerCreated').textContent = `Received ${formatDate(lead.createdAt)}`;
    document.getElementById('drawerMessage').textContent = lead.message || '—';
    document.getElementById('drawerStatus').value = lead.status;

    renderNotes(lead.notes);

    document.getElementById('drawer').classList.add('open');
    document.getElementById('drawerOverlay').classList.add('open');
  } catch (err) {
    showToast(err.message);
  }
}

function closeDrawer() {
  document.getElementById('drawer').classList.remove('open');
  document.getElementById('drawerOverlay').classList.remove('open');
  activeLeadId = null;
}

function renderNotes(notes) {
  const list = document.getElementById('notesList');
  if (!notes || notes.length === 0) {
    list.innerHTML = `<div class="cell-sub">No notes yet — log your first follow-up below.</div>`;
    return;
  }
  list.innerHTML = notes
    .slice()
    .reverse()
    .map(
      (n) => `
      <div class="note-item">
        ${escapeHtml(n.content)}
        <span class="note-time">${formatDate(n.createdAt)}</span>
      </div>
    `
    )
    .join('');
}

document.getElementById('drawerClose').addEventListener('click', closeDrawer);
document.getElementById('drawerOverlay').addEventListener('click', closeDrawer);

document.getElementById('drawerStatus').addEventListener('change', async (e) => {
  if (!activeLeadId) return;
  try {
    await api(`/api/leads/${activeLeadId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: e.target.value }),
    });
    showToast('Status updated.');
    await refreshAll();
  } catch (err) {
    showToast(err.message);
  }
});

document.getElementById('addNoteBtn').addEventListener('click', async () => {
  const input = document.getElementById('noteInput');
  const content = input.value.trim();
  if (!content || !activeLeadId) return;

  try {
    const data = await api(`/api/leads/${activeLeadId}/notes`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
    if (!data) return;
    input.value = '';
    renderNotes(data.lead.notes);
    showToast('Note added.');
  } catch (err) {
    showToast(err.message);
  }
});

document.getElementById('deleteLeadBtn').addEventListener('click', async () => {
  if (!activeLeadId) return;
  if (!confirm('Delete this lead permanently? This cannot be undone.')) return;

  try {
    await api(`/api/leads/${activeLeadId}`, { method: 'DELETE' });
    showToast('Lead deleted.');
    closeDrawer();
    await refreshAll();
  } catch (err) {
    showToast(err.message);
  }
});

// ---------- toolbar ----------

document.getElementById('searchInput').addEventListener('input', () => {
  clearTimeout(searchDebounce);
  searchDebounce = setTimeout(loadLeads, 250);
});

document.getElementById('statusFilter').addEventListener('change', loadLeads);
document.getElementById('refreshBtn').addEventListener('click', refreshAll);

// ---------- logout ----------

document.getElementById('logoutBtn').addEventListener('click', () => {
  localStorage.removeItem('crm_token');
  localStorage.removeItem('crm_username');
  window.location.href = 'login.html';
});

// ---------- init ----------

refreshAll();
