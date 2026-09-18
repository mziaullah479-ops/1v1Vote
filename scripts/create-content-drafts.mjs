import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const origin = (process.env.SITE_ORIGIN || process.env.PUBLIC_SITE_ORIGIN || 'https://1v1vote.com').replace(/\/$/, '');
const outputDir = process.env.CONTENT_OUTPUT_DIR || path.join(process.cwd(), 'content-output');
const feedUrl = `${origin}/feed.xml`;

function decodeXml(value) {
  return value.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');
}

function readTag(item, tag) {
  const match = item.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`, 'i'));
  return match ? decodeXml(match[1].trim()) : '';
}

const response = await fetch(feedUrl);
if (!response.ok) throw new Error(`Could not read ${feedUrl}: ${response.status}`);
const xml = await response.text();
const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)].map((match) => match[1]).slice(0, 12);
const generatedAt = new Date().toISOString();
const lines = [
  '# 1v1Vote organic content drafts',
  '',
  `Generated: ${generatedAt}`,
  `Source feed: ${feedUrl}`,
  '',
  '> Review every draft before publishing. This file is a content aid, not an auto-publisher.',
  '',
];

for (const [index, item] of items.entries()) {
  const title = readTag(item, 'title');
  const link = readTag(item, 'link');
  const description = readTag(item, 'description');
  const shareUrl = `${link}${link.includes('?') ? '&' : '?'}utm_source=organic&utm_medium=social&utm_campaign=profile-discovery`;
  lines.push(`## ${index + 1}. ${title}`);
  lines.push('');
  lines.push(`${description}`);
  lines.push('');
  lines.push(`Explore the profile: ${shareUrl}`);
  lines.push('');
  lines.push('Suggested tags: #1v1Vote #PublicOpinion #DailyVoting');
  lines.push('');
}

if (!items.length) {
  lines.push('No profile items were available in the feed. Review the live feed before publishing.');
  lines.push('');
}

await mkdir(outputDir, { recursive: true });
await writeFile(path.join(outputDir, 'organic-drafts.md'), lines.join('\n'), 'utf8');
console.log(`Wrote ${items.length} organic content drafts to ${outputDir}`);
