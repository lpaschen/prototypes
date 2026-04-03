/**
 * app.js — Main application controller
 * Wires form → scaffold engine → results view
 */

import { scaffoldCampaign } from './scaffold.js';
import { cleanName } from './naming.js';

const CHANNELS = ['email', 'social', 'paid', 'organic'];

// --- State ---
let currentResult = null;

// --- DOM refs ---
const form          = document.getElementById('campaign-form');
const nameInput     = document.getElementById('campaign-name');
const namePreview   = document.getElementById('name-preview');
const goalLabel     = document.getElementById('goal-label');
const goalTarget    = document.getElementById('goal-target');
const urlFields     = document.getElementById('url-fields');
const resultsSection = document.getElementById('results-section');
const linksContainer = document.getElementById('links-container');
const exportBtn     = document.getElementById('export-btn');
const summaryHeader = document.getElementById('summary-header');

// --- Live name preview ---
nameInput.addEventListener('input', () => {
  const clean = cleanName(nameInput.value);
  namePreview.textContent = clean || '—';
  namePreview.className = clean
    ? 'text-sm font-mono text-emerald-600 mt-1'
    : 'text-sm font-mono text-slate-400 mt-1';
});

// --- Channel checkboxes → show/hide URL fields ---
function renderUrlFields() {
  const checked = CHANNELS.filter(
    ch => document.getElementById(`ch-${ch}`)?.checked
  );
  urlFields.innerHTML = checked.length === 0
    ? '<p class="text-sm text-slate-400 italic">Select at least one channel above.</p>'
    : checked.map(ch => `
        <div class="flex items-center gap-3">
          <label class="w-20 text-sm font-medium text-slate-600 capitalize shrink-0">${ch}</label>
          <input
            type="url"
            id="url-${ch}"
            placeholder="https://yoursite.com/landing-page"
            class="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>
      `).join('');
}

CHANNELS.forEach(ch => {
  document.getElementById(`ch-${ch}`)?.addEventListener('change', renderUrlFields);
});
renderUrlFields();

// --- Form submit ---
form.addEventListener('submit', (e) => {
  e.preventDefault();

  const selectedChannels = CHANNELS.filter(
    ch => document.getElementById(`ch-${ch}`)?.checked
  );

  if (selectedChannels.length === 0) {
    alert('Please select at least one channel.');
    return;
  }

  const urls = {};
  selectedChannels.forEach(ch => {
    urls[ch] = document.getElementById(`url-${ch}`)?.value.trim() || 'https://example.com';
  });

  currentResult = scaffoldCampaign({
    name: nameInput.value.trim(),
    goalLabel: goalLabel.value.trim(),
    goalTarget: parseInt(goalTarget.value, 10) || 0,
    channels: selectedChannels,
    urls,
  });

  renderResults(currentResult);
});

// --- Render results ---
function renderResults(result) {
  summaryHeader.innerHTML = `
    <div class="flex flex-wrap items-center gap-3">
      <span class="text-lg font-semibold text-slate-800">${result.campaignName}</span>
      <span class="font-mono text-sm bg-slate-100 text-slate-600 px-2 py-0.5 rounded">${result.campaignClean}</span>
      <span class="ml-auto bg-indigo-100 text-indigo-700 text-sm font-medium px-3 py-1 rounded-full">
        Goal: ${result.goal.label} &rarr; ${result.goal.target.toLocaleString()}
      </span>
    </div>
  `;

  linksContainer.innerHTML = result.links.map((link, i) => `
    <div class="border border-slate-200 rounded-xl overflow-hidden">
      <!-- Channel header -->
      <div class="flex items-center gap-3 px-4 py-3 bg-slate-50 border-b border-slate-200">
        <span class="channel-badge channel-${link.channel}">${link.channel}</span>
        <span class="font-mono text-sm text-slate-700">${link.linkName}</span>
        <div class="ml-auto flex gap-2">
          <button onclick="copyText('${escapeAttr(link.shortUrl)}', this)" class="copy-btn text-xs">
            Copy Short URL
          </button>
          <button onclick="copyText('${escapeAttr(link.fullUrl)}', this)" class="copy-btn copy-btn-secondary text-xs">
            Copy Full URL
          </button>
        </div>
      </div>

      <!-- Link details -->
      <div class="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <p class="label-sm">Short Link</p>
          <a href="${link.shortUrl}" class="font-mono text-sm text-indigo-600 hover:underline break-all">${link.shortUrl}</a>
        </div>
        <div>
          <p class="label-sm">Destination</p>
          <p class="font-mono text-xs text-slate-600 break-all">${link.destinationUrl}</p>
        </div>
        <div class="md:col-span-2">
          <p class="label-sm">Full URL (with UTMs)</p>
          <p class="font-mono text-xs text-slate-500 break-all">${link.fullUrl}</p>
        </div>
        <div>
          <p class="label-sm">UTM Parameters</p>
          <div class="flex flex-wrap gap-1 mt-1">
            ${Object.entries(link.utms).map(([k, v]) =>
              `<span class="utm-chip"><span class="text-slate-400">${k.replace('utm_', '')}:</span> ${v}</span>`
            ).join('')}
          </div>
        </div>
        <div>
          <p class="label-sm">Tags</p>
          <div class="flex flex-wrap gap-1 mt-1">
            ${link.tags.map(tag => `<span class="tag-chip">${tag}</span>`).join('')}
          </div>
        </div>
      </div>
    </div>
  `).join('');

  resultsSection.classList.remove('hidden');
  resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// --- Copy to clipboard ---
window.copyText = function(text, btn) {
  navigator.clipboard.writeText(text).then(() => {
    const original = btn.textContent;
    btn.textContent = 'Copied!';
    btn.classList.add('copy-btn-success');
    setTimeout(() => {
      btn.textContent = original;
      btn.classList.remove('copy-btn-success');
    }, 1800);
  });
};

// --- Export JSON ---
exportBtn.addEventListener('click', () => {
  if (!currentResult) return;
  const blob = new Blob([JSON.stringify(currentResult, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${currentResult.campaignClean}-links.json`;
  a.click();
});

// --- Escape attribute helper ---
function escapeAttr(str) {
  return str.replace(/'/g, "\\'").replace(/"/g, '&quot;');
}
