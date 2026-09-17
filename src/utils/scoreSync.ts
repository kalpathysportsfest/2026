import { MatchScoreEntry, TournamentScoresFile } from '../types';
import { INITIAL_SCORES } from '../data/tournamentData';

export const GITHUB_SETTINGS_KEY = 'ksf26_github_settings';

export interface GitHubSettings {
  owner: string;
  repo: string;
  branch: string;
  filePath: string;
  token: string;
}

export function loadGitHubSettings(): GitHubSettings {
  try {
    const raw = localStorage.getItem(GITHUB_SETTINGS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load GitHub settings', e);
  }
  return {
    owner: '',
    repo: '',
    branch: 'main',
    filePath: 'public/data/scores.json',
    token: '',
  };
}

export function saveGitHubSettings(settings: GitHubSettings): void {
  localStorage.setItem(GITHUB_SETTINGS_KEY, JSON.stringify(settings));
}

/**
 * Fetches the latest scores.json from server / GitHub Pages with cache-busting
 */
export async function fetchLiveScores(url: string = './data/scores.json'): Promise<TournamentScoresFile> {
  const cacheBuster = `_t=${Date.now()}`;
  const targetUrl = url.includes('?') ? `${url}&${cacheBuster}` : `${url}?${cacheBuster}`;

  const res = await fetch(targetUrl, {
    cache: 'no-store',
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      Pragma: 'no-cache',
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch scores (${res.status} ${res.statusText})`);
  }

  const data = await res.json();
  return data;
}

/**
 * Formats scores object into standardized TournamentScoresFile
 */
export function formatScoresFile(scores: Record<string, MatchScoreEntry>): TournamentScoresFile {
  return {
    updatedAt: new Date().toISOString(),
    tournament: 'Kalpathy Sports Fest · 2026',
    version: '1.0',
    scores,
  };
}

/**
 * Commits updated scores.json directly to GitHub repo using GitHub REST API
 */
export async function commitScoresToGitHub(
  settings: GitHubSettings,
  scoresData: TournamentScoresFile,
  commitMessage: string = 'Update tournament match scores [via KSF Venue Deck]'
): Promise<{ success: boolean; message: string; sha?: string }> {
  if (!settings.owner || !settings.repo || !settings.token) {
    throw new Error('Please configure your GitHub repository and Personal Access Token in settings.');
  }

  const cleanFilePath = settings.filePath.replace(/^\//, '');
  const apiUrl = `https://api.github.com/repos/${settings.owner}/${settings.repo}/contents/${cleanFilePath}`;

  // 1. Get existing file SHA if it exists
  let existingSha: string | undefined;
  try {
    const getRes = await fetch(`${apiUrl}?ref=${settings.branch}&_t=${Date.now()}`, {
      headers: {
        Authorization: `Bearer ${settings.token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });
    if (getRes.ok) {
      const fileMeta = await getRes.json();
      existingSha = fileMeta.sha;
    }
  } catch (err) {
    console.warn('Could not fetch existing file SHA, will attempt create/update without it', err);
  }

  // 2. Base64 encode JSON
  const contentStr = JSON.stringify(scoresData, null, 2);
  const base64Content = btoa(unescape(encodeURIComponent(contentStr)));

  const payload: Record<string, unknown> = {
    message: commitMessage,
    content: base64Content,
    branch: settings.branch || 'main',
  };

  if (existingSha) {
    payload.sha = existingSha;
  }

  const putRes = await fetch(apiUrl, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${settings.token}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!putRes.ok) {
    const errData = await putRes.json().catch(() => ({}));
    throw new Error(errData.message || `GitHub commit failed with HTTP ${putRes.status}`);
  }

  const result = await putRes.json();
  return {
    success: true,
    message: `Committed successfully to ${settings.branch} (${result.commit?.sha?.slice(0, 7) || 'done'})`,
    sha: result.commit?.sha,
  };
}
