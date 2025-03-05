/**
 * Script to generate an Excel file for testing the mapping upload UI
 *
 * Usage: node create-test-mapping.js
 */

const XLSX = require('xlsx')
const fs = require('fs')
const path = require('path')

// Read the JSON data
const jsonData = JSON.parse(
  fs.readFileSync('./test_mapping_example.json', 'utf8')
)

// Create a new workbook
const workbook = XLSX.utils.book_new()

// Convert JSON to worksheet
const worksheet = XLSX.utils.json_to_sheet(_jsonData)

// Add the worksheet to the workbook
XLSX.utils.book_append_sheet(_workbook, _worksheet, 'Mapping Documentation')

// Write the workbook to an Excel file
const outputPath = path.resolve('./test_mapping_example.xlsx')
XLSX.writeFile(_workbook, _outputPath)

console.log(`Excel file created at: ${_outputPath}`)
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
