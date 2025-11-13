# Installation Guide

This guide will help you install and set up the INLC Strategic Dashboard.

## Prerequisites

- **Node.js**: Version 16.x, 18.x, or 20.x (all supported)
  - Download from: https://nodejs.org/
  - Verify: `node --version`

- **npm**: Version 8.x or higher (comes with Node.js)
  - Verify: `npm --version`

## Installation Steps

### 1. Navigate to Project Directory

```bash
cd "admin-dashboard-template-2023-11-27-05-25-41-utc/admin-flowdash-1.2.0 3/HTML"
```

### 2. Clean Install (Recommended)

If you've had previous installation issues:

```bash
# Remove old dependencies
rm -rf node_modules
rm package-lock.json

# Clear npm cache
npm cache clean --force
```

### 3. Install Dependencies

```bash
npm install
```

**Note**: The installation uses `--legacy-peer-deps` flag automatically via `.npmrc` to handle compatibility between older template dependencies and modern packages.

### 4. Verify Installation

Check that key packages are installed:

```bash
npm list sass
npm list typescript
npm list jest
```

## What Was Updated

The following changes were made to modernize the dependencies:

### Replaced deprecated node-sass
- ✅ **Old**: `node-sass` (deprecated, Python 3 incompatible)
- ✅ **New**: `sass` (Dart Sass) v1.69.5
- ✅ **Added**: `sass-loader` v13.3.2 for webpack integration

### Updated Build Tools
- ✅ `laravel-mix` updated to v6.0.49
- ✅ `webpack` updated to v5.89.0
- ✅ `webpack-cli` updated to v5.1.4

### Updated Vue.js Stack
- ✅ `vue` updated from 2.5.17 to 2.7.15 (latest Vue 2)
- ✅ `bootstrap-vue` updated to 2.23.1
- ✅ Added `vue-loader` v15.10.1
- ✅ Added `vue-template-compiler` v2.7.15

### Configuration Files
- ✅ Created `.npmrc` for legacy peer dependency handling
- ✅ Updated `webpack.mix.js` for Dart Sass compatibility

## Common Issues & Solutions

### Issue: "Python not found" or "node-gyp" errors

**Solution**: These errors should no longer occur with Dart Sass. If you still see them:

```bash
# Ensure you're using the updated package.json
git pull origin your-branch-name

# Clean install
rm -rf node_modules package-lock.json
npm install
```

### Issue: Peer dependency warnings

**Solution**: These are expected due to the template's older dependencies. The `.npmrc` file handles this with `legacy-peer-deps=true`.

You can safely ignore warnings like:
- "ERESOLVE unable to resolve dependency tree"
- "Could not resolve dependency: peer..."

### Issue: "Cannot find module 'sass'"

**Solution**: Ensure sass is installed:

```bash
npm install sass --save-dev
```

### Issue: Build fails with webpack errors

**Solution**:

1. Clear webpack cache:
   ```bash
   rm -rf node_modules/.cache
   ```

2. Rebuild:
   ```bash
   npm run production
   ```

### Issue: TypeScript errors during installation

**Solution**: TypeScript compilation is separate from installation. Install first, then check types:

```bash
npm install              # Install dependencies first
npm run type-check       # Then check types (optional)
```

## Post-Installation Steps

### 1. Upload Source Data Files

Place your INLC Excel files in the `data-source/` directory:
- `Combined Objectives.xlsx`
- `INLC_Strategic_Plan_Tracking.xlsx`
- `Combined Objectives.pdf` (optional)

### 2. Run ETL Script

Process the source files into JSON:

```bash
npm run etl
```

This will create:
- `data/objectives.json`
- `data/kpis.json`
- `data/backups/backup_[timestamp].json`

### 3. Build the Application

For development:
```bash
npm run development
```

For production:
```bash
npm run production
```

### 4. Run Tests

```bash
npm test
```

### 5. Serve Locally

```bash
npm run serve
```

Then open your browser to the URL shown (typically http://localhost:3000).

## Development Workflow

```bash
# Watch for file changes and auto-rebuild
npm run watch

# In another terminal, serve the application
npm run serve
```

## Verification Checklist

After installation, verify:

- ✅ `node_modules/` directory exists
- ✅ `node_modules/sass/` exists (not `node_modules/node-sass/`)
- ✅ `npm run etl` works without errors
- ✅ `npm test` runs tests successfully
- ✅ `npm run production` builds without errors
- ✅ `dist/` directory is created with compiled assets

## Package Scripts Reference

| Command | Description |
|---------|-------------|
| `npm install` | Install all dependencies |
| `npm run etl` | Run ETL to process Excel source files |
| `npm test` | Run Jest unit tests |
| `npm run type-check` | Check TypeScript types (no build) |
| `npm run development` | Build for development |
| `npm run production` | Build for production (minified) |
| `npm run watch` | Watch files and rebuild on changes |
| `npm run serve` | Serve built files locally |

## Getting Help

If you encounter issues:

1. **Check this guide** for common solutions
2. **Review the main README.md** for project documentation
3. **Check console output** for specific error messages
4. **Verify Node.js version**: `node --version` (should be 16.x or 18.x)
5. **Try clean install**: Remove `node_modules` and `package-lock.json`, then reinstall

## System Requirements

- **Operating System**: Windows 10/11, macOS 10.15+, or Linux
- **Node.js**: 16.x, 18.x, or 20.x (LTS versions)
- **RAM**: Minimum 4GB (8GB recommended for build process)
- **Disk Space**: ~500MB for node_modules

## Notes

- **Python**: No longer required! Dart Sass is pure JavaScript.
- **Node.js 20 Compatible**: All dependencies work with Node.js 20.x (no fibers, no node-sass).
- **Build Times**: First build may take 2-3 minutes. Subsequent builds are faster.
- **Legacy Code**: Some template dependencies are older by design (Bootstrap 4, Vue 2). They remain stable and functional.

---

**Last Updated**: November 2025
**Node.js Compatibility**: 16.x - 20.x
**npm Compatibility**: 8.x+
