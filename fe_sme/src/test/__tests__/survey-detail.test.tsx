import { screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Routes, Route } from 'react-router-dom'
import userEvent from '@testing-library/user-event'
import SurveyDetail from '../../pages/surveys/SurveyDetail'
import { renderWithProviders } from '../utils'

describe('Survey detail page', () => {
  it('submits survey and shows success state', async () => {
    renderWithProviders(
      <Routes>
        <Route path="/surveys/inbox/:surveyId" element={<SurveyDetail />} />
      </Routes>,
      { route: '/surveys/inbox/survey-1' }
    )

    const submit = await screen.findByRole('button', { name: 'Submit' })
    await userEvent.click(submit)

    expect(await screen.findByText('Thanks for your feedback')).toBeInTheDocument()
  })
})

