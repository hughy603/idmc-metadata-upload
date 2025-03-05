import * as XLSX from 'xlsx'
import Papa from 'papaparse'
import { FileDataRow } from '@/app/components/file-data-table'

/**
 * Parse Excel or CSV file and return structured data
 */
export async function parseFile(file: File): Promise<FileDataRow[]> {
  const fileExtension = file.name.split('.').pop()?.toLowerCase() || ''
  
  if (fileExtension === 'xlsx' || fileExtension === 'xls') {
    return parseExcelFile(file)
  } else if (fileExtension === 'csv') {
    return parseCsvFile(file)
  } else {
    throw new Error('Unsupported file format. Please upload an Excel or CSV file.')
  }
}

/**
 * Parse Excel file (.xlsx, .xls)
 */
async function parseExcelFile(file: File): Promise<FileDataRow[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      try {
        if (!e.target?.result) {
          reject(new Error('Failed to read file'))
          return
        }
        
        const data = new Uint8Array(e.target.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: 'array' })
        
        // Assume the first sheet is the one we want
        const firstSheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[firstSheetName]
        
        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json<Record<string, string | number>>(worksheet)
        
        // Convert to FileDataRow format
        const rows = jsonData.map((row, index) => ({
          id: `row-${index}`,
          data: row,
          status: 'pending' as const
        }))
        
        resolve(rows)
      } catch (error) {
        reject(error)
      }
    }
    
    reader.onerror = () => {
      reject(new Error('Error reading the file'))
    }
    
    reader.readAsArrayBuffer(file)
  })
}

/**
 * Parse CSV file
 */
async function parseCsvFile(file: File): Promise<FileDataRow[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      complete: (results) => {
        try {
          // Convert to FileDataRow format
          const rows = results.data
            .filter(row => row && typeof row === 'object' && Object.keys(row as object).length > 0) // Filter out empty rows
            .map((row, index) => ({
              id: `row-${index}`,
              data: row as Record<string, string | number>,
              status: 'pending' as const
            }))
          
          resolve(rows)
        } catch (error) {
          reject(error)
        }
      },
      error: (error) => {
        reject(error)
      }
    })
  })
} 