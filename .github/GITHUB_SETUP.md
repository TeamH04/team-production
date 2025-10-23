# GitHub Repository Settings Template

# Copy and paste these settings in your GitHub repository

## Repository Settings

### General

- Repository name: `team-production`
- Description: `Full-stack application with React Native mobile app and Go backend`
- Visibility: Private/Public (as needed)
- Default branch: `main`

### Features

- [x] Issues
- [x] Discussions
- [x] Projects
- [x] Wiki
- [x] Security and analysis

### Pull Requests

- [x] Allow merge commits
- [x] Allow squash merging
- [x] Allow rebase merging
- [x] Always suggest updating pull request branches
- [x] Automatically delete head branches

### Branch Protection Rules for `main`

- [x] Require a pull request before merging
  - [x] Require approvals: 1
  - [x] Dismiss stale reviews when new commits are pushed
  - [x] Require review from code owners
- [x] Require status checks to pass before merging
  - Required status checks:
    - `lint`
    - `backend-test`
    - `mobile-test`
    - `security-audit`
- [x] Require branches to be up to date before merging
- [x] Require conversation resolution before merging
- [x] Include administrators

### Branch Protection Rules for `develop`

- [x] Require a pull request before merging
  - [x] Require approvals: 1
- [x] Require status checks to pass before merging
  - Required status checks:
    - `lint`
    - `backend-test`
    - `mobile-test`

## Required Secrets

### Repository Secrets

```
EXPO_TOKEN=<your-expo-access-token>
CODECOV_TOKEN=<your-codecov-token>
PRODUCTION_DATABASE_URL=<production-db-url>
DISCORD_WEBHOOK_URL=<discord-webhook-url> # Already configured
```

### Environment Secrets

#### Staging Environment

```
DATABASE_URL=<staging-db-url>
API_URL=<staging-api-url>
```

#### Production Environment

```
DATABASE_URL=<production-db-url>
API_URL=<production-api-url>
GITHUB_TOKEN=<github-token-for-deployment>
```

## Required Variables

### Repository Variables

```
DOCKER_REGISTRY=ghcr.io
IMAGE_NAME=teamh04/team-production/backend
NODE_VERSION=20.x
GO_VERSION=1.24.0
PNPM_VERSION=10.17.1
```

## Team Setup

### Teams to Create

1. `core-team` - Full repository access
2. `backend-team` - Backend specialists
3. `mobile-team` - Mobile specialists

### CODEOWNERS File Content

```
# Global owners
* @TeamH04/core-team

# Backend specific
apps/backend/ @TeamH04/backend-team
*.go @TeamH04/backend-team

# Mobile specific
apps/mobile/ @TeamH04/mobile-team
*.tsx @TeamH04/mobile-team
*.ts @TeamH04/mobile-team

# CI/CD workflows
.github/ @TeamH04/core-team

# Documentation
*.md @TeamH04/core-team
```

## Security Settings

### Security & Analysis

- [x] Dependency graph
- [x] Dependabot alerts
- [x] Dependabot security updates
- [x] Code scanning alerts
- [x] Secret scanning alerts

### Advanced Security (if available)

- [x] Secret scanning push protection
- [x] Dependency review

## Deployment Environments

### Staging Environment

- Name: `staging`
- Deployment branch: `develop`
- Environment protection rules:
  - Required reviewers: `backend-team` or `mobile-team`
  - Wait timer: 0 minutes

### Production Environment

- Name: `production`
- Deployment branch: `main`
- Environment protection rules:
  - Required reviewers: `core-team`
  - Wait timer: 5 minutes
  - Prevent self-review

## Additional Configuration

### Labels to Create

- `bug` 🐛 - Something isn't working
- `enhancement` ✨ - New feature or request
- `documentation` 📚 - Improvements or additions to documentation
- `backend` 🐹 - Backend related changes
- `mobile` 📱 - Mobile app related changes
- `dependencies` 📦 - Dependency updates
- `security` 🔒 - Security related changes
- `ci/cd` 🔄 - CI/CD pipeline changes
- `weekly-report` 📊 - Weekly dependency reports

### Issue Templates

Create `.github/ISSUE_TEMPLATE/` with:

- `bug_report.yml`
- `feature_request.yml`
- `security.yml`

### Pull Request Template

Create `.github/pull_request_template.md`
