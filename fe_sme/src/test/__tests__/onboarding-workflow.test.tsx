import { screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Routes, Route } from 'react-router-dom'
import userEvent from '@testing-library/user-event'
import Templates from '../../pages/onboarding/Templates'
import Dashboard from '../../pages/dashboard/Dashboard'
import EmployeeDetail from '../../pages/onboarding/EmployeeDetail'
import SurveyDetail from '../../pages/surveys/SurveyDetail'
import { renderWithProviders } from '../utils'

describe('Onboarding workflow', () => {
  it('HR: templates page shows available onboarding templates', async () => {
    renderWithProviders(<Templates />)

    expect(await screen.findByText('Operations Essentials')).toBeInTheDocument()
    expect(screen.getByText('Stages')).toBeInTheDocument()
  })

  it('HR: dashboard shows active onboarding KPIs', () => {
    renderWithProviders(<Dashboard />)

    expect(screen.getByText('Active onboardings')).toBeInTheDocument()
    expect(screen.getByText('Pending tasks')).toBeInTheDocument()
  })

  it('Manager: employee detail shows onboarding stage progress and tasks', async () => {
    renderWithProviders(
      <Routes>
        <Route
          path="/onboarding/employees/:employeeId"
          element={<EmployeeDetail />}
        />
      </Routes>,
      { route: '/onboarding/employees/instance-1' },
    )

    expect(await screen.findByText('Stage progress')).toBeInTheDocument()
    expect(screen.getByText('Tasks')).toBeInTheDocument()
  })

  it('Employee: submitting survey shows success state', async () => {
    renderWithProviders(
      <Routes>
        <Route path="/surveys/inbox/:surveyId" element={<SurveyDetail />} />
      </Routes>,
      { route: '/surveys/inbox/survey-1' },
    )

    const submit = await screen.findByRole('button', { name: 'Submit' })
    await userEvent.click(submit)

    expect(
      await screen.findByText('Thanks for your feedback'),
    ).toBeInTheDocument()
  })
})
