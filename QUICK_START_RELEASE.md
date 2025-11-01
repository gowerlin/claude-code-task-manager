# Quick Start: Releasing a New Version

This guide provides a quick walkthrough for creating and publishing a new release.

## Prerequisites

Ensure you have:
- npm access token configured as `NPM_TOKEN` in GitHub repository secrets
- Write access to the repository
- All changes committed and pushed to main branch

## Release Steps

### 1. Update Version

From the repository root:

```bash
# Patch version (1.0.0 -> 1.0.1)
npm version patch -m "chore: release v%s"

# Minor version (1.0.0 -> 1.1.0)  
npm version minor -m "chore: release v%s"

# Major version (1.0.0 -> 2.0.0)
npm version major -m "chore: release v%s"
```

This will:
- Update version in package.json and package-lock.json
- Create a git commit
- Create a git tag (e.g., v1.0.1)

### 2. Update CHANGELOG

Edit `CHANGELOG.md`:
- Move items from `[Unreleased]` to a new version section
- Add the release date
- Update comparison links at the bottom

Example:
```markdown
## [1.0.1] - 2025-11-01

### Fixed
- Bug fix description

### Added
- New feature description

[1.0.1]: https://github.com/gowerlin/claude-code-task-manager/releases/tag/v1.0.1
```

### 3. Commit Changelog

```bash
git add CHANGELOG.md
git commit --amend --no-edit
git tag -f v1.0.1
```

### 4. Push to GitHub

```bash
git push origin main
git push origin --tags
```

### 5. Monitor Workflow

1. Go to [Actions](https://github.com/gowerlin/claude-code-task-manager/actions)
2. Watch the "Release and Publish" workflow
3. It will:
   - Build the project
   - Publish to npm
   - Create GitHub release

### 6. Verify Release

- Check [npm package](https://www.npmjs.com/package/claude-code-task-manager)
- Check [GitHub releases](https://github.com/gowerlin/claude-code-task-manager/releases)
- Test installation: `npm install -g claude-code-task-manager@latest`

## Troubleshooting

### Workflow fails on npm publish
- Verify NPM_TOKEN is set correctly in repository secrets
- Check if version already exists on npm
- Review workflow logs for detailed error

### Tag push doesn't trigger workflow
- Ensure tag format is `v*.*.*` (e.g., v1.0.1)
- Check workflow runs in Actions tab
- Verify workflow file syntax

### Need to redo a release
```bash
# Delete local tag
git tag -d v1.0.1

# Delete remote tag  
git push origin :refs/tags/v1.0.1

# Fix issues and create tag again
git tag v1.0.1
git push origin --tags
```

## One-Line Release Command

For convenience, here's a combined command for patch releases:

```bash
npm version patch -m "chore: release v%s" && git push origin main --tags
```

**Note**: Remember to update CHANGELOG.md before running this command!
