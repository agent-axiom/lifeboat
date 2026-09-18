(() => {
  'use strict';

  const STORAGE_KEY = 'lifeboat:public-sample:v1';
  const SAMPLE = [
    { id: 1, title: 'Refuse to overwrite an existing backup archive', description: 'Make the backup command refuse an existing destination rather than silently replacing an archive.', comment: 'We need an explicit choice before overwriting a backup. This is a fictional report, not a real repository issue.', status: 'Open', labels: ['bug'] },
    { id: 2, title: 'Document recovery from a clean install', description: 'Document the recovery steps for a fresh machine, including where to find the archive and how to start the local tool.', comment: 'A clean-machine walkthrough still needs to happen. This fictional issue is not evidence that one has passed.', status: 'Open', labels: ['priority'] },
    { id: 3, title: 'Preserve executable permissions when restoring a backup', description: 'Restoring a backup should preserve executable permissions, so recovery scripts can be run again.', comment: 'In rc.2, scripts/recover.sh is restored as 0644 instead of 0755. Please reopen this for triage and mark it priority. This is a fictional demo report.', status: 'Closed', labels: ['bug'] }
  ];
  const CONTRACT = {
    id: 'reopen_for_triage',
    guard: 'card_not_archived',
    steps: [{ kind: 'add_label', label: 'priority' }, { kind: 'move_to', status: 'Open' }]
  };
  const byId = (id) => document.getElementById(id);
  const freshState = () => ({ version: 1, selected: 3, accepted: false, items: SAMPLE.map((item) => ({ ...item, labels: [...item.labels], archived: false, revision: 1 })) });
  let state = freshState();
  let storageAvailable = true;

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      const valid = parsed && parsed.version === 1 && typeof parsed.accepted === 'boolean'
        && [1, 2, 3].includes(parsed.selected) && Array.isArray(parsed.items) && parsed.items.length === 3
        && SAMPLE.every((original, index) => {
          const item = parsed.items[index];
          return item && item.id === original.id && ['Open', 'Closed'].includes(item.status)
            && typeof item.archived === 'boolean' && Number.isSafeInteger(item.revision) && item.revision > 0
            && Array.isArray(item.labels) && item.labels.length <= 2
            && new Set(item.labels).size === item.labels.length
            && item.labels.every((label) => ['bug', 'priority'].includes(label));
        });
      if (valid) {
        state = {
          version: 1, selected: parsed.selected, accepted: parsed.accepted,
          items: SAMPLE.map((original, index) => ({ ...original, status: parsed.items[index].status, labels: [...parsed.items[index].labels], archived: parsed.items[index].archived, revision: parsed.items[index].revision }))
        };
      }
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    storageAvailable = false;
  }

  const selected = () => state.items.find((item) => item.id === state.selected);

  function announce(message, error = false) {
    const output = byId('action-status');
    output.textContent = message;
    output.classList.toggle('is-error', error);
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      storageAvailable = true;
    } catch {
      storageAvailable = false;
    }
  }

  function render() {
    const item = selected();
    const list = byId('issue-list');
    list.replaceChildren();
    state.items.forEach((entry) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'issue-button';
      button.setAttribute('aria-pressed', String(entry.id === item.id));
      button.setAttribute('aria-label', `Issue ${entry.id}: ${entry.title}, ${entry.archived ? 'archived' : entry.status}`);
      const meta = document.createElement('span');
      meta.className = 'issue-button-meta';
      const number = document.createElement('span');
      number.textContent = `#${entry.id}`;
      const status = document.createElement('span');
      status.textContent = entry.archived ? 'Archived' : entry.status;
      meta.append(number, status);
      const title = document.createElement('span');
      title.className = 'issue-button-title';
      title.textContent = entry.title;
      button.append(meta, title);
      button.addEventListener('click', () => {
        state.selected = entry.id;
        save();
        render();
        announce(`Selected issue #${entry.id}.`);
        byId('issue-title').setAttribute('tabindex', '-1');
        byId('issue-title').focus({ preventScroll: true });
      });
      list.append(button);
    });
    byId('issue-number').textContent = `ISSUE #${item.id}`;
    byId('issue-title').textContent = item.title;
    byId('issue-description').textContent = item.description;
    byId('issue-comment').textContent = item.comment;
    byId('issue-revision').textContent = `Local revision ${item.revision}`;
    const status = byId('issue-state');
    status.textContent = item.archived ? `${item.status} / Archived` : item.status;
    status.className = `state-pill${item.status === 'Open' ? ' is-open' : ''}${item.archived ? ' is-archived' : ''}`;
    const labels = byId('issue-labels');
    labels.replaceChildren();
    item.labels.forEach((value) => {
      const label = document.createElement('span');
      label.className = `label${value === 'priority' ? ' label-priority' : ''}`;
      label.textContent = value;
      labels.append(label);
    });
    byId('archive-item').checked = item.archived;
    byId('archive-item').disabled = false;
    byId('run-workflow').disabled = !state.accepted;
    byId('action-hint').textContent = !state.accepted ? 'First, review and accept the sample contract.' : item.archived ? 'This item is archived. Run the action to see the guard refuse it.' : 'Adds priority and moves to Open. No model or server request.';
    byId('accept-contract').disabled = state.accepted;
    byId('accept-contract').textContent = state.accepted ? 'Sample contract accepted' : 'Accept sample contract';
    byId('contract-status').textContent = state.accepted ? 'ACCEPTED BY YOU' : 'AWAITING YOUR REVIEW';
    byId('contract-status').classList.toggle('is-accepted', state.accepted);
    byId('storage-status').textContent = storageAvailable ? 'Saved in this browser' : 'Session only: storage unavailable';
    byId('storage-status').title = storageAvailable ? 'Saved locally on this browser. Nothing is uploaded.' : 'Your browser prevented local storage. Export before leaving this page.';
    const open = state.items.filter((entry) => entry.status === 'Open').length;
    byId('demo-summary').textContent = `${open} open, ${state.items.length - open} closed. Original snapshot unchanged.${storageAvailable ? '' : ' Storage unavailable: export before leaving.'}`;
    byId('export-data').disabled = false;
    byId('reset-demo').disabled = false;
  }

  byId('accept-contract').addEventListener('click', () => {
    state.accepted = true;
    save();
    render();
    announce('Contract accepted. You can now run the local workflow.');
    byId('run-workflow').focus({ preventScroll: true });
  });

  byId('run-workflow').addEventListener('click', () => {
    if (!state.accepted) {
      announce('Review and accept the sample contract first.', true);
      return;
    }
    const item = selected();
    if (item.archived) {
      announce('Blocked by card_not_archived. The workflow changed nothing.', true);
      return;
    }
    if (item.status === 'Open' && item.labels.includes('priority')) {
      announce('Already Open with priority. No duplicate label or extra revision was created.');
      return;
    }
    const previous = item.status;
    item.labels = [...new Set([...item.labels, 'priority'])];
    item.status = 'Open';
    item.revision += 1;
    save();
    render();
    announce(`Applied locally: ${previous} to Open, priority present. ${storageAvailable ? 'Saved in this browser.' : 'Session only; export to keep your changes.'}`);
  });

  byId('archive-item').addEventListener('change', (event) => {
    const item = selected();
    item.archived = event.target.checked;
    item.revision += 1;
    save();
    render();
    announce(item.archived ? 'Archived locally. The workflow guard will now block this item.' : 'Unarchived locally. The workflow can run again.');
  });

  byId('export-data').addEventListener('click', () => {
    const payload = {
      format: 'lifeboat.browser-sample.v1',
      notice: 'Fictional browser illustration, not a Player backup or production app contract.',
      exportedAt: new Date().toISOString(),
      contractAccepted: state.accepted,
      workflowSummary: CONTRACT,
      originalSnapshot: SAMPLE,
      currentItems: state.items
    };
    const blob = new Blob([JSON.stringify(payload, null, 2) + '\n'], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'lifeboat-harbor-cli-browser-sample.json';
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 30000);
    announce('JSON download requested. It includes the unchanged original snapshot and your current sample state.');
  });

  byId('reset-demo').addEventListener('click', () => {
    if (!window.confirm('Reset all sample changes and contract acceptance in this browser? Export first if you want to keep them.')) return;
    state = freshState();
    save();
    render();
    announce('Sample reset. Review the contract to start again.');
  });

  render();
})();
