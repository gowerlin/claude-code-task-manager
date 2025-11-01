# Release Guide

This guide explains how to create a new release and publish the package to npm.

## Prerequisites

Before creating a release, ensure:
1. All changes are committed and pushed to the main branch
2. The CHANGELOG.md is updated with the new version
3. All tests pass
4. The build is successful

## Release Process

### Automated Release (Recommended)

The project uses GitHub Actions to automate the release process. When you push a version tag, the workflow will:
1. Build the project
2. Run tests
3. Publish to npm
4. Create a GitHub release

### Steps to Release

1. **Update Version in package.json**
   ```bash
   # For a patch release (1.0.0 -> 1.0.1)
   npm version patch
   
   # For a minor release (1.0.0 -> 1.1.0)
   npm version minor
   
   # For a major release (1.0.0 -> 2.0.0)
   npm version major
   ```

2. **Update CHANGELOG.md**
   - Move items from `[Unreleased]` to a new version section
   - Add the release date
   - Update the comparison links at the bottom

3. **Commit the Version Bump**
   ```bash
   git add package.json package-lock.json CHANGELOG.md
   git commit -m "chore: bump version to x.x.x"
   ```

4. **Create and Push the Tag**
   ```bash
   git tag v1.0.1
   git push origin main --tags
   ```

5. **Wait for GitHub Actions**
   - The release workflow will automatically:
     - Build the project
     - Publish to npm (requires NPM_TOKEN secret)
     - Create a GitHub release

### Manual Release (If Needed)

If you need to publish manually:

1. **Build the Project**
   ```bash
   npm run build
   ```

2. **Publish to npm**
   ```bash
   npm publish --access public
   ```

3. **Create GitHub Release**
   - Go to the repository on GitHub
   - Click "Releases" > "Create a new release"
   - Select the tag you created
   - Add release notes
   - Publish the release

## Setting Up npm Token

For automated publishing to work, you need to:

1. Create an npm access token:
   - Log in to [npmjs.com](https://www.npmjs.com)
   - Go to Account Settings > Access Tokens
   - Generate a new token with "Automation" type

2. Add the token to GitHub Secrets:
   - Go to repository Settings > Secrets and variables > Actions
   - Click "New repository secret"
   - Name: `NPM_TOKEN`
   - Value: Your npm token
   - Click "Add secret"

## Version Numbering

Follow [Semantic Versioning](https://semver.org/):
- **MAJOR** version for incompatible API changes
- **MINOR** version for backwards-compatible functionality additions
- **PATCH** version for backwards-compatible bug fixes

## Troubleshooting

### Release workflow fails
- Check the GitHub Actions logs
- Ensure NPM_TOKEN is correctly set
- Verify the build passes locally

### npm publish fails
- Ensure you're logged in: `npm whoami`
- Check if the version already exists on npm
- Verify package name is available

### Tag already exists
```bash
# Delete local tag
git tag -d v1.0.1

# Delete remote tag
git push origin :refs/tags/v1.0.1
```

## Support

If you encounter issues, please:
- Check existing issues on GitHub
- Open a new issue with details
- Contact the maintainers
