#!/usr/bin/env node

/**
 * This script fixes variable naming inconsistencies by:
 * 1. Removing unnecessary underscore prefixes from variables that are actually used
 * 2. Adding underscore prefixes to variables that are declared but not used
 *
 * Usage: node scripts/fix-variable-naming.js
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');
const { execSync } = require('child_process');

// Files to exclude from processing
const EXCLUDE_PATTERNS = [
  'node_modules/**',
  '.next/**',
  'dist/**',
  'out/**',
  'build/**',
  'coverage/**',
  'public/**',
  '.git/**',
  '.vscode/**',
  '.cursor/**',
];

// Find all TypeScript/JavaScript files
function findFiles() {
  return glob.sync('**/*.{js,jsx,ts,tsx}', {
    ignore: EXCLUDE_PATTERNS,
  });
}

// Process a file to fix variable naming
function processFile(filePath) {
  console.log(`Processing ${filePath}`);
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // 1. Find variables with underscore prefix that are actually used
  // Pattern: const variableName = ... followed by usage of variableName
  const underscoreVarPattern = /const\s+(_[a-zA-Z][a-zA-Z0-9]*)\s*=/g;
  let match;
  let underscoreVars = [];

  while ((match = underscoreVarPattern.exec(content)) !== null) {
    underscoreVars.push(match[1]);
  }

  // Check which underscore variables are actually used more than once
  for (const varName of underscoreVars) {
    const usageCount = (content.match(new RegExp(`\\b${varName}\\b`, 'g')) || []).length;

    // If used more than just the declaration, remove the underscore
    if (usageCount > 1) {
      const newVarName = varName.substring(1); // Remove the underscore
      const varPattern = new RegExp(`\\b${varName}\\b`, 'g');

      // Only replace if the non-underscore version doesn't already exist
      if (!content.includes(`const ${newVarName} =`) && !content.includes(`let ${newVarName} =`)) {
        content = content.replace(varPattern, newVarName);
        modified = true;
        console.log(`  Renamed ${varName} to ${newVarName}`);
      }
    }
  }

  // 2. Find variables without underscore prefix that are unused
  // This is more complex and might require ESLint to identify
  // We'll skip this for now as it's better handled by ESLint directly

  // Save the file if modified
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
  }

  return false;
}

// Main function
function main() {
  const files = findFiles();
  console.log(`Found ${files.length} files to process`);

  let fixedFiles = 0;

  files.forEach(file => {
    if (processFile(file)) {
      fixedFiles++;
    }
  });

  console.log(`Fixed ${fixedFiles} files`);

  // Run ESLint to identify remaining issues
  console.log('Running ESLint to identify remaining naming issues...');
  try {
    execSync('npx eslint . --fix', { stdio: 'inherit' });
    console.log('ESLint completed successfully');
  } catch (error) {
    console.error('ESLint found issues that need manual attention');
  }
}

main();
