import { screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import Acknowledgments from '../../pages/documents/Acknowledgments'
import { renderWithProviders } from '../utils'

describe('Acknowledgments page', () => {
  it('renders acknowledgment table rows', async () => {
    renderWithProviders(<Acknowledgments />)

    expect(await screen.findByText('Acknowledged')).toBeInTheDocument()
    expect(screen.getByText('Employee')).toBeInTheDocument()
  })
})

