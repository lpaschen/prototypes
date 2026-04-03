/**
 * naming.js — Clean naming rules enforcer
 * Converts any string to lowercase-hyphen format
 */

export function cleanName(input) {
  if (!input) return '';
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function buildLinkName(campaignClean, channel, dateStr) {
  return [campaignClean, channel, dateStr].filter(Boolean).join('-');
}

export function buildGoalSlug(label, target) {
  return `${cleanName(label)}-${target}`;
}
