import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

import FileDataTable from '@/app/components/file-data-table';
import type { FileDataRow } from '@/app/components/file-data-table';
import '@testing-library/jest-dom';

describe('FileDataTable', () => {
  // Create mock data for testing
  const mockData: FileDataRow[] = Array.from({ length: 50 }, (_, i) => ({
    id: `id-${i}`,
    data: {
      sourceSystem: `Source ${i}`,
      sourceTable: `Table ${i}`,
      sourceColumn: `Column ${i}`,
      targetSystem: `Target ${i}`,
      targetTable: `TargetTable ${i}`,
      targetColumn: `TargetColumn ${i}`,
    },
    status: i % 4 === 0
      ? 'pending'
      : i % 4 === 1
        ? 'processing'
        : i % 4 === 2
          ? 'success'
          : 'error',
    error: i % 4 === 3 ? `Test error ${i}` : undefined,
    jobId: i % 4 === 2 ? `job-${i}` : null,
  }));

  // Mock callback functions
  const mockOnRowSubmit = jest.fn();
  const mockOnBatchSubmit = jest.fn();

  it('renders empty state when no data is provided', () => {
    render(<FileDataTable data={[]} />);
    expect(screen.getByText('No data to display')).toBeInTheDocument();
  });

  it('renders table with correct headers and data', () => {
    render(<FileDataTable data={mockData} />);

    // Check headers
    expect(screen.getByText('Select')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('sourceSystem')).toBeInTheDocument();
    expect(screen.getByText('sourceTable')).toBeInTheDocument();
    expect(screen.getByText('sourceColumn')).toBeInTheDocument();
    expect(screen.getByText('targetSystem')).toBeInTheDocument();
    expect(screen.getByText('targetTable')).toBeInTheDocument();
    expect(screen.getByText('targetColumn')).toBeInTheDocument();
    expect(screen.getByText('Actions')).toBeInTheDocument();
  });

  it('paginates data correctly', () => {
    render(<FileDataTable data={mockData} initialPageSize={10} />);

    // First page should show first 10 items
    expect(screen.getByText('Source 0')).toBeInTheDocument();
    expect(screen.getByText('Source 9')).toBeInTheDocument();

    // Navigate to next page
    const nextPageButton = screen.getByText('›');
    fireEvent.click(nextPageButton);

    // Second page should show next 10 items
    expect(screen.getByText('Source 10')).toBeInTheDocument();
    expect(screen.getByText('Source 19')).toBeInTheDocument();
  });

  it('changes page size correctly', () => {
    render(<FileDataTable data={mockData} initialPageSize={10} />);

    // Initially shows 10 items
    expect(screen.getByText('Source 0')).toBeInTheDocument();
    expect(screen.getByText('Source 9')).toBeInTheDocument();

    // Change page size to 25
    const pageSizeSelect = screen.getByLabelText(/rows per page/i);
    fireEvent.change(pageSizeSelect, { target: { value: '25' } });

    // Should now show 25 items
    expect(screen.getByText('Source 0')).toBeInTheDocument();
    expect(screen.getByText('Source 24')).toBeInTheDocument();
  });

  it('handles row selection correctly', async () => {
    const user = userEvent.setup();
    render(<FileDataTable data={mockData} onRowSubmit={mockOnRowSubmit} onBatchSubmit={mockOnBatchSubmit} />);

    // Find the first row checkbox and click it
    const firstRowCheckbox = screen.getAllByRole('checkbox')[1]; // First checkbox after "Select All"
    await user.click(firstRowCheckbox);

    expect(firstRowCheckbox).toBeChecked();
  });

  it('handles "Select All" correctly', async () => {
    const user = userEvent.setup();

    // Create data with only pending status for this test
    const pendingData = Array.from({ length: 5 }, (_, i) => ({
      id: `id-${i}`,
      data: {
        sourceSystem: `Source ${i}`,
        sourceTable: `Table ${i}`,
        sourceColumn: `Column ${i}`,
        targetSystem: `Target ${i}`,
        targetTable: `TargetTable ${i}`,
        targetColumn: `TargetColumn ${i}`,
      },
      status: 'pending' as const,
      error: undefined,
      jobId: null,
    }));

    render(<FileDataTable data={pendingData} onRowSubmit={mockOnRowSubmit} onBatchSubmit={mockOnBatchSubmit} />);

    // Find the "Select All" checkbox by finding the label and then getting its associated checkbox
    const selectAllLabel = screen.getByText('Select All Pending');
    const selectAllCheckbox = selectAllLabel.previousElementSibling as HTMLInputElement;

    // Click "Select All"
    await user.click(selectAllCheckbox);

    // All checkboxes should now be checked
    const checkboxes = screen.getAllByRole('checkbox');
    checkboxes.forEach(checkbox => {
      expect(checkbox).toBeChecked();
    });
  });

  it('calls onRowSubmit when Process button is clicked', async () => {
    const user = userEvent.setup();
    render(<FileDataTable data={mockData} onRowSubmit={mockOnRowSubmit} onBatchSubmit={mockOnBatchSubmit} />);

    // Find the first row's Process button and click it
    const processButtons = screen.getAllByText('Process');
    await user.click(processButtons[0]);

    expect(mockOnRowSubmit).toHaveBeenCalled();
  });

  it('calls onBatchSubmit when Process Selected button is clicked', async () => {
    const user = userEvent.setup();

    // Create data with only pending status for this test
    const pendingData = Array.from({ length: 5 }, (_, i) => ({
      id: `id-${i}`,
      data: {
        sourceSystem: `Source ${i}`,
        sourceTable: `Table ${i}`,
        sourceColumn: `Column ${i}`,
        targetSystem: `Target ${i}`,
        targetTable: `TargetTable ${i}`,
        targetColumn: `TargetColumn ${i}`,
      },
      status: 'pending' as const,
      error: undefined,
      jobId: null,
    }));

    render(<FileDataTable data={pendingData} onRowSubmit={mockOnRowSubmit} onBatchSubmit={mockOnBatchSubmit} />);

    // Select the first row
    const firstRowCheckbox = screen.getAllByRole('checkbox')[1];
    await user.click(firstRowCheckbox);

    // Click the "Process Selected" button
    const batchProcessButton = screen.getByText('Process Selected');
    await user.click(batchProcessButton);

    expect(mockOnBatchSubmit).toHaveBeenCalled();
  });

  it('disables Process Selected button when no rows are selected', () => {
    render(<FileDataTable data={mockData} onRowSubmit={mockOnRowSubmit} onBatchSubmit={mockOnBatchSubmit} />);

    const batchProcessButton = screen.getByText('Process Selected');
    expect(batchProcessButton).toBeDisabled();
  });

  it('displays job ID for successful rows', () => {
    // Create a small dataset with success status
    const successData = Array.from({ length: 2 }, (_, i) => ({
      id: `id-${i}`,
      data: {
        sourceSystem: `Source ${i}`,
        sourceTable: `Table ${i}`,
        sourceColumn: `Column ${i}`,
        targetSystem: `Target ${i}`,
        targetTable: `TargetTable ${i}`,
        targetColumn: `TargetColumn ${i}`,
      },
      status: 'success' as const,
      error: undefined,
      jobId: `job-${i}`,
    }));

    render(<FileDataTable data={successData} />);

    // Check for job IDs in the rendered table
    successData.forEach(row => {
      // Look for text that contains the job ID
      const cells = screen.getAllByRole('cell');
      const jobIdCell = cells.find(cell => cell.textContent?.includes(row.jobId));
      expect(jobIdCell).toBeInTheDocument();
    });
  });

  it('displays error message for rows with errors', () => {
    // Create a small dataset with error status
    const errorData = Array.from({ length: 2 }, (_, i) => ({
      id: `id-${i}`,
      data: {
        sourceSystem: `Source ${i}`,
        sourceTable: `Table ${i}`,
        sourceColumn: `Column ${i}`,
        targetSystem: `Target ${i}`,
        targetTable: `TargetTable ${i}`,
        targetColumn: `TargetColumn ${i}`,
      },
      status: 'error' as const,
      error: `Test error ${i}`,
      jobId: null,
    }));

    render(<FileDataTable data={errorData} />);

    // Check for error messages in the rendered table
    errorData.forEach(row => {
      // Look for text that contains the error message
      const cells = screen.getAllByRole('cell');
      const errorCell = cells.find(cell => cell.textContent?.includes(row.error));
      expect(errorCell).toBeInTheDocument();
    });
  });

  it('navigates to first and last page correctly', async () => {
    const user = userEvent.setup();
    render(<FileDataTable data={mockData} initialPageSize={10} />);

    // Navigate to last page
    const lastPageButton = screen.getByText('»');
    await user.click(lastPageButton);

    // Last page should show last items
    expect(screen.getByText('Source 40')).toBeInTheDocument();

    // Navigate back to first page
    const firstPageButton = screen.getByText('«');
    await user.click(firstPageButton);

    // First page should show first items again
    expect(screen.getByText('Source 0')).toBeInTheDocument();
  });

  it('shows correct pagination information', () => {
    render(<FileDataTable data={mockData} initialPageSize={10} />);

    // Find the pagination info text
    const paginationContainer = screen.getByText(/showing/i, { exact: false });

    // Check that it contains the expected information
    expect(paginationContainer).toHaveTextContent(/1/);
    expect(paginationContainer).toHaveTextContent(/10/);
    expect(paginationContainer).toHaveTextContent(/50/);
  });
});
