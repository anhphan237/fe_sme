import { screen, waitFor } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'
import Templates from '../../pages/onboarding/Templates'
import { renderWithProviders } from '../utils'
import { useUserStore } from '@/stores/user.store'

beforeEach(() => {
  // Reset user state before each test
  useUserStore.getState().setUser(null)
})

describe('Templates page — HR role', () => {
  it('renders both seed templates', async () => {
    renderWithProviders(<Templates />, { user: { roles: ['HR'] } })
    expect(await screen.findByText('Operations Essentials')).toBeInTheDocument()
    expect(await screen.findByText('Acme New Hire Journey')).toBeInTheDocument()
  })

  it('shows column headers', async () => {
    renderWithProviders(<Templates />, { user: { roles: ['HR'] } })
    await screen.findByText('Operations Essentials')
    expect(screen.getAllByText('Template name').length).toBeGreaterThan(0)
  })

  it('shows Edit and Duplicate action buttons', async () => {
    renderWithProviders(<Templates />, { user: { roles: ['HR'] } })
    await screen.findByText('Operations Essentials')
    const editBtns = screen.getAllByRole('button', { name: /edit/i })
    expect(editBtns.length).toBeGreaterThan(0)
    const dupBtns = screen.getAllByRole('button', { name: /duplicate/i })
    expect(dupBtns.length).toBeGreaterThan(0)
  })

  it('shows command cards (New / Clone / AI)', async () => {
    renderWithProviders(<Templates />, { user: { roles: ['HR'] } })
    await screen.findByText('Operations Essentials')
    expect(screen.getByRole('button', { name: /new template/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /ask ai for draft/i })).toBeInTheDocument()
  })

  it('does NOT show the read-only banner', async () => {
    renderWithProviders(<Templates />, { user: { roles: ['HR'] } })
    await screen.findByText('Operations Essentials')
    expect(screen.queryByTestId('readonly-banner')).toBeNull()
  })
})

describe('Templates page — MANAGER role', () => {
  it('renders templates list', async () => {
    renderWithProviders(<Templates />, { user: { roles: ['MANAGER'] } })
    expect(await screen.findByText('Operations Essentials')).toBeInTheDocument()
  })

  it('shows read-only banner', async () => {
    renderWithProviders(<Templates />, { user: { roles: ['MANAGER'] } })
    await screen.findByText('Operations Essentials')
    expect(screen.getByTestId('readonly-banner')).toBeInTheDocument()
  })

  it('shows View details button instead of Edit/Duplicate', async () => {
    renderWithProviders(<Templates />, { user: { roles: ['MANAGER'] } })
    await screen.findByText('Operations Essentials')
    expect(screen.getAllByRole('button', { name: /view details/i }).length).toBeGreaterThan(0)
    expect(screen.queryByRole('button', { name: /^edit$/i })).toBeNull()
    expect(screen.queryByRole('button', { name: /^duplicate$/i })).toBeNull()
  })

  it('does NOT show command cards', async () => {
    renderWithProviders(<Templates />, { user: { roles: ['MANAGER'] } })
    await screen.findByText('Operations Essentials')
    expect(screen.queryByRole('button', { name: /new template/i })).toBeNull()
    expect(screen.queryByRole('button', { name: /ask ai for draft/i })).toBeNull()
  })
})

describe('Templates page — unauthenticated (no roles)', () => {
  it('renders templates list without crashing', async () => {
    renderWithProviders(<Templates />)
    await waitFor(() =>
      expect(screen.queryByRole('alert')).toBeDefined(),
    )
  })
})

