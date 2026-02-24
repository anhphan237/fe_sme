import { screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import SurveyInbox from '../../pages/surveys/SurveyInbox'
import { renderWithProviders } from '../utils'

describe('Survey inbox page', () => {
  it('renders survey list', async () => {
    renderWithProviders(<SurveyInbox />)

    expect(await screen.findByText('Survey')).toBeInTheDocument()
    expect(screen.getByText('Due date')).toBeInTheDocument()
  })
})

