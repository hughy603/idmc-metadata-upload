/**
 * Example script demonstrating how to use the Informatica mapping documentation service
 * 
 * This is for demonstration purposes only and should be adapted to your specific application needs
 */

import {
  authenticateWithInformatica,
  importMappingDocumentation,
  uploadMappingFile,
  checkImportJobStatus,
  MappingDocumentationData
} from '../services/informatica-mapping-service'

// Example function to submit mapping documentation programmatically
async function submitMappingDocumentation() {
  try {
    // Step 1: Authenticate with Informatica
    console.log('Authenticating with Informatica...')
    const auth = await authenticateWithInformatica({
      username: 'your_username',
      password: 'your_password',
      baseUrl: 'https://dm-us.informaticacloud.com', // Adjust based on your region
      apiUrl: 'https://idmc-api.dm-us.informaticacloud.com' // Adjust based on your region
    })
    
    console.log('Authentication successful')
    
    // Step 2: Define mapping documentation data
    const mappingData: MappingDocumentationData[] = [
      {
        sourceSystem: 'SourceSystem1',
        sourceTable: 'Customer',
        sourceColumn: 'CustomerId',
        targetSystem: 'TargetSystem1',
        targetTable: 'CustomerDim',
        targetColumn: 'CustomerKey',
        transformationLogic: 'CAST(CustomerId AS INT)',
        businessTerm: 'Customer Identifier',
        description: 'Maps the customer ID from source to target customer dimension'
      },
      {
        sourceSystem: 'SourceSystem1',
        sourceTable: 'Customer',
        sourceColumn: 'FirstName',
        targetSystem: 'TargetSystem1',
        targetTable: 'CustomerDim',
        targetColumn: 'FirstName',
        transformationLogic: 'TRIM(FirstName)',
        businessTerm: 'Customer First Name'
      }
    ]
    
    // Step 3: Import the mapping documentation
    console.log('Importing mapping documentation...')
    const importResult = await importMappingDocumentation(auth, mappingData)
    
    if (importResult.success) {
      console.log(`Import successful. Job ID: ${importResult.jobId}`)
      
      // Step 4: Check job status (optional)
      if (importResult.jobId) {
        console.log('Checking job status...')
        // Give the job a moment to start
        await new Promise(resolve => setTimeout(resolve, 2000))
        
        const jobStatus = await checkImportJobStatus(auth, importResult.jobId)
        console.log(`Job status: ${jobStatus.status}`)
        console.log('Job details:', jobStatus.details)
      }
    } else {
      console.error(`Import failed: ${importResult.error}`)
    }
  } catch (error) {
    console.error('Error in mapping documentation submission:', error)
  }
}

// Example function to upload a file containing mapping documentation
async function uploadMappingDocumentationFile(filePath: string) {
  try {
    // Step 1: Authenticate with Informatica
    console.log('Authenticating with Informatica...')
    const auth = await authenticateWithInformatica({
      username: 'your_username',
      password: 'your_password',
      baseUrl: 'https://dm-us.informaticacloud.com', // Adjust based on your region
      apiUrl: 'https://idmc-api.dm-us.informaticacloud.com' // Adjust based on your region
    })
    
    console.log('Authentication successful')
    
    // Step 2: Create a file object from the file path
    // Note: In a browser environment, you'd typically get this from a file input element
    // This is a simplified example for demonstration purposes
    const file = new File([''], filePath, { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    
    // Step 3: Upload the file
    console.log('Uploading mapping documentation file...')
    const uploadResult = await uploadMappingFile(
      auth,
      file,
      'Data mapping documentation containing source to target field mappings'
    )
    
    if (uploadResult.success) {
      console.log(`Upload successful. Job ID: ${uploadResult.jobId}`)
      
      // Step 4: Check job status (optional)
      if (uploadResult.jobId) {
        console.log('Checking job status...')
        // Give the job a moment to start
        await new Promise(resolve => setTimeout(resolve, 2000))
        
        const jobStatus = await checkImportJobStatus(auth, uploadResult.jobId)
        console.log(`Job status: ${jobStatus.status}`)
        console.log('Job details:', jobStatus.details)
      }
    } else {
      console.error(`Upload failed: ${uploadResult.error}`)
    }
  } catch (error) {
    console.error('Error in mapping file upload:', error)
  }
}

// In a real application, you would call these functions based on user input or application flow
// Here we're just showing example usage
// submitMappingDocumentation()
// uploadMappingDocumentationFile('path/to/your/mapping-file.xlsx')

export { submitMappingDocumentation, uploadMappingDocumentationFile } 