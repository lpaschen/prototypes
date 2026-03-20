/**
 * scaffold.js — Campaign link scaffolding engine
 * Generates UTM params, mock short links, tags per channel
 */

import { cleanName, buildLinkName, buildGoalSlug } from './naming.js';

const CHANNEL_CONFIG = {
  email:   { source: 'email',      medium: 'email'    },
  social:  { source: 'social',     medium: 'social'   },
  paid:    { source: 'google-ads', medium: 'cpc'      },
  organic: { source: 'organic',    medium: 'organic'  },
};

function buildUTMString(params) {
  return Object.entries(params)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');
}

function mockShortLink(seed) {
  // Deterministic 6-char hash from seed string
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash + seed.charCodeAt(i)) | 0;
  }
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  let n = Math.abs(hash);
  for (let i = 0; i < 6; i++) {
    result += chars[n % chars.length];
    n = Math.floor(n / chars.length) || (n + 7919);
  }
  return `https://bit.ly/m-${result}`;
}

export function scaffoldCampaign({ name, goalLabel, goalTarget, channels, urls }) {
  const campaignClean = cleanName(name);
  const goalSlug = buildGoalSlug(goalLabel, goalTarget);
  const dateStr = new Date().toISOString().slice(0, 7); // YYYY-MM

  const links = channels.map((channel) => {
    const config = CHANNEL_CONFIG[channel];
    const destinationUrl = urls[channel] || 'https://example.com';
    const linkName = buildLinkName(campaignClean, channel, dateStr);

    const utms = {
      utm_campaign: campaignClean,
      utm_source:   config.source,
      utm_medium:   config.medium,
      utm_content:  goalSlug,
    };

    const separator = destinationUrl.includes('?') ? '&' : '?';
    const fullUrl = `${destinationUrl}${separator}${buildUTMString(utms)}`;
    const shortUrl = mockShortLink(`${campaignClean}-${channel}`);

    const tags = [
      campaignClean,
      channel,
      cleanName(goalLabel),
      `target-${goalTarget}`,
    ];

    return { channel, linkName, destinationUrl, fullUrl, shortUrl, utms, tags };
  });

  return {
    campaignName: name,
    campaignClean,
    goal: { label: goalLabel, target: goalTarget, slug: goalSlug },
    createdAt: new Date().toISOString(),
    links,
  };
}
