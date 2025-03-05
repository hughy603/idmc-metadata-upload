const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Define common imports by variable name
const commonImports = {
  // React imports
  'useState': "import { useState } from 'react';",
  'useEffect': "import { useEffect } from 'react';",
  'useContext': "import { useContext } from 'react';",
  'createContext': "import { createContext } from 'react';",
  'useRef': "import { useRef } from 'react';",
  'useMemo': "import { useMemo } from 'react';",
  'useCallback': "import { useCallback } from 'react';",
  'NextResponse': "import { NextResponse } from 'next/server';",
  'clsx': "import clsx from 'clsx';",
  'screen': "import { screen } from '@testing-library/react';",
  'fireEvent': "import { fireEvent } from '@testing-library/react';",
  '_true': '', // Constants don't need imports
  '_false': '',
  '_null': '',
  '_undefined': '',
  '_children': '', // Likely props
  '_data': '',
  'handleSubmit': '',
  'RenderOptions': "import { RenderOptions } from '@testing-library/react';",
  'prev': '', // Likely function parameter
  'row': '', // Likely function parameter or prop
  'header': '', // Likely function parameter or prop
  'e': '', // Event parameter
  'item': '', // Likely function parameter
  'mapping': '', // Data variable
  'obj': '', // Function parameter
  'data': '', // Function parameter
  'files': '', // Likely props
};

// Special cases where we might need multiple imports
const multipleImports = {
  'NextResponse': ["import { NextResponse } from 'next/server';"],
  'screen|fireEvent': ["import { screen, fireEvent } from '@testing-library/react';"],
};

// Run ESLint to get undefined variables
function getUndefinedVars() {
  try {
    // Create a temporary file to store ESLint output
    const tempOutputFile = path.join(__dirname, 'eslint-output.txt');

    // Run ESLint and save output to file
    try {
      execSync(`npx eslint . --rule "no-unused-vars: off" --rule "@typescript-eslint/no-unused-vars: off" > ${tempOutputFile} 2>&1`);
    } catch (error) {
      // ESLint will exit with non-zero status if it finds errors, which is expected
      // We just need the output file to be created
    }

    // Read the output file
    const output = fs.readFileSync(tempOutputFile, 'utf8');

    // Parse the output to extract file paths and undefined variables
    const fileVarMap = {};
    const lines = output.split('\n');

    let currentFile = null;

    lines.forEach(line => {
      const fileMatch = line.match(/^\/.*?\.(tsx?|jsx?):/);
      if (fileMatch) {
        currentFile = fileMatch[0].slice(0, -1);
        if (!fileVarMap[currentFile]) {
          fileVarMap[currentFile] = new Set();
        }
      }

      const varMatch = line.match(/'([^']+)' is not defined/);
      if (varMatch && currentFile) {
        fileVarMap[currentFile].add(varMatch[1]);
      }
    });

    // Clean up the temporary file
    try {
      fs.unlinkSync(tempOutputFile);
    } catch (error) {
      console.warn('Failed to delete temporary file:', error);
    }

    return fileVarMap;
  } catch (error) {
    console.error("Failed to parse ESLint output:", error);
    return {};
  }
}

// Process a file to add needed imports
function processFile(filePath, undefinedVars) {
  console.log(`Processing ${filePath}`);

  // Read file content
  let content = fs.readFileSync(filePath, 'utf8');

  // Only process TypeScript/React files
  if (!filePath.endsWith('.ts') && !filePath.endsWith('.tsx')) {
    console.log(`Skipping non-TS/TSX file: ${filePath}`);
    return false;
  }

  // Check if this is a test file
  const isTestFile = filePath.includes('__tests__') || filePath.includes('.test.');

  // Skip NextJS API routes for NextResponse import - they may need a different approach
  const isNextApiRoute = filePath.includes('/api/') && filePath.includes('/route.ts');

  // Get existing imports
  const importLines = content.match(/^import.*?from.*?;/gm) || [];
  const existingImports = importLines.join('\n');

  // Determine what imports to add
  const importsToAdd = new Set();
  const varsToFix = Array.from(undefinedVars);

  // Check for common combinations first
  for (const [pattern, imports] of Object.entries(multipleImports)) {
    const vars = pattern.split('|');
    if (vars.every(v => undefinedVars.has(v))) {
      imports.forEach(imp => importsToAdd.add(imp));
      vars.forEach(v => {
        undefinedVars.delete(v);
      });
    }
  }

  // Then check individual imports
  for (const variable of varsToFix) {
    if (commonImports[variable] && commonImports[variable] !== '' && !existingImports.includes(commonImports[variable])) {
      importsToAdd.add(commonImports[variable]);
    }
  }

  // Special case for test files
  if (isTestFile && (undefinedVars.has('screen') || undefinedVars.has('fireEvent'))) {
    importsToAdd.add("import { screen, fireEvent } from '@testing-library/react';");
  }

  // Special case for NextResponse in API routes
  if (isNextApiRoute && undefinedVars.has('NextResponse')) {
    importsToAdd.add("import { NextResponse } from 'next/server';");
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
  const fileVarMap = getUndefinedVars();
  let fixedFiles = 0;

  for (const [filePath, undefinedVars] of Object.entries(fileVarMap)) {
    try {
      if (processFile(filePath, undefinedVars)) {
        fixedFiles++;
      }
    } catch (error) {
      console.error(`Error processing ${filePath}:`, error);
    }
  }

  console.log(`Fixed references in ${fixedFiles} files`);
}

main();
