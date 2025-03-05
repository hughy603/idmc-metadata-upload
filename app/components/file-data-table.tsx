'use client';

import { useEffect, useState } from 'react';

/**
 * Represents a row of data in the file data table
 */
export interface FileDataRow {
  /** Unique identifier for the row */
  id: string;
  /** Row data as key-value pairs */
  data: Record<string, string | number>;
  /** Current processing status of the row */
  status: 'pending' | 'processing' | 'success' | 'error';
  /** Error message if status is 'error' */
  error?: string | undefined;
  /** Job ID if the row has been submitted */
  jobId?: string | null;
}

/**
 * Props for the FileDataTable component
 */
interface FileDataTableProps {
  /** Array of data rows to display in the table */
  data: FileDataRow[];
  /** Function to call when a single row is submitted */
  onRowSubmit?: (row: FileDataRow) => Promise<void>;
  /** Function to call when multiple rows are submitted as a batch */
  onBatchSubmit?: (rows: FileDataRow[]) => Promise<void>;
  /** Initial page size for pagination, defaults to 25 */
  initialPageSize?: number;
}

/**
 * Table component that displays file data and provides batch processing capabilities
 */
export default function FileDataTable({
  data,
  onRowSubmit,
  onBatchSubmit,
  initialPageSize = 25
}: FileDataTableProps): JSX.Element {
  const [tableData, setTableData] = useState<FileDataRow[]>([]);
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [totalPages, setTotalPages] = useState(1);

  // Update table data when input data changes
  useEffect(() => {
    setTableData(data);
    setTotalPages(Math.max(1, Math.ceil(data.length / pageSize)));
    // Reset to first page when data changes
    setCurrentPage(1);
  }, [data, pageSize]);

  // Show a message when there's no data to display
  if (!tableData.length) {
    return (
      <div className="mt-4 rounded-md bg-white p-4 shadow dark:bg-gray-800">
        <p className="text-center text-gray-500 dark:text-gray-400">
          No data to display
        </p>
      </div>
    );
  }

  // Extract column headers from the first row
  const headers = Object.keys(tableData[0].data);

  /**
   * Handle batch processing of selected rows
   */
  const handleBatchProcess = async (): Promise<void> => {
    if (!onBatchSubmit || selectedRows.size === 0) return;

    const rowsToProcess = tableData.filter(
      row => selectedRows.has(row.id) && row.status === 'pending'
    );

    if (rowsToProcess.length === 0) {
      console.warn('No pending rows selected for processing');
      return;
    }

    setIsBatchProcessing(true);
    try {
      await onBatchSubmit(rowsToProcess);
    } catch (error) {
      console.error('Batch processing failed:', error);
    } finally {
      setIsBatchProcessing(false);
    }
  };

  /**
   * Toggle select all rows
   */
  const toggleSelectAll = (): void => {
    if (selectAll) {
      setSelectedRows(new Set());
    } else {
      const pendingRowIds = tableData
        .filter(row => row.status === 'pending')
        .map(row => row.id);
      setSelectedRows(new Set(pendingRowIds));
    }
    setSelectAll(!selectAll);
  };

  // Get current page data only
  const paginatedData = tableData.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Handle page change
  const handlePageChange = (page: number): void => {
    setCurrentPage(page);
  };

  // Handle page size change
  const handlePageSizeChange = (event: React.ChangeEvent<HTMLSelectElement>): void => {
    const newSize = parseInt(event.target.value, 10);
    setPageSize(newSize);
    setCurrentPage(1); // Reset to first page when changing page size
  };

  // Create pagination controls
  const renderPaginationControls = (): JSX.Element => {
    return (
      <div className="mt-4 flex items-center justify-between border-t border-gray-200 px-4 py-3 dark:border-gray-700 sm:px-6">
        <div className="flex flex-1 justify-between sm:hidden">
          <button
            onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Previous
          </button>
          <button
            onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Next
          </button>
        </div>
        <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Showing <span className="font-medium">{(currentPage - 1) * pageSize + 1}</span> to{' '}
              <span className="font-medium">
                {Math.min(currentPage * pageSize, tableData.length)}
              </span>{' '}
              of <span className="font-medium">{tableData.length}</span> results
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div>
              <label htmlFor="pageSize" className="mr-2 text-sm text-gray-700 dark:text-gray-300">
                Rows per page:
              </label>
              <select
                id="pageSize"
                value={pageSize}
                onChange={handlePageSizeChange}
                className="rounded-md border border-gray-300 bg-white px-2 py-1 text-sm text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
            <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
              <button
                onClick={() => handlePageChange(1)}
                disabled={currentPage === 1}
                className="relative inline-flex items-center rounded-l-md border border-gray-300 bg-white px-2 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
              >
                <span className="sr-only">First</span>
                <span>«</span>
              </button>
              <button
                onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center border border-gray-300 bg-white px-2 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
              >
                <span className="sr-only">Previous</span>
                <span>‹</span>
              </button>
              {/* Page number buttons - show limited range of pages */}
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageIndex = Math.min(
                  Math.max(currentPage - 2, 1) + i,
                  totalPages
                );
                // Only show if within valid page range
                if (pageIndex <= totalPages && pageIndex > 0) {
                  return (
                    <button
                      key={pageIndex}
                      onClick={() => handlePageChange(pageIndex)}
                      className={`relative inline-flex items-center border px-4 py-2 text-sm font-medium ${
                        currentPage === pageIndex
                          ? 'z-10 border-blue-500 bg-blue-50 text-blue-600 dark:border-blue-500 dark:bg-blue-900 dark:text-blue-200'
                          : 'border-gray-300 bg-white text-gray-500 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
                      }`}
                    >
                      {pageIndex}
                    </button>
                  );
                }
                return null;
              })}
              <button
                onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="relative inline-flex items-center border border-gray-300 bg-white px-2 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
              >
                <span className="sr-only">Next</span>
                <span>›</span>
              </button>
              <button
                onClick={() => handlePageChange(totalPages)}
                disabled={currentPage === totalPages}
                className="relative inline-flex items-center rounded-r-md border border-gray-300 bg-white px-2 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
              >
                <span className="sr-only">Last</span>
                <span>»</span>
              </button>
            </nav>
          </div>
        </div>
      </div>
    );
  };

  /**
   * Toggle selection of a row
   */
  const toggleRowSelection = (rowId: string): void => {
    const newSelectedRows = new Set(selectedRows);
    if (newSelectedRows.has(rowId)) {
      newSelectedRows.delete(rowId);
      setSelectAll(false);
    } else {
      newSelectedRows.add(rowId);
      // Check if all pending rows are now selected
      const pendingRowIds = tableData
        .filter(row => row.status === 'pending')
        .map(row => row.id);
      setSelectAll(
        pendingRowIds.length > 0 &&
          pendingRowIds.every(id => newSelectedRows.has(id))
      );
    }
    setSelectedRows(newSelectedRows);
  };

  return (
    <div className="mt-4 overflow-x-auto rounded-lg shadow">
      {/* Batch processing controls */}
      <div className="mb-4 flex flex-col justify-between space-y-2 sm:flex-row sm:items-center sm:space-y-0">
        <div className="flex items-center">
          <input
            type="checkbox"
            id="select-all-checkbox"
            checked={selectAll}
            onChange={toggleSelectAll}
            className="mr-2 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:focus:ring-blue-400"
          />
          <label
            htmlFor="select-all-checkbox"
            className="text-sm text-gray-700 dark:text-gray-300"
          >
            Select All Pending
          </label>
        </div>
        <button
          onClick={handleBatchProcess}
          disabled={
            selectedRows.size === 0 ||
            isBatchProcessing ||
            !tableData.some(
              row => selectedRows.has(row.id) && row.status === 'pending'
            )
          }
          className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-blue-800 dark:hover:bg-blue-700"
        >
          {isBatchProcessing ? 'Processing...' : 'Process Selected'}
        </button>
      </div>

      {/* Status summary */}
      <div className="mb-4 flex flex-wrap gap-2">
        <span className="rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
          Pending: {tableData.filter(row => row.status === 'pending').length}
        </span>
        <span className="rounded-md bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300">
          Processing: {tableData.filter(row => row.status === 'processing').length}
        </span>
        <span className="rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-300">
          Success: {tableData.filter(row => row.status === 'success').length}
        </span>
        <span className="rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700 dark:bg-red-900/30 dark:text-red-300">
          Error: {tableData.filter(row => row.status === 'error').length}
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-100 dark:bg-gray-800">
            <tr>
              <th
                scope="col"
                className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
              >
                Select
              </th>
              <th
                scope="col"
                className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
              >
                Status
              </th>
              {headers.map(header => (
                <th
                  key={header}
                  scope="col"
                  className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
                >
                  {header}
                </th>
              ))}
              <th
                scope="col"
                className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
            {paginatedData.map(row => (
              <tr
                key={row.id}
                className={
                  row.status === 'error'
                    ? 'bg-red-50 dark:bg-red-900/20'
                    : row.status === 'success'
                      ? 'bg-green-50 dark:bg-green-900/20'
                      : row.status === 'processing'
                        ? 'bg-yellow-50 dark:bg-yellow-900/20'
                        : ''
                }
              >
                <td className="whitespace-nowrap px-3 py-4 text-sm">
                  <input
                    type="checkbox"
                    disabled={row.status !== 'pending' || isBatchProcessing}
                    checked={selectedRows.has(row.id)}
                    onChange={() => toggleRowSelection(row.id)}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:focus:ring-blue-400"
                  />
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm">
                  <span
                    className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                      row.status === 'success'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                        : row.status === 'processing'
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                        : row.status === 'error'
                        ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                        : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                    }`}
                  >
                    {row.status.charAt(0).toUpperCase() + row.status.slice(1)}
                  </span>
                  {row.error && (
                    <span className="ml-2 text-xs text-red-500 dark:text-red-400">
                      {row.error}
                    </span>
                  )}
                </td>
                {headers.map(header => (
                  <td
                    key={`${row.id}-${header}`}
                    className="whitespace-nowrap px-3 py-4 text-sm text-gray-900 dark:text-gray-100"
                  >
                    {String(row.data[header] || '')}
                  </td>
                ))}
                <td className="whitespace-nowrap px-3 py-4 text-sm">
                  {row.status === 'pending' && (
                    <button
                      onClick={() => onRowSubmit?.(row)}
                      disabled={isBatchProcessing}
                      className="rounded bg-blue-500 px-2 py-1 text-xs text-white hover:bg-blue-600 disabled:opacity-50 dark:bg-blue-700 dark:hover:bg-blue-600"
                    >
                      Process
                    </button>
                  )}
                  {row.status === 'success' && row.jobId && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Job ID: {row.jobId}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination controls */}
      {renderPaginationControls()}
    </div>
  );
}
