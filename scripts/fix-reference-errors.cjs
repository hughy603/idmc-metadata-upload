#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');
const glob = require('glob');

// Get the root directory
const rootDir = path.resolve(__dirname, '..');

/**
 * Fix reference errors where variables have been renamed with underscore prefix
 * but not renamed at usage sites
 */
async function processFile(filePath) {
  try {
    // Read the file content
    const content = await fs.readFile(filePath, 'utf8');

    // Find all "_variableName is not defined" patterns
    const notDefinedRegex = /'_([a-zA-Z][a-zA-Z0-9]*)' is not defined/g;
    const matches = [...content.matchAll(notDefinedRegex)];

    if (matches.length === 0) {
      return; // No matches, skip this file
    }

    // Extract the variable names that need to be fixed
    const variablesToFix = matches.map(match => match[1]);

    if (variablesToFix.length === 0) {
      return; // No variables to fix, skip this file
    }

    console.log(`Fixing reference errors in: ${filePath}`);

    // Create a modified version with proper underscore prefixes
    let modified = content;

    // For each variable that needs to be fixed
    for (const varName of variablesToFix) {
      // Replace all occurrences of the variable with its underscore version
      // But be careful to not replace parts of other variable names or properties
      const varRegex = new RegExp(`\\b${varName}\\b(?!\\s*=|\\s*\\+\\+|\\s*\\-\\-|\\s*:)`, 'g');
      modified = modified.replace(varRegex, `_${varName}`);
    }

    // Only write back if changes were made
    if (modified !== content) {
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
        'scripts/fix-unused-vars.cjs',
        'scripts/fix-reference-errors.cjs',
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

    console.log('Done! Run "npm run lint:fix" to check if issues remain.');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
