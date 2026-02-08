export interface UserCustomer {
    key: string
    id: string
    customerTypeId: string
    customerTypeCode: string
    customerTypeName: string
    name: string
    code: string
    phone: string
    email: string
    address: string
    description: string
    supplier: boolean
    taxCode: string
    created: string
    createdBy: string
    createdByName: string
    lastModified: string
    lastModifiedBy: string
    lastModifiedByName: string
    customerContactPersons: CustomerContactPerson[]
    customerWarehouses: CustomerWarehouse[]
    customerBankAccounts: CustomerBankAccount[]
    label: string
    value: string
    nameShort: string
  }
  
  export interface CustomerContactPerson {
    id: string
    customerId: string
    name: string
    phone: string
    position: string
    description: string
    created: string
    lastModified: string
  }
  
  export interface CustomerWarehouse {
    id: string
    customerId: string
    name: string
    address: string
    description: string
    created: string
    lastModified: string
  }
  
  export interface CustomerBankAccount {
    id: string
    customerId: string
    bankAccountName: string
    bankAccountNumber: string
    bankName: string
    bankBranch: string
    description: string
    created: string
    lastModified: string
  }
  