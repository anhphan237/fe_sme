import { screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import Documents from '../../pages/documents/Documents'
import { renderWithProviders } from '../utils'

describe('Documents page', () => {
  it('renders document library', async () => {
    renderWithProviders(<Documents />)

    expect(await screen.findByText('Library')).toBeInTheDocument()
    expect(screen.getByText('Folders')).toBeInTheDocument()
  })
})

