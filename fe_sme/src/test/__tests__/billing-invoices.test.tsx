import { screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import BillingInvoices from '../../pages/billing/Invoices'
import { renderWithProviders } from '../utils'

describe('Billing invoices page', () => {
  it('renders invoice table', async () => {
    renderWithProviders(<BillingInvoices />)

    expect(await screen.findByText('Invoice #')).toBeInTheDocument()
    expect(screen.getByText('Download')).toBeInTheDocument()
  })
})

