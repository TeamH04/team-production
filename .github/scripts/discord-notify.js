const fs = require('fs');

// ---- ユーティリティ関数 ----

/**
 * discord-map.json から Discord ユーザー ID マッピングを読み込む
 * @returns {Object} GitHub login から Discord ID へのマッピング
 */
function loadDiscordMap() {
  try {
    return JSON.parse(fs.readFileSync('.github/discord-map.json', 'utf8'));
  } catch {
    console.warn('discord-map.json が読めません。メンションなしで送ります。');
    return {};
  }
}

/**
 * Discord メンション文字列を取得（マップにない場合は GitHub ハンドルで代替）
 * @param {string} login - GitHub ログイン名
 * @param {Object} map - Discord マップ
 * @returns {string} Discord メンション或いは GitHub ハンドル
 */
function mentionOf(login, map) {
  const id = map[login];
  return id ? `<@${id}>` : `@${login}`;
}

/**
 * 配列から重複を除去し、falsy 値をフィルタリング
 * @param {Array} arr - 入力配列
 * @returns {Array} 一意な値のみを含む配列
 */
function uniq(arr) {
  return [...new Set(arr)].filter(Boolean);
}

/**
 * Discord webhook へメッセージを投稿
 * @param {string} content - メッセージ内容
 * @param {Object} core - GitHub Actions コアオブジェクト
 * @throws {Error} Webhook URL が未設定の場合
 */
async function post(content, core) {
  const url = process.env.DISCORD_WEBHOOK_URL;
  if (!url) {
    throw new Error('DISCORD_WEBHOOK_URL が未設定です');
  }

  const body = { content };
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    core.setFailed(`Discord送信失敗: ${res.status} ${await res.text()}`);
  }
}

// ---- イベントハンドラー ----

/**
 * Issues イベントを処理
 */
async function handleIssues(context, map, core) {
  const action = context.payload.action;
  if (action !== 'opened' && action !== 'assigned') {
    return;
  }

  const issue = context.payload.issue;
  const assignee = context.payload.assignee?.login;

  if (!assignee) {
    return;
  }

  const repo = context.repo.repo;
  const owner = context.repo.owner;
  const url = issue.html_url;
  const title = issue.title;
  const mentions = mentionOf(assignee, map);

  const msg = [
    `📝 **Issue Assigned** in \`${owner}/${repo}\``,
    `**${title}**`,
    `${mentions}`,
    `${url}`,
  ].join('\n');

  await post(msg, core);
}

/**
 * Pull Request イベントを処理
 */
async function handlePullRequest(context, map, core) {
  const action = context.payload.action;
  const pr = context.payload.pull_request;
  const owner = context.repo.owner;
  const repo = context.repo.repo;

  // レビュー依頼時
  if (action === 'review_requested') {
    const reqReviewer = context.payload.requested_reviewer?.login;
    if (!reqReviewer) {
      return;
    }

    const msg = [
      `👀 **Review Requested** in \`${owner}/${repo}\``,
      `**${pr.title}** by @${pr.user.login}`,
      `${mentionOf(reqReviewer, map)}`,
      `${pr.html_url}`,
    ].join('\n');

    await post(msg, core);
  }

  // PR 作成時、Draft 解除時、再度開いた時
  else if (action === 'opened' || action === 'ready_for_review' || action === 'reopened') {
    const reviewers = (pr.requested_reviewers || []).map(u => u.login);
    if (reviewers.length === 0) {
      return;
    }

    const msg = [
      `🆕 **PR Opened** in \`${owner}/${repo}\``,
      `**${pr.title}** by @${pr.user.login}`,
      `Reviewers: ${uniq(reviewers)
        .map(r => mentionOf(r, map))
        .join(' ')}`,
      `${pr.html_url}`,
    ].join('\n');

    await post(msg, core);
  }

  // PR マージ時
  else if (action === 'closed' && pr.merged) {
    const msg = [
      `✅ **PR Merged** in \`${owner}/${repo}\``,
      `**${pr.title}** by @${pr.user.login}`,
      `${pr.html_url}`,
    ].join('\n');

    await post(msg, core);
  }
}

/**
 * Pull Request Review イベントを処理
 */
async function handlePullRequestReview(context, map, core) {
  const action = context.payload.action;
  if (action !== 'submitted') {
    return;
  }

  const pr = context.payload.pull_request;
  const review = context.payload.review;
  const owner = context.repo.owner;
  const repo = context.repo.repo;

  const state = (review.state || '').toUpperCase();
  const reviewer = review.user?.login || '(unknown)';
  const author = pr.user?.login || '(unknown)';

  // 自分の PR を自分でレビューした場合はスキップ
  if (author && reviewer && author === reviewer) {
    return;
  }

  const authorMention = mentionOf(author, map);
  const body = (review.body || '').trim();
  const snippet = body ? (body.length > 200 ? body.slice(0, 200) + '…' : body) : '';

  const msgLines = [
    `💬 **PR Review (${state})** in \`${owner}/${repo}\``,
    `**${pr.title}**`,
    `Reviewer: ${mentionOf(reviewer, map)}`,
    `${authorMention}`,
    `${pr.html_url}#pullrequestreview-${review.id}`,
  ];

  if (snippet) {
    msgLines.push('\n> ' + snippet.replace(/\n/g, '\n> '));
  }

  await post(msgLines.join('\n'), core);
}

// ---- メイン処理 ----

/**
 * メインハンドラー
 */
async function main(context, core) {
  const map = loadDiscordMap();
  const eventName = context.eventName;

  try {
    if (eventName === 'issues') {
      await handleIssues(context, map, core);
    } else if (eventName === 'pull_request') {
      await handlePullRequest(context, map, core);
    } else if (eventName === 'pull_request_review') {
      await handlePullRequestReview(context, map, core);
    }
  } catch (error) {
    core.setFailed(`エラー: ${error.message}`);
  }
}

module.exports = { main };
