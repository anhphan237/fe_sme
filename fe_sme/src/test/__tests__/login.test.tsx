import { screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import Login from '../../pages/auth/Login'
import { renderWithProviders } from '../utils'

describe('Login page', () => {
  it('renders login form fields', () => {
    renderWithProviders(<Login />)

    expect(screen.getByText('Sign in')).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
    expect(screen.getByLabelText('Role (demo)')).toBeInTheDocument()
  })
})

