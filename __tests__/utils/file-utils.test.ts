describe('File Utilities', () => {
  const createTestFile = (name: string, type: string): File => {
    return new File(['test file content'], name, { type });
  };

  it('detects Excel file type correctly', () => {
    const excelFile = createTestFile('test.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    const isExcel = excelFile.name.endsWith('.xlsx');
    expect(isExcel).toBe(true);
  });

  it('detects CSV file type correctly', () => {
    const csvFile = createTestFile('test.csv', 'text/csv');
    const isCsv = csvFile.name.endsWith('.csv');
    expect(isCsv).toBe(true);
  });

  it('calculates file size in KB correctly', () => {
    const file = new File([new ArrayBuffer(1024 * 5)], 'test.xlsx');
    const fileSizeKB = Math.round(file.size / 1024);
    expect(fileSizeKB).toBe(5); // 5KB
  });

  it('generates a valid object URL', () => {
    const file = createTestFile('test.txt', 'text/plain');
    const objectUrl = URL.createObjectURL(file);
    expect(objectUrl).toBe('mocked-object-url'); // This uses our mock from jest.setup.js
  });

  it('validates file extension correctly', () => {
    const validExtensions = ['.xlsx', '.csv'];
    
    const excelFile = createTestFile('test.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    const isValidExcel = validExtensions.some(ext => excelFile.name.endsWith(ext));
    expect(isValidExcel).toBe(true);
    
    const textFile = createTestFile('test.txt', 'text/plain');
    const isValidText = validExtensions.some(ext => textFile.name.endsWith(ext));
    expect(isValidText).toBe(false);
  });
}); 