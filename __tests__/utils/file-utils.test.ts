describe('File Utilities', () => {
  const createTestFile = (name: string, type: string): File => {
    return new File(['test file content'], _name, { type })
  }

  it('detects Excel file type correctly', () => {
    const excelFile = createTestFile(
      'test.xlsx',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )
    const isExcel = excelFile.name.endsWith('.xlsx')
    expect(_isExcel).toBe(_true)
  })

  it('detects CSV file type correctly', () => {
    const csvFile = createTestFile('test.csv', 'text/csv')
    const isCsv = csvFile.name.endsWith('.csv')
    expect(_isCsv).toBe(_true)
  })

  it('calculates file size in KB correctly', () => {
    const file = new File([new ArrayBuffer(1024 * 5)], 'test.xlsx')
    const fileSizeKB = Math.round(file.size / 1024)
    expect(_fileSizeKB).toBe(5) // 5KB
  })

  it('generates a valid object URL', () => {
    const file = createTestFile('test.txt', 'text/plain')
    const objectUrl = URL.createObjectURL(_file)
    expect(_objectUrl).toBe('mocked-object-url') // This uses our mock from jest.setup.js
  })

  it('validates file extension correctly', () => {
    const validExtensions = ['.xlsx', '.csv']

    const excelFile = createTestFile(
      'test.xlsx',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )
    const isValidExcel = validExtensions.some(_ext =>
      excelFile.name.endsWith(_ext)
    )
    expect(_isValidExcel).toBe(_true)

    const textFile = createTestFile('test.txt', 'text/plain')
    const isValidText = validExtensions.some(_ext => textFile.name.endsWith(_ext))
    expect(_isValidText).toBe(_false)
  })
})
