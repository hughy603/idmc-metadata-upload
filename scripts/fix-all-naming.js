#!/usr/bin/env node

/**
 * This script runs all the variable naming fixes in the correct order
 * to ensure consistent naming across the codebase.
 *
 * Usage: node scripts/fix-all-naming.js
 */

const { execSync } = require('child_process');

console.log('=== Starting comprehensive variable naming fix ===');

// Step 1: Run the variable naming fix script
console.log('\n1. Running variable naming fix script...');
try {
  execSync('node scripts/fix-variable-naming.js', { stdio: 'inherit' });
  console.log('✅ Variable naming fix completed');
} catch (error) {
  console.error('❌ Error running variable naming fix:', error.message);
}

// Step 2: Run the test files fix script with updated naming conventions
console.log('\n2. Running test files fix script...');
try {
  execSync('node scripts/fix-test-files.cjs', { stdio: 'inherit' });
  console.log('✅ Test files fix completed');
} catch (error) {
  console.error('❌ Error running test files fix:', error.message);
}

// Step 3: Run ESLint with the new naming convention rules
console.log('\n3. Running ESLint with --fix to apply naming conventions...');
try {
  execSync('npx eslint . --fix', { stdio: 'inherit' });
  console.log('✅ ESLint fix completed');
} catch (error) {
  console.log('⚠️ ESLint found issues that may need manual attention');
}

// Step 4: Run tests to ensure everything still works
console.log('\n4. Running tests to verify fixes...');
try {
  execSync('npm test', { stdio: 'inherit' });
  console.log('✅ Tests passed successfully');
} catch (error) {
  console.error('❌ Tests failed, manual fixes may be needed:', error.message);
}

console.log('\n=== Variable naming fix process completed ===');
console.log('Some manual fixes may still be needed. Check the ESLint output for details.');
