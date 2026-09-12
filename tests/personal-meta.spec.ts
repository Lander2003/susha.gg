import { test, expect } from '@playwright/test';

const url = process.env.META_TEST_URL || 'http://localhost:5173';
const stats = { games: 10, wins: 6, losses: 4, winRate: 60, kda: 3.1,
  deathsPerGame: 3, csPerMinute: 7, killParticipation: 55, visionPerMinute: 0.8,
  damagePerMinute: 650, goldPerMinute: 400 };
const emptyStats = { ...stats, games: 0, wins: 0, losses: 0, winRate: null };
const report = (nextCount: number | null) => ({
  overall: stats, recent: stats, previous: emptyStats, primaryRole: 'MIDDLE',
  roles: [{ ...stats, role: 'MIDDLE' }],
  champions: [{ ...stats, champion: 'Ahri', role: 'MIDDLE', recent: stats, previous: emptyStats, assessment: 'Core candidate' }],
  pool: [{ champion: 'Ahri', role: 'MIDDLE', label: 'Strongest established pick', evidence: '60% win rate across 10 mid games (6 wins and 4 losses). This is your strongest result among the established picks in your most-played role.' }],
  insights: [{ title: 'Use Ahri as your next focus pick', evidence: '60% win rate across 10 mid games.', action: 'Prioritize Ahri over your less successful picks for the next 10 ranked games.' }],
  patches: ['16.17'], scanned: 10, excluded: 0, available: 20, nextCount,
  generatedAt: '2026-09-12T12:00:00.000Z', region: 'EUW', days: 90,
});

test('match history is default; analysis preserves partial results and supports retry and all views', async ({ page }) => {
  let attempts = 0;
  const counts: string[] = [];
  await page.route('**/getPlayer?**', route => {
    const name = new URL(route.request().url()).searchParams.get('gameid')!.split('#')[0];
    return route.fulfill({ json: { puuid: name, gameName: name, gameTag: 'EUW', region: 'EUW', rankedSolo: null,
      simplifiedMatches: [], pagination: { start: 0, count: 0, nextStart: 0, hasMore: false } } });
  });
  await page.route('**/personal-meta?**', route => {
    const count = new URL(route.request().url()).searchParams.get('count')!;
    counts.push(count);
    attempts++;
    if (attempts === 2) return route.fulfill({ status: 429, json: { error: 'Analysis is busy. Try continuing shortly.' } });
    return new Promise(resolve => setTimeout(resolve, attempts === 1 ? 150 : 0)).then(() => route.fulfill({ json: report(count === '10' ? 20 : null) }));
  });
  await page.goto(url);
  await page.getByLabel('Riot ID').fill('Example#EUW');
  await page.getByRole('button', { name: 'Search user' }).click();
  await expect(page.getByRole('heading', { name: 'Recent matches' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Analyze my ranked games' })).not.toBeVisible();
  expect(attempts).toBe(0);
  await page.getByRole('button', { name: 'Personal Meta', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Analyze my ranked games' })).toBeVisible();
  await page.getByRole('button', { name: 'Analyze my ranked games' }).click();
  await expect(page.locator('.meta-loading')).toBeVisible();
  await page.screenshot({ path: test.info().outputPath('personal-meta-loading.png'), fullPage: true });
  await expect(page.getByRole('alert')).toContainText('Analysis is busy');
  await expect(page.getByRole('heading', { name: 'Ahri stands out in Mid' })).toBeVisible();
  await page.getByRole('button', { name: 'Continue analysis' }).click();
  await expect(page.locator('.meta-coverage')).toContainText('Analysis complete');
  expect(counts).toEqual(['10', '20', '20']);
  await page.getByRole('button', { name: 'Statistics', exact: true }).click();
  await expect(page.locator('.meta-table').first()).toContainText('Ahri');
  await page.getByRole('button', { name: 'Improvement plan', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Use Ahri as your next focus pick' })).toBeVisible();
  await page.getByRole('button', { name: 'Overview', exact: true }).click();
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.screenshot({ path: test.info().outputPath('personal-meta-desktop.png'), fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: test.info().outputPath('personal-meta-mobile.png'), fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.getByRole('button', { name: 'Statistics', exact: true }).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.getByLabel('Riot ID').fill('Another#EUW');
  await page.getByRole('button', { name: 'Search user' }).click();
  await expect(page.getByRole('heading', { name: 'Recent matches' })).toBeVisible();
  await page.getByRole('button', { name: 'Personal Meta', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Analyze my ranked games' })).toBeVisible();
  await expect(page.locator('.meta-coverage')).toHaveCount(0);
});
