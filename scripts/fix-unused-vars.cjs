#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');
const glob = require('glob');

// Get the root directory
const rootDir = path.resolve(__dirname, '..');

/**
 * Simple regex patterns to find unused variables reported by ESLint
 *
 * This script is a simple helper to automatically prefix unused variables with underscore.
 * It's not a full parser, but should handle most basic cases.
 */
const patterns = [
  // Function parameters - matches: function name(param1, unused, param3) or (param1, unused, param3) =>
  {
    find: /(\(|,\s*)([a-zA-Z][a-zA-Z0-9]*)(\s*(?=[,)]|=>))/g,
    replace: (match, before, varName, after) => {
      // Exclude variables we want to keep as is
      if (
        varName === 'props' ||
        varName === 'req' ||
        varName === 'res' ||
        varName === 'request' ||
        varName === 'response' ||
        varName === 'ctx' ||
        varName === 'context' ||
        varName === 'error' ||
        varName.startsWith('_')
      ) {
        return match;
      }
      return `${before}_${varName}${after}`;
    }
  },

  // Catch block parameters - matches: catch(e) or catch (e)
  {
    find: /catch\s*\(\s*([a-zA-Z][a-zA-Z0-9]*)\s*\)/g,
    replace: (match, varName) => {
      if (varName === 'error' || varName.startsWith('_')) {
        return match;
      }
      return match.replace(varName, `_${varName}`);
    }
  },

  // Destructured object properties - matches: const { a, unused, c } = obj
  {
    find: /(\{(?:[^{}]*,\s*)?)([a-zA-Z][a-zA-Z0-9]*)(\s*(?=[,}]))/g,
    replace: (match, before, varName, after) => {
      if (varName === 'React' || varName.startsWith('_')) {
        return match;
      }
      return `${before}_${varName}${after}`;
    }
  }
];

async function processFile(filePath) {
  try {
    // Read the file content
    const content = await fs.readFile(filePath, 'utf8');
    let modified = content;

    // Apply all patterns
    for (const pattern of patterns) {
      modified = modified.replace(pattern.find, pattern.replace);
    }

    // Only write back if changes were made
    if (modified !== content) {
      console.log(`Fixing unused variables in: ${filePath}`);
      await fs.writeFile(filePath, modified, 'utf8');
    }
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
  }
}

async function main() {
  try {
    // Find all TypeScript and JavaScript files
    const files = glob.sync('**/*.{ts,tsx,js,jsx}', {
      cwd: rootDir,
      ignore: [
        'node_modules/**',
        '.next/**',
        'dist/**',
        'out/**',
        'build/**',
        'coverage/**',
        'scripts/fix-unused-vars.js', // Ignore this file itself
        'scripts/fix-unused-vars.cjs', // Ignore this file itself
        'next.config.js',
        'babel.config.js',
        'postcss.config.js',
        'tailwind.config.js',
        'eslint.config.js'
      ]
    });

    // Process each file
    const promises = files.map(file => processFile(path.join(rootDir, file)));
    await Promise.all(promises);

    console.log('Done! Run "npm run lint:fix" to check if any issues remain.');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
