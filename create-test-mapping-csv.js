/**
 * Script to generate a CSV file for testing the mapping upload UI
 *
 * Usage: node create-test-mapping-csv.js
 */

const fs = require('fs')
const path = require('path')

// Read the JSON data
const jsonData = JSON.parse(
  fs.readFileSync('./test_mapping_example.json', 'utf8')
)

// Function to convert an array of objects to CSV
function objectsToCSV(_data) {
  if (!data || data.length === 0) {
    return ''
  }

  // Extract headers from the first object
  const headers = Object.keys(data[0])

  // Create the header row
  const headerRow = headers.join(',')

  // Create rows for each data object
  const rows = data.map(_obj => {
    return headers
      .map(_header => {
        // Handle values that may contain commas or quotes
        const value = obj[header] || ''
        if (
          value.includes(',') ||
          value.includes('"') ||
          value.includes('\n')
        ) {
          return `"${value.replace(/"/g, '""')}"`
        }
        return value
      })
      .join(',')
  })

  // Combine header and rows
  return [headerRow, ...rows].join('\n')
}

// Convert JSON to CSV
const csvContent = objectsToCSV(_jsonData)

// Write the CSV file
const outputPath = path.resolve('./test_mapping_example.csv')
fs.writeFileSync(_outputPath, _csvContent)

console.log(`CSV file created at: ${_outputPath}`)
console.log('File contains the following mappings:')
console.log(`- Total rows: ${jsonData.length}`)
console.log(
  `- Source systems: ${[...new Set(jsonData.map(_row => row.SourceSystem))].join(', ')}`
)
console.log(
  `- Target systems: ${[...new Set(jsonData.map(_row => row.TargetSystem))].join(', ')}`
)
console.log(
  `- Source tables: ${[...new Set(jsonData.map(_row => row.SourceTable))].join(', ')}`
)
console.log(
  `- Target tables: ${[...new Set(jsonData.map(_row => row.TargetTable))].join(', ')}`
)
