const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Define common imports to add to specific file patterns
const fileImports = [
  {
    pattern: /\/app\/api\/.*\/route\.ts$/,
    imports: ["import { NextResponse } from 'next/server';"]
  },
  {
    pattern: /\/app\/components\/.*\.tsx$/,
    imports: [
      "import { useState, useEffect } from 'react';",
      "import clsx from 'clsx';"
    ]
  },
  {
    pattern: /\/__tests__\/.*\.tsx$/,
    imports: [
      "import { screen, fireEvent } from '@testing-library/react';",
      "import { render } from '@testing-library/react';"
    ]
  },
  {
    pattern: /\/lib\/hooks\/.*\.ts$/,
    imports: [
      "import { useState, useEffect } from 'react';"
    ]
  },
  {
    pattern: /\/lib\/providers\/.*\.tsx$/,
    imports: [
      "import { createContext, useContext, useState } from 'react';"
    ]
  }
];

// Find all TypeScript and TSX files
function findTsFiles() {
  try {
    const output = execSync('find . -type f -name "*.ts" -o -name "*.tsx" | grep -v "node_modules" | grep -v ".next"').toString();
    return output.split('\n').filter(Boolean);
  } catch (error) {
    console.error('Error finding TypeScript files:', error);
    return [];
  }
}

// Process a file to add needed imports
function processFile(filePath) {
  console.log(`Processing ${filePath}`);

  // Read file content
  let content = fs.readFileSync(filePath, 'utf8');

  // Get existing imports
  const importLines = content.match(/^import.*?from.*?;/gm) || [];
  const existingImports = importLines.join('\n');

  // Find matching file patterns and determine imports to add
  const importsToAdd = new Set();

  for (const { pattern, imports } of fileImports) {
    if (pattern.test(filePath)) {
      for (const importStatement of imports) {
        if (!existingImports.includes(importStatement)) {
          importsToAdd.add(importStatement);
        }
      }
    }
  }

  // Add the imports to the top of the file
  if (importsToAdd.size > 0) {
    const newImports = Array.from(importsToAdd).join('\n');

    // Find where to insert the imports
    let insertPoint = 0;
    const lastImportMatch = content.match(/^import.*?from.*?;/gm);

    if (lastImportMatch && lastImportMatch.length > 0) {
      const lastImport = lastImportMatch[lastImportMatch.length - 1];
      insertPoint = content.indexOf(lastImport) + lastImport.length;
      content = content.slice(0, insertPoint) + '\n' + newImports + content.slice(insertPoint);
    } else {
      // No existing imports, add at the top after any comments or file header
      const lines = content.split('\n');
      let lineIndex = 0;

      // Skip initial comments if present
      while (lineIndex < lines.length &&
             (lines[lineIndex].trim().startsWith('//') ||
              lines[lineIndex].trim().startsWith('/*') ||
              lines[lineIndex].trim() === '')) {
        lineIndex++;
      }

      // If we found a valid insertion point
      if (lineIndex < lines.length) {
        lines.splice(lineIndex, 0, newImports);
        content = lines.join('\n');
      } else {
        // Fallback to just adding at the top
        content = newImports + '\n' + content;
      }
    }

    // Write the updated content back to the file
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
  }

  return false;
}

// Main function
function main() {
  const files = findTsFiles();
  let fixedFiles = 0;

  for (const filePath of files) {
    try {
      if (processFile(filePath)) {
        fixedFiles++;
      }
    } catch (error) {
      console.error(`Error processing ${filePath}:`, error);
    }
  }

  console.log(`Added common imports to ${fixedFiles} files`);
}

main();
