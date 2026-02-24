import { screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import AdminUsers from '../../pages/admin/Users'
import { renderWithProviders } from '../utils'

describe('Admin users page', () => {
  it('shows user table', async () => {
    renderWithProviders(<AdminUsers />)

    expect(await screen.findByText('Ariana Chen')).toBeInTheDocument()
    expect(screen.getByText('Invite User')).toBeInTheDocument()
  })
})

