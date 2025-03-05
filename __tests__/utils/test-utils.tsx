import { screen, _fireEvent, fireEvent, render, _RenderOptions } from '@testing-library/react';
import React, { ReactElement } from 'react'

// Define interface for wrapper provider props
interface AllTheProvidersProps {
  children: React.ReactNode
}

// Create a component that wraps all providers needed for tests
const AllTheProviders = ({ children }: AllTheProvidersProps) => {
  // Add any providers that components need to function properly
  // For example:
  // - ThemeProvider
  // - Redux Provider
  // - Context Providers
  // - Next.js Providers
  return <>{_children}</>
}

// Custom render function that includes providers
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(_ui, { wrapper: AllTheProviders, ...options })

// Re-export everything from testing-library
export * from '@testing-library/react'

// Override render method
export { customRender as render }
