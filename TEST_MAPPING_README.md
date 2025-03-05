# Test Mapping Files for UI Testing

This directory contains sample mapping files for testing the IDMC Metadata Upload UI.

## Available Test Files

- **test_mapping_example.xlsx**: Excel format mapping file with 10 sample mappings
- **test_mapping_example.csv**: CSV format mapping file with the same 10 sample mappings
- **test_mapping_example.json**: JSON source data used to generate the Excel and CSV files

## Sample Data Description

These files contain mapping data with the following characteristics:

- **Total Rows**: 10 mapping entries
- **Source Systems**: SAP ERP, CRM System
- **Target Systems**: Data Warehouse
- **Source Tables**: CUSTOMER, SALES
- **Target Tables**: DIM_CUSTOMER, FACT_SALES

### Schema

Each mapping row contains the following fields:

| Field | Description | Required |
|-------|-------------|----------|
| SourceSystem | Source system name | Yes |
| SourceTable | Source table/entity name | Yes |
| SourceColumn | Source column/field name | Yes |
| TargetSystem | Target system name | Yes |
| TargetTable | Target table/entity name | Yes |
| TargetColumn | Target column/field name | Yes |
| TransformationLogic | SQL or expression for the transformation | No |
| BusinessTerm | Business glossary term | No |
| Description | Additional description or notes | No |

## How to Use

1. Open the application UI
2. Click on the file upload area
3. Select either the Excel (.xlsx) or CSV (.csv) test file
4. Fill in the authentication details (username, password, region)
5. Submit the form to test the validation and upload functionality

## Generating New Test Files

You can generate new test files using the provided scripts:

- `node create-test-mapping.js` - Generates Excel file from JSON
- `node create-test-mapping-csv.js` - Generates CSV file from JSON

To modify the test data, edit the `test_mapping_example.json` file and then run the scripts to regenerate the Excel and CSV versions. 