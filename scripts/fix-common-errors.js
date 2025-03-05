#!/usr/bin/env node

/**
 * This script helps fix common linting errors found in the project
 * Specifically targeting the Next.js App Router API route issues with cookies()
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

// Create the scripts directory if it doesn't exist
const scriptsDir = path.join(__dirname)
if (!fs.existsSync(scriptsDir)) {
  fs.mkdirSync(scriptsDir, { recursive: true })
}

console.log('🔍 Scanning for common linting errors...')

// Find all API route files that use cookies()
const findApiRoutesWithCookies = () => {
  try {
    const result = execSync('grep -r "const cookieStore = cookies()" --include="*.ts" app/api').toString()
    const files = result
      .split('\n')
      .filter(line => line.trim() !== '')
      .map(line => {
        const [filePath] = line.split(':')
        return filePath
      })

    return [...new Set(files)] // Remove duplicates
  } catch (error) {
    console.log('No files found with cookie store issues or error in grep command')
    return []
  }
}

// Fix the cookies() usage in API routes
const fixCookieIssues = (files) => {
  if (files.length === 0) {
    console.log('No cookie usage issues found in API routes')
    return
  }

  console.log(`Found ${files.length} files with potential cookie usage issues:`)
  files.forEach(file => console.log(`  - ${file}`))

  let fixedFiles = 0

  files.forEach(file => {
    try {
      let content = fs.readFileSync(file, 'utf8')

      // Fix cookieStore.get/set issues
      const fixed = content
        // Fix the import
        .replace(
          "import { cookies } from 'next/headers'",
          "import { cookies } from 'next/headers'\nimport { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies'"
        )
        // Fix the cookieStore declaration
        .replace(
          "const cookieStore = cookies()",
          "const cookieStore = cookies() as unknown as ReadonlyRequestCookies"
        )

      if (content !== fixed) {
        fs.writeFileSync(file, fixed, 'utf8')
        console.log(`✅ Fixed cookie issues in ${file}`)
        fixedFiles++
      }
    } catch (error) {
      console.error(`❌ Error fixing ${file}:`, error.message)
    }
  })

  console.log(`Fixed ${fixedFiles} out of ${files.length} files with cookie issues`)
}

// Find files that might need the FileDataRow interface fixes
const findUploadFormIssues = () => {
  try {
    // Look for the upload-form.tsx file
    return fs.existsSync('app/components/upload-form.tsx')
      ? ['app/components/upload-form.tsx']
      : []
  } catch (error) {
    console.error('Error checking for upload-form.tsx:', error)
    return []
  }
}

// Process the command line arguments
const args = process.argv.slice(2)
const shouldFixAll = args.includes('--fix-all')
const shouldFixCookies = args.includes('--fix-cookies') || shouldFixAll
const shouldFixUploadForm = args.includes('--fix-upload-form') || shouldFixAll

// Fix the identified issues
if (shouldFixCookies) {
  console.log('\n🔧 Fixing cookie handling issues in API routes...')
  const cookieFiles = findApiRoutesWithCookies()
  fixCookieIssues(cookieFiles)
}

if (shouldFixUploadForm) {
  console.log('\n🔧 Checking for upload form issues...')
  const uploadFormFiles = findUploadFormIssues()
  if (uploadFormFiles.length > 0) {
    console.log(`Found upload-form.tsx. You should manually review this file to fix type errors.`)
    console.log('Common issues include:')
    console.log(' - Return types of processFile() and validateFile() functions')
    console.log(' - Parameter types of uploadMappingData() function')
    console.log(' - Parameter counts for startTracking() and checkStatus() functions')
    console.log('\nThese typically require changes to the underlying service implementations and cannot be automatically fixed.')
  } else {
    console.log('No upload form issues found.')
  }
}

if (!shouldFixCookies && !shouldFixUploadForm) {
  console.log(`
Usage:
  node scripts/fix-common-errors.js [options]

Options:
  --fix-all            Fix all common issues
  --fix-cookies        Fix cookie handling in API routes
  --fix-upload-form    Check for upload form issues (requires manual fixing)

Example:
  node scripts/fix-common-errors.js --fix-all
  `)
}
