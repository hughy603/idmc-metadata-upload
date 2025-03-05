# IDMC Metadata Upload User Guide

## Table of Contents

- [Quick Start](#quick-start)
- [Common Workflows](#common-workflows)
- [File Upload Guidelines](#file-upload-guidelines)
- [Troubleshooting](#troubleshooting)
- [FAQ](#faq)

## Quick Start

1. **Access the Application**
   - Open your browser and navigate to the application URL
   - Use your organization credentials to log in

2. **Prepare Your Data**
   - Use the [template file](../test_mapping_example.xlsx) as a starting point
   - Ensure your file includes all required columns:
     - SourceSystem
     - SourceTable
     - SourceColumn
     - TargetSystem
     - TargetTable
     - TargetColumn

3. **Upload Process**
   - Click "Upload File" and select your Excel or CSV file
   - Review the data preview
   - Click "Submit" to process the file

## Common Workflows

### Single File Upload

1. Prepare your mapping file
2. Click "Upload File"
3. Review the data in the preview table
4. Click "Submit" to process
5. Monitor the status in the status column

### Batch Processing

1. Upload multiple files using the file selector
2. Select rows you want to process using the checkboxes
3. Click "Process Selected" to submit multiple rows
4. Monitor progress in the status column

### Error Recovery

If a row fails to process:
1. Check the status column for error details
2. Make necessary corrections
3. Click the retry button next to the failed row
4. Monitor the new submission

## File Upload Guidelines

### Supported Formats
- Excel (.xlsx)
- CSV (.csv)

### File Requirements
- Maximum file size: 10MB
- Required columns must be present
- Column names are case-sensitive
- No empty rows allowed between data

### Data Validation Rules
1. **SourceSystem**
   - Cannot be empty
   - Maximum length: 100 characters

2. **SourceTable/TargetTable**
   - Cannot be empty
   - Must follow naming conventions
   - Maximum length: 100 characters

3. **SourceColumn/TargetColumn**
   - Cannot be empty
   - Must be valid column names
   - Maximum length: 100 characters

## Troubleshooting

### Common Issues and Solutions

1. **File Upload Fails**
   - Check file format and size
   - Ensure all required columns are present
   - Verify there are no special characters in column names

2. **Processing Errors**
   - Check the status column for specific error messages
   - Verify data meets validation rules
   - Use the retry button for failed rows

3. **Performance Issues**
   - Try processing fewer rows at once
   - Clear browser cache
   - Check network connection

### Error Messages

| Error Message | Likely Cause | Solution |
|--------------|--------------|----------|
| "Invalid file format" | File type not supported | Use .xlsx or .csv format |
| "Missing required columns" | Column names incorrect | Check column headers |
| "Processing failed" | Server or validation error | Check error details and retry |

## FAQ

**Q: How do I know if my file was processed successfully?**
A: The status column will show "Complete" for successfully processed rows.

**Q: Can I cancel a processing job?**
A: Currently, once submitted, jobs cannot be cancelled but will timeout after 5 minutes.

**Q: What happens if my session expires?**
A: You'll need to log in again, but your upload history will be preserved.

**Q: How can I export the processing results?**
A: Use the "Export Results" button to download a CSV of the processing status.

## Best Practices

1. **File Preparation**
   - Use the provided template
   - Validate data before upload
   - Keep files under 5MB for optimal performance

2. **Processing Strategy**
   - Start with a small test file
   - Process in batches of 100 rows or less
   - Monitor status updates regularly

3. **Error Handling**
   - Document error messages
   - Fix all errors before retrying
   - Use batch retry for multiple failures

## Keyboard Shortcuts

| Action | Windows/Linux | Mac |
|--------|--------------|-----|
| Upload File | Ctrl + U | ⌘ + U |
| Submit | Ctrl + Enter | ⌘ + Enter |
| Select All | Ctrl + A | ⌘ + A |
| Retry Selected | Ctrl + R | ⌘ + R |

## Getting Help

For additional support:
- Check the [documentation](../README.md)
- Contact your system administrator
- Submit issues through the support portal
