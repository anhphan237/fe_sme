import { screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Routes, Route } from 'react-router-dom'
import EmployeeDetail from '../../pages/onboarding/EmployeeDetail'
import { renderWithProviders } from '../utils'

describe('Employee detail page', () => {
  it('shows checklist tab content', async () => {
    renderWithProviders(
      <Routes>
        <Route
          path="/onboarding/employees/:employeeId"
          element={<EmployeeDetail />}
        />
      </Routes>,
      '/onboarding/employees/instance-1'
    )

    expect(await screen.findByText('Stage progress')).toBeInTheDocument()
    expect(screen.getByText('Tasks')).toBeInTheDocument()
  })
})

