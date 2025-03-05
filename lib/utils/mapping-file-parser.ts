import * as XLSX from 'xlsx-js-style';

import type { MappingDocumentationData } from '@/lib/services/informatica-mapping-service';
/**
 * Utility functions for parsing mapping documentation files
 */

/**
 * Parse an Excel or CSV file containing mapping documentation
 *
 * Expected columns:
 * - SourceSystem
 * - SourceTable
 * - SourceColumn
 * - TargetSystem
 * - TargetTable
 * - TargetColumn
 * - TransformationLogic (optional)
 * - BusinessTerm (optional)
 * - Description (optional)
 *
 * @param file The Excel or CSV file to parse
 * @returns Promise resolving to an array of mapping data
 */
export async function parseMappingFile(
  file: File
): Promise<MappingDocumentationData[]> {
  return new Promise((resolve, reject) => {
    try {
      const reader = new FileReader();

      reader.onload = e => {
        try {
          if (!e.target || !e.target.result) {
            throw new Error('No data found in file');
          }

          // Parse the file using XLSX
          try {
            const workbook = XLSX.read(e.target.result, { type: 'binary' });

            // Assume the first sheet contains the mapping data
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];

            // Convert to JSON
            const jsonData = XLSX.utils.sheet_to_json(worksheet);

            if (jsonData.length === 0) {
              throw new Error('No data found in file');
            }

            // Transform to our expected format
            const mappingData: MappingDocumentationData[] = jsonData.map(
              (row: any, index: number) => {
                // Validate required fields
                const missingFields = [];

                if (!row.SourceSystem) missingFields.push('SourceSystem');
                if (!row.SourceTable) missingFields.push('SourceTable');
                if (!row.SourceColumn) missingFields.push('SourceColumn');
                if (!row.TargetSystem) missingFields.push('TargetSystem');
                if (!row.TargetTable) missingFields.push('TargetTable');
                if (!row.TargetColumn) missingFields.push('TargetColumn');

                if (missingFields.length > 0) {
                  throw new Error(
                    `Required fields missing in row ${index + 1}: ${missingFields.join(', ')}`
                  );
                }

                return {
                  sourceSystem: row.SourceSystem,
                  sourceTable: row.SourceTable,
                  sourceColumn: row.SourceColumn,
                  targetSystem: row.TargetSystem,
                  targetTable: row.TargetTable,
                  targetColumn: row.TargetColumn,
                  transformationLogic: row.TransformationLogic || undefined,
                  businessTerm: row.BusinessTerm || undefined,
                  description: row.Description || undefined,
                };
              }
            );

            resolve(mappingData);
          } catch (error) {
            if (error instanceof Error) {
              reject(new Error(`Error parsing file: ${error.message}`));
            } else {
              reject(new Error('Error parsing file: Unknown error'));
            }
          }
        } catch (error) {
          if (error instanceof Error) {
            reject(error);
          } else {
            reject(new Error('Unknown error parsing file'));
          }
        }
      };

      reader.onerror = error => {
        reject(new Error('No data found in file'));
      };

      // Read the file as binary
      reader.readAsBinaryString(file);
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Validate a mapping documentation file format
 *
 * @param file The file to validate
 * @returns Promise resolving to validation result
 */
export async function validateMappingFile(file: File): Promise<{
  isValid: boolean;
  errors?: string[];
  mappingData?: MappingDocumentationData[];
}> {
  // Check file extension first
  const fileExtension = file.name
    .substring(file.name.lastIndexOf('.'))
    .toLowerCase();
  const allowedExtensions = ['.xlsx', '.csv'];

  if (!allowedExtensions.includes(fileExtension)) {
    return {
      isValid: false,
      errors: [
        'Invalid file format. Please upload an Excel (.xlsx) or CSV (.csv) file.',
      ],
    };
  }

  try {
    const mappingData = await parseMappingFile(file);

    // If we got here, the file is valid
    return {
      isValid: true,
      mappingData,
    };
  } catch (error) {
    if (error instanceof Error) {
      // Extract the actual error message without the "Error parsing file:" prefix
      let errorMessage = error.message;
      if (errorMessage.startsWith('Error parsing file:')) {
        errorMessage = errorMessage
          .substring('Error parsing file:'.length)
          .trim();
      }

      return {
        isValid: false,
        errors: [errorMessage],
      };
    }

    return {
      isValid: false,
      errors: ['Unknown error parsing file'],
    };
  }
}

/**
 * Generate a sample Excel template for mapping documentation
 *
 * @returns Buffer containing the Excel file
 */
export function generateMappingTemplate(): Uint8Array {
  // Create a new workbook
  const workbook = XLSX.utils.book_new();

  // Sample data with column headers
  const sampleData = [
    {
      SourceSystem: 'SourceSystem1',
      SourceTable: 'Customer',
      SourceColumn: 'CustomerId',
      TargetSystem: 'TargetSystem1',
      TargetTable: 'CustomerDim',
      TargetColumn: 'CustomerKey',
      TransformationLogic: 'CAST(CustomerId AS INT)',
      BusinessTerm: 'Customer Identifier',
      Description: 'Maps the customer ID from source to target',
    },
    {
      SourceSystem: 'SourceSystem1',
      SourceTable: 'Customer',
      SourceColumn: 'FirstName',
      TargetSystem: 'TargetSystem1',
      TargetTable: 'CustomerDim',
      TargetColumn: 'FirstName',
      TransformationLogic: 'TRIM(FirstName)',
      BusinessTerm: 'Customer First Name',
      Description: '',
    },
  ];

  // Create a worksheet from the sample data
  const worksheet = XLSX.utils.json_to_sheet(sampleData);

  // Add the worksheet to the workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Mapping Documentation');

  // Generate Excel file
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });

  return new Uint8Array(excelBuffer);
}
