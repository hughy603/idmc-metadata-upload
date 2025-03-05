#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const glob = require('glob');

// Common test variables that need to be defined
const testImports = {
  // Testing library imports for test files
  '/__tests__/.*\\.tsx?$/': [
    "import { render, screen, fireEvent } from '@testing-library/react';",
    "import '@testing-library/jest-dom';",
    "import { jest } from '@jest/globals';"
  ],
  // Common mock variables for test files
  '/__tests__/.*\\.test\\.tsx?$/': [
    "// Common test variables",
    "const isTrue = true;",
    "const isFalse = false;",
    "const nullValue = null;",
    "const undefinedValue = undefined;",
    "const NumberConstructor = Number;",
    "const Uint8ArrayConstructor = Uint8Array;",
    "const globalObject = global;",
    "const consoleObject = console;",
    "const windowObject = window;"
  ],
  // Upload form test specific mocks
  '/__tests__/app/components/upload-form\\.test\\.tsx$/': [
    "// Upload form test mocks",
    "const changeFileButton = screen.getByLabelText('Change File');",
    "const authSubmitButton = screen.getByRole('button', { name: /submit/i });",
    "const retryButton = screen.getByRole('button', { name: /retry/i });",
    "const onSubmit = jest.fn();",
    "const onRowSubmit = jest.fn();",
    "const children = <div>Test Children</div>;"
  ],
  // Informatica mapping service test specific mocks
  '/__tests__/lib/services/informatica-mapping-service\\.test\\.ts$/': [
    "// Informatica mapping service test mocks",
    "const status = 200;",
    "const statusText = 'OK';",
    "const data = { success: true };",
    "const mockFetch = jest.fn();",
    "const result = { success: true };",
    "const mockMappingData = { mappings: [] };",
    "const mockFile = new File(['test'], 'test.xlsx');",
    "const importMappingDocumentation = jest.fn();",
    "const uploadMappingFile = jest.fn();",
    "const checkImportJobStatus = jest.fn();"
  ],
  // Mapping file parser test specific mocks
  '/__tests__/lib/utils/mapping-file-parser\\.test\\.ts$/': [
    "// Mapping file parser test mocks",
    "const mockValidJson = { valid: true };",
    "const mockInvalidJson = { valid: false };",
    "const mockWorkbook = { SheetNames: ['Sheet1'], Sheets: { Sheet1: {} } };",
    "const file = new File(['test'], 'test.xlsx');",
    "const validateMappingFile = jest.fn();",
    "const generateMappingTemplate = jest.fn();"
  ],
  // File utils test specific mocks
  '/__tests__/utils/file-utils\\.test\\.ts$/': [
    "// File utils test mocks",
    "const name = 'test.xlsx';",
    "const isExcel = true;",
    "const isCsv = true;",
    "const fileSizeKB = 100;",
    "const file = new File(['test'], 'test.xlsx');",
    "const objectUrl = 'blob:test';",
    "const isValidExcel = true;",
    "const isValidText = false;"
  ],
  // Date utils test specific mocks
  '/__tests__/utils/date-utils\\.test\\.ts$/': [
    "// Date utils test mocks",
    "const globalObject = global;",
    "const formattedDate = '2023-01-01';",
    "const diffInSeconds = 60;"
  ],
  // Test utils specific mocks
  '/__tests__/utils/test-utils\\.tsx$/': [
    "// Test utils mocks",
    "const children = <div>Test Children</div>;",
    "const ui = <div>Test UI</div>;",
    "type RenderOptions = Parameters<typeof render>[1];"
  ]
};

// Find all test files
function findTestFiles() {
  return glob.sync('__tests__/**/*.{ts,tsx}', {
    ignore: ['**/node_modules/**', '**/.next/**']
  });
}

// Process a file to add necessary imports and variable declarations
function processFile(filePath) {
  console.log(`Processing ${filePath}`);
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Check each pattern and add imports if needed
  Object.entries(testImports).forEach(([pattern, imports]) => {
    if (new RegExp(pattern).test(filePath)) {
      // Check if each import is already present
      imports.forEach(importStatement => {
        // Skip comments when checking for existence
        if (importStatement.startsWith('//')) {
          if (!content.includes(importStatement)) {
            // Add comment before imports
            const importSection = content.match(/import .* from ['"]/);
            if (importSection) {
              const pos = content.indexOf(importSection[0]);
              content = content.slice(0, pos) + importStatement + '\n' + content.slice(pos);
              modified = true;
            } else {
              // Add at the top if no imports found
              content = importStatement + '\n' + content;
              modified = true;
            }
          }
        } else if (!content.includes(importStatement)) {
          // For actual imports, check more carefully
          const importName = importStatement.match(/import\s+{([^}]+)}/);
          if (importName) {
            const importItems = importName[1].split(',').map(item => item.trim());
            let allImportsExist = true;

            importItems.forEach(item => {
              if (!content.includes(item.trim())) {
                allImportsExist = false;
              }
            });

            if (!allImportsExist) {
              // Add import after the last import statement
              const lastImport = content.lastIndexOf('import');
              if (lastImport !== -1) {
                const endOfImport = content.indexOf('\n', lastImport);
                content = content.slice(0, endOfImport + 1) + importStatement + '\n' + content.slice(endOfImport + 1);
              } else {
                // Add at the top if no imports found
                content = importStatement + '\n' + content;
              }
              modified = true;
            }
          } else if (importStatement.startsWith('const ')) {
            // For variable declarations, check if they exist
            const varName = importStatement.match(/const\s+(\w+)/);
            if (varName && !content.includes(varName[1])) {
              // Add after imports or at the top of the describe block
              const describePos = content.indexOf('describe(');
              if (describePos !== -1) {
                const openBracePos = content.indexOf('{', describePos);
                if (openBracePos !== -1) {
                  content = content.slice(0, openBracePos + 1) + '\n  ' + importStatement + '\n' + content.slice(openBracePos + 1);
                  modified = true;
                }
              } else {
                // Add after imports
                const lastImport = content.lastIndexOf('import');
                if (lastImport !== -1) {
                  const endOfImport = content.indexOf('\n', lastImport);
                  content = content.slice(0, endOfImport + 1) + '\n' + importStatement + '\n' + content.slice(endOfImport + 1);
                } else {
                  // Add at the top
                  content = importStatement + '\n' + content;
                }
                modified = true;
              }
            }
          } else {
            // For type declarations
            const typeName = importStatement.match(/type\s+(\w+)/);
            if (typeName && !content.includes(typeName[1])) {
              // Add after imports
              const lastImport = content.lastIndexOf('import');
              if (lastImport !== -1) {
                const endOfImport = content.indexOf('\n', lastImport);
                content = content.slice(0, endOfImport + 1) + '\n' + importStatement + '\n' + content.slice(endOfImport + 1);
              } else {
                // Add at the top
                content = importStatement + '\n' + content;
              }
              modified = true;
            }
          }
        }
      });
    }
  });

  // Save the file if modified
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
  }

  return false;
}

// Main function
function main() {
  const files = findTestFiles();
  console.log(`Found ${files.length} test files`);

  let fixedFiles = 0;

  files.forEach(file => {
    if (processFile(file)) {
      fixedFiles++;
    }
  });

  console.log(`Fixed ${fixedFiles} test files`);
}

main();
