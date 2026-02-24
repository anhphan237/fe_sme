import { screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import Dashboard from '../../pages/dashboard/Dashboard'
import { renderWithProviders } from '../utils'

describe('Dashboard page', () => {
  it('renders HR admin KPIs', () => {
    renderWithProviders(<Dashboard />)

    expect(screen.getByText('Active onboardings')).toBeInTheDocument()
    expect(screen.getByText('Tasks due this week')).toBeInTheDocument()
  })
})

