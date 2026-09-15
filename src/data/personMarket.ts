import { MarketPeriod, Person, PersonMarket, PersonMarketPoint } from '../types';

const periodConfig: Record<MarketPeriod, { spanMs: number; points: number }> = {
  '1D': { spanMs: 24 * 60 * 60 * 1000, points: 25 },
  '1W': { spanMs: 7 * 24 * 60 * 60 * 1000, points: 8 },
  '1M': { spanMs: 30 * 24 * 60 * 60 * 1000, points: 31 },
  '1Y': { spanMs: 365 * 24 * 60 * 60 * 1000, points: 13 },
  '5Y': { spanMs: 5 * 365 * 24 * 60 * 60 * 1000, points: 26 },
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function stableHash(value: string) {
  let hash = 2166136261;
  for (const character of value) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash >>> 0);
}

function parseReach(value?: string) {
  if (!value) return 0;
  const match = value.replace(/,/g, '').match(/([\d.]+)\s*([kmb])?/i);
  if (!match) return 0;
  const multiplier = match[2]?.toLowerCase() === 'b' ? 1_000_000_000 : match[2]?.toLowerCase() === 'm' ? 1_000_000 : match[2]?.toLowerCase() === 'k' ? 1_000 : 1;
  return Number(match[1]) * multiplier;
}

function formatLabel(date: Date, period: MarketPeriod) {
  if (period === '1D') return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (period === '1W' || period === '1M') return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  return date.toLocaleDateString([], { month: 'short', year: '2-digit' });
}

function makeHistory(index: number, change: number, period: MarketPeriod, seed: number, now: number) {
  const config = periodConfig[period];
  const points: PersonMarketPoint[] = [];
  const startValue = clamp(index / (1 + change / 100), 25, 1_500);
  for (let position = 0; position < config.points; position += 1) {
    const progress = config.points <= 1 ? 1 : position / (config.points - 1);
    const wave = Math.sin((position + seed % 13) * 0.9) * Math.max(2, index * 0.012);
    const value = clamp(startValue + (index - startValue) * progress + wave * Math.sin(progress * Math.PI), 10, 1_500);
    const timestamp = new Date(now - config.spanMs + config.spanMs * progress);
    points.push({ timestamp: timestamp.toISOString(), label: formatLabel(timestamp, period), value: Number(value.toFixed(1)) });
  }
  return points;
}

export function buildPersonMarket(person: Pick<Person, 'id' | 'name' | 'profileUrl' | 'verified' | 'followersCount' | 'subscriberCountRaw' | 'votes' | 'shares' | 'updatedAt'>, now = Date.now()): PersonMarket {
  const seed = stableHash(`${person.id}:${person.name}`);
  const reach = person.subscriberCountRaw || parseReach(person.followersCount);
  const reachBoost = Math.min(30, reach > 0 ? Math.log10(reach + 1) * 5 : 0);
  const sourceBoost = person.profileUrl?.includes('wikipedia.org') ? 10 : 5;
  const publicSignal = Math.round(clamp(45 + (seed % 25) + reachBoost + sourceBoost + (person.verified ? 5 : 0), 1, 100));
  const index = Number((publicSignal * 8 + 120 + (seed % 80)).toFixed(1));
  const changes = {
    '1D': Number((((seed % 170) - 85) / 10).toFixed(1)),
    '1W': Number(((((seed >> 4) % 260) - 130) / 10).toFixed(1)),
    '1M': Number(((((seed >> 8) % 360) - 150) / 10).toFixed(1)),
    '1Y': Number(((((seed >> 12) % 520) - 120) / 10).toFixed(1)),
    '5Y': Number(((((seed >> 16) % 760) + 20) / 10).toFixed(1)),
  };
  const history = {
    '1D': makeHistory(index, changes['1D'], '1D', seed, now),
    '1W': makeHistory(index, changes['1W'], '1W', seed, now),
    '1M': makeHistory(index, changes['1M'], '1M', seed, now),
    '1Y': makeHistory(index, changes['1Y'], '1Y', seed, now),
    '5Y': makeHistory(index, changes['5Y'], '5Y', seed, now),
  };
  return {
    index,
    publicSignal,
    communityVotes: person.votes,
    activity24h: person.votes + person.shares,
    change24h: changes['1D'],
    change7d: changes['1W'],
    change30d: changes['1M'],
    change1y: changes['1Y'],
    change5y: changes['5Y'],
    trend: changes['1D'] > 0.5 ? 'up' : changes['1D'] < -0.5 ? 'down' : 'flat',
    history,
    dataMode: 'public-signal-model',
    lastUpdatedAt: new Date(now).toISOString(),
    sources: ['Public source profile', 'Visible social reach where available', 'Organic 1v1Vote activity kept separate'],
  };
}
