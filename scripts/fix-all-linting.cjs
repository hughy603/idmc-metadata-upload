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
  'render': "import { render } from '@testing-library/react';",
  'RenderOptions': "import { RenderOptions } from '@testing-library/react';",
};

// Define common imports by file pattern
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

// Define interface declarations to add to specific files
const interfaceDeclarations = [
  {
    pattern: /\/lib\/hooks\/useFileUpload\.ts$/,
    declarations: [
      "interface SessionInfo { sessionId: string; orgId: string; expiresAt: string; }",
      "interface AuthTokenInfo { token: string; region: string; }"
    ]
  },
  {
    pattern: /\/lib\/hooks\/useInformaticaAuth\.ts$/,
    declarations: [
      "interface SessionInfo { sessionId: string; orgId: string; expiresAt: string; }",
      "interface InformaticaAuthCredentials { username: string; password: string; }"
    ]
  },
  {
    pattern: /\/lib\/hooks\/useJobTracking\.ts$/,
    declarations: [
      "interface AuthTokenInfo { token: string; region: string; }"
    ]
  },
  {
    pattern: /\/lib\/services\/auth-service\.ts$/,
    declarations: [
      "interface InformaticaSession { sessionId: string; orgId: string; expiresAt: string; }",
      "interface InformaticaToken { token: string; region: string; }"
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

// Process a file to add needed imports and interfaces
function processFile(filePath) {
  console.log(`Processing ${filePath}`);

  // Read file content
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

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

    modified = true;
  }

  // Add interface declarations if needed
  for (const { pattern, declarations } of interfaceDeclarations) {
    if (pattern.test(filePath)) {
      const newDeclarations = declarations.join('\n');

      // Find where to insert the declarations
      const lastImportMatch = content.match(/^import.*?from.*?;/gm);

      if (lastImportMatch && lastImportMatch.length > 0) {
        const lastImport = lastImportMatch[lastImportMatch.length - 1];
        const insertPoint = content.indexOf(lastImport) + lastImport.length;
        content = content.slice(0, insertPoint) + '\n\n' + newDeclarations + '\n' + content.slice(insertPoint);
      } else {
        // No imports, add at the top
        content = newDeclarations + '\n\n' + content;
      }

      modified = true;
    }
  }

  // Fix duplicate imports
  if (content.includes('import { useState, useEffect } from \'react\';') &&
      content.includes('import { useState } from \'react\';')) {
    content = content.replace('import { useState } from \'react\';', '');
    modified = true;
  }

  if (content.includes('import { useState, useEffect } from \'react\';') &&
      content.includes('import { useEffect } from \'react\';')) {
    content = content.replace('import { useEffect } from \'react\';', '');
    modified = true;
  }

  // Write the updated content back to the file if modified
  if (modified) {
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

  console.log(`Fixed ${fixedFiles} files`);

  // Run the other fix scripts
  try {
    console.log('Running fix:unused-vars script...');
    execSync('npm run fix:unused-vars', { stdio: 'inherit' });

    console.log('Running fix:references script...');
    execSync('npm run fix:references', { stdio: 'inherit' });

    console.log('Running fix:imports script...');
    execSync('npm run fix:imports', { stdio: 'inherit' });
  } catch (error) {
    console.error('Error running fix scripts:', error);
  }
}

main();
