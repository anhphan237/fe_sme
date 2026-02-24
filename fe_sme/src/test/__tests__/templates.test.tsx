import { screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import Templates from '../../pages/onboarding/Templates'
import { renderWithProviders } from '../utils'

describe('Templates page', () => {
  it('renders templates table', async () => {
    renderWithProviders(<Templates />)

    expect(await screen.findByText('Operations Essentials')).toBeInTheDocument()
    expect(screen.getByText('Stages')).toBeInTheDocument()
  })
})

