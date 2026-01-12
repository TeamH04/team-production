// @ts-check
/// <reference types="@actions/github/lib/context" />

/**
 * Discord通知スクリプト
 * GitHub Actionsのgithub-scriptから呼び出される
 *
 * @param {object} params
 * @param {import('@actions/github/lib/context').Context} params.context - GitHub Actionsのcontext
 * @param {typeof import('@actions/core')} params.core - GitHub Actionsのcore
 * @param {typeof import('fs')} params.fs - Node.js fs module
 */
module.exports = async ({ context, core, fs }) => {
  // --- 共通: マップ読込とユーティリティ ---
  /** @type {Record<string, string>} */
  let map = {};
  try {
    map = JSON.parse(fs.readFileSync('.github/discord-map.json', 'utf8'));
  } catch {
    core.warning('discord-map.json が読めません。メンションなしで送ります。');
  }

  /**
   * @param {string} login
   * @returns {string}
   */
  const mentionOf = login => {
    const id = map[login];
    return id ? `<@${id}>` : `@${login}`;
  };

  /**
   * @param {string[]} arr
   * @returns {string[]}
   */
  const uniq = arr => [...new Set(arr)].filter(Boolean);

  const COPILOT_LOGINS = ['github-copilot', 'github-copilot[bot]', 'copilot', 'copilot[bot]'];
  /**
   * @param {string | undefined} login
   * @returns {boolean}
   */
  const isCopilotLogin = login => {
    if (!login) return false;
    return COPILOT_LOGINS.includes(login.toLowerCase());
  };

  /**
   * 一括通知のための共通ロジック
   * - 複数人が同時に追加された場合、最初のイベントでのみ全員分を通知
   * - botユーザーを除外
   * @param {string|undefined} addedUser - 今回追加されたユーザー
   * @param {string[]} allUsers - 全ユーザーのリスト
   * @param {{ filterBots?: boolean }} [options={}] - オプション
   * @returns {{ shouldNotify: boolean, mentions: string }} 通知すべきか＆メンション文字列
   */
  const getBatchMentions = (addedUser, allUsers, options = {}) => {
    const { filterBots = false } = options;

    // 追加されたユーザーがいない場合は通知しない
    if (!addedUser) return { shouldNotify: false, mentions: '' };

    // botフィルタ（オプション）
    let filteredUsers = allUsers;
    if (filterBots) {
      filteredUsers = allUsers.filter(login => !isCopilotLogin(login));
    }

    // ユーザーがいない場合は通知しない
    if (filteredUsers.length === 0) return { shouldNotify: false, mentions: '' };

    // 重複通知防止: 今回追加されたユーザーがリストの最初の場合のみ通知
    const firstUser = filteredUsers[0];
    if (addedUser !== firstUser) return { shouldNotify: false, mentions: '' };

    const mentions = uniq(filteredUsers).map(mentionOf).join(' ');
    return { shouldNotify: true, mentions };
  };

  /**
   * @param {string} content
   */
  const post = async content => {
    const url = process.env.DISCORD_WEBHOOK_URL;
    if (!url) throw new Error('DISCORD_WEBHOOK_URL が未設定です');
    const body = { content };
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      core.setFailed(`Discord送信失敗: ${res.status} ${await res.text()}`);
    }
  };

  const ev = context.eventName;
  const action = context.payload.action;

  // ---- ケース分岐 ----
  if (ev === 'issues') {
    // 仕様: Issueにアサインした時に全員へまとめてメンション
    if (action === 'opened' || action === 'assigned') {
      const issue = context.payload.issue;
      if (!issue) return;
      const { repo, owner } = context.repo;

      const addedAssignee = context.payload.assignee?.login;
      const allAssignees = (issue.assignees || []).map((/** @type {any} */ u) => u.login);

      const { shouldNotify, mentions } = getBatchMentions(addedAssignee, allAssignees);
      if (!shouldNotify) return;

      const msg = [
        `📝 **Issue Assigned** in \`${owner}/${repo}\``,
        `**${issue.title}**`,
        `${mentions}`,
        `${issue.html_url}`,
      ].join('\n');

      await post(msg);
    }
  } else if (ev === 'pull_request') {
    const pr = context.payload.pull_request;
    if (!pr) return;
    const { repo, owner } = context.repo;

    if (action === 'review_requested') {
      // 仕様: PRにレビュアーをアサインした時に全員へまとめてメンション
      const reqReviewer = context.payload.requested_reviewer?.login;
      const allReviewers = (pr.requested_reviewers || []).map((/** @type {any} */ u) => u.login);

      const { shouldNotify, mentions } = getBatchMentions(reqReviewer, allReviewers, {
        filterBots: true,
      });
      if (!shouldNotify) return;

      const msg = [
        `👀 **Review Requested** in \`${owner}/${repo}\``,
        `**${pr.title}** by @${pr.user.login}`,
        `${mentions}`,
        `${pr.html_url}`,
      ].join('\n');
      await post(msg);
    } else if (action === 'opened' || action === 'ready_for_review' || action === 'reopened') {
      // PR作成時／Draft解除時: reviewerが同時指定されていたら通知
      const allReviewers = (pr.requested_reviewers || []).map((/** @type {any} */ u) => u.login);
      const filteredReviewers = allReviewers.filter(
        (/** @type {string} */ login) => !isCopilotLogin(login)
      );

      if (filteredReviewers.length > 0) {
        const mentions = uniq(filteredReviewers).map(mentionOf).join(' ');
        const msg = [
          `🆕 **PR Opened** in \`${owner}/${repo}\``,
          `**${pr.title}** by @${pr.user.login}`,
          `Reviewers: ${mentions}`,
          `${pr.html_url}`,
        ].join('\n');
        await post(msg);
      }
    } else if (action === 'closed' && pr.merged) {
      // 仕様: PRがmergeされたときに通知
      const msg = [
        `✅ **PR Merged** in \`${owner}/${repo}\``,
        `**${pr.title}** by @${pr.user.login}`,
        `${pr.html_url}`,
      ].join('\n');
      await post(msg);
    }
  } else if (ev === 'pull_request_review') {
    // 仕様: PRにreviewが来たときに、PR作成者へ通知
    if (action === 'submitted') {
      const pr = context.payload.pull_request;
      const review = context.payload.review;
      if (!pr || !review) return;
      const { repo, owner } = context.repo;

      const state = (review.state || '').toUpperCase(); // APPROVED / CHANGES_REQUESTED / COMMENTED
      const reviewer = review.user?.login || '(unknown)';
      const author = pr.user?.login || '(unknown)';

      // 自分のPRを自分でレビューした場合は通知しない
      if (author && reviewer && author === reviewer) return;

      // レビュー本文を軽く要約（長すぎるとWebhookが弾くので先頭だけ）
      const body = (review.body || '').trim();
      const snippet = body ? (body.length > 200 ? body.slice(0, 200) + '…' : body) : '';

      const msgLines = [
        `💬 **PR Review (${state})** in \`${owner}/${repo}\``,
        `**${pr.title}**`,
        `Reviewer: ${mentionOf(reviewer)}`,
        `${mentionOf(author)}`,
        // cspell:disable-next-line
        `${pr.html_url}#pullrequestreview-${review.id}`,
      ];
      if (snippet) {
        msgLines.push('\n> ' + snippet.replace(/\n/g, '\n> '));
      }

      await post(msgLines.join('\n'));
    }
  }

  // push はトリガーしていない（仕様通り通知しない）
};
