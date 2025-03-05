import { parseMappingFile, validateMappingFile, generateMappingTemplate } from '@/lib/utils/mapping-file-parser';
import * as XLSX from 'xlsx-js-style';

// Mock xlsx
jest.mock('xlsx-js-style', () => ({
  read: jest.fn(),
  utils: {
    sheet_to_json: jest.fn(),
    json_to_sheet: jest.fn(),
    book_new: jest.fn(),
    book_append_sheet: jest.fn(),
  },
  write: jest.fn().mockReturnValue(new Uint8Array([1, 2, 3])),
}));

describe('Mapping File Parser', () => {
  const mockValidJson = [
    {
      SourceSystem: 'System1',
      SourceTable: 'Table1',
      SourceColumn: 'Column1',
      TargetSystem: 'System2',
      TargetTable: 'Table2',
      TargetColumn: 'Column2',
      TransformationLogic: 'TRIM()',
      BusinessTerm: 'Customer',
      Description: 'Test mapping',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('parseMappingFile', () => {
    it('should parse an Excel file successfully', async () => {
      // Setup the mock for XLSX.read
      (XLSX.read as jest.Mock).mockReturnValue({
        SheetNames: ['Sheet1'],
        Sheets: { Sheet1: {} },
      });
      (XLSX.utils.sheet_to_json as jest.Mock).mockReturnValue(mockValidJson);

      const file = new File(['test content'], 'test.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const result = await parseMappingFile(file);

      expect(XLSX.read).toHaveBeenCalled();
      expect(XLSX.utils.sheet_to_json).toHaveBeenCalled();

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        sourceSystem: 'System1',
        sourceTable: 'Table1',
        sourceColumn: 'Column1',
        targetSystem: 'System2',
        targetTable: 'Table2',
        targetColumn: 'Column2',
        transformationLogic: 'TRIM()',
        businessTerm: 'Customer',
        description: 'Test mapping',
      });
    });

    it('should parse a CSV file successfully', async () => {
      // Setup the mock for XLSX.read
      (XLSX.read as jest.Mock).mockReturnValue({
        SheetNames: ['Sheet1'],
        Sheets: { Sheet1: {} },
      });
      (XLSX.utils.sheet_to_json as jest.Mock).mockReturnValue(mockValidJson);

      const file = new File(['test content'], 'test.csv', { type: 'text/csv' });
      const result = await parseMappingFile(file);

      expect(XLSX.read).toHaveBeenCalled();
      expect(XLSX.utils.sheet_to_json).toHaveBeenCalled();

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        sourceSystem: 'System1',
        sourceTable: 'Table1',
        sourceColumn: 'Column1',
        targetSystem: 'System2',
        targetTable: 'Table2',
        targetColumn: 'Column2',
        transformationLogic: 'TRIM()',
        businessTerm: 'Customer',
        description: 'Test mapping',
      });
    });

    it('should handle missing required fields', async () => {
      // Setup the mock with missing fields
      const mockInvalidJson = [
        {
          SourceSystem: 'System1',
          // Missing SourceTable
          SourceColumn: 'Column1',
          // Missing TargetSystem
          TargetTable: 'Table2',
          TargetColumn: 'Column2',
        },
      ];

      (XLSX.read as jest.Mock).mockReturnValue({
        SheetNames: ['Sheet1'],
        Sheets: { Sheet1: {} },
      });
      (XLSX.utils.sheet_to_json as jest.Mock).mockReturnValue(mockInvalidJson);

      const file = new File(['test content'], 'test.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      await expect(parseMappingFile(file)).rejects.toThrow(
        'Required fields missing in row 1'
      );
    });

    it('should handle empty file', async () => {
      // Setup the mock for an empty file
      (XLSX.read as jest.Mock).mockReturnValue({
        SheetNames: ['Sheet1'],
        Sheets: { Sheet1: {} },
      });
      (XLSX.utils.sheet_to_json as jest.Mock).mockReturnValue([]);

      const file = new File([''], 'empty.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      await expect(parseMappingFile(file)).rejects.toThrow(
        'No data found in file'
      );
    });

    it('should handle file reading errors', async () => {
      // Setup the mock to throw an error
      (XLSX.read as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid file format');
      });

      const file = new File(['invalid content'], 'invalid.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      await expect(parseMappingFile(file)).rejects.toThrow(
        'Error parsing file: Invalid file format'
      );
    });
  });

  describe('validateMappingFile', () => {
    it('should validate a valid file', async () => {
      // Setup for a valid file
      (XLSX.read as jest.Mock).mockReturnValue({
        SheetNames: ['Sheet1'],
        Sheets: { Sheet1: {} },
      });
      (XLSX.utils.sheet_to_json as jest.Mock).mockReturnValue(mockValidJson);

      const file = new File(['valid content'], 'valid.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      const result = await validateMappingFile(file);

      expect(result.isValid).toBe(true);
      expect(result.mappingData).toHaveLength(1);
      expect(result.mappingData?.[0]).toEqual({
        sourceSystem: 'System1',
        sourceTable: 'Table1',
        sourceColumn: 'Column1',
        targetSystem: 'System2',
        targetTable: 'Table2',
        targetColumn: 'Column2',
        transformationLogic: 'TRIM()',
        businessTerm: 'Customer',
        description: 'Test mapping',
      });
    });

    it('should reject files with invalid extension', async () => {
      const file = new File(['invalid content'], 'invalid.txt', {
        type: 'text/plain',
      });

      const result = await validateMappingFile(file);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Invalid file format. Please upload an Excel (.xlsx) or CSV (.csv) file.'
      );
    });

    it('should identify missing required fields', async () => {
      // Setup with missing fields
      const mockInvalidJson = [
        {
          SourceSystem: 'System1',
          // Missing SourceTable
          SourceColumn: 'Column1',
          // Missing TargetSystem
          TargetTable: 'Table2',
          TargetColumn: 'Column2',
        },
      ];

      (XLSX.read as jest.Mock).mockReturnValue({
        SheetNames: ['Sheet1'],
        Sheets: { Sheet1: {} },
      });
      (XLSX.utils.sheet_to_json as jest.Mock).mockReturnValue(mockInvalidJson);

      const file = new File(['invalid content'], 'invalid.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      const result = await validateMappingFile(file);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Required fields missing in row 1: SourceTable, TargetSystem'
      );
    });

    it('should handle empty files', async () => {
      // Setup for an empty file
      (XLSX.read as jest.Mock).mockReturnValue({
        SheetNames: ['Sheet1'],
        Sheets: { Sheet1: {} },
      });
      (XLSX.utils.sheet_to_json as jest.Mock).mockReturnValue([]);

      const file = new File([''], 'empty.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      const result = await validateMappingFile(file);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('No data found in file');
    });

    it('should handle file reading errors', async () => {
      // Setup to throw an error
      (XLSX.read as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid file format');
      });

      const file = new File(['invalid content'], 'invalid.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      const result = await validateMappingFile(file);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid file format');
    });
  });

  describe('generateMappingTemplate', () => {
    it('should generate a template file', () => {
      // Setup mocks for template generation
      const mockWorkbook = {};
      (XLSX.utils.book_new as jest.Mock).mockReturnValue(mockWorkbook);
      (XLSX.utils.json_to_sheet as jest.Mock).mockReturnValue({});

      const result = generateMappingTemplate();

      expect(XLSX.utils.book_new).toHaveBeenCalled();
      expect(XLSX.utils.json_to_sheet).toHaveBeenCalled();
      expect(XLSX.utils.book_append_sheet).toHaveBeenCalled();
      expect(XLSX.write).toHaveBeenCalled();
      expect(result).toBeInstanceOf(Uint8Array);
    });
  });
});
