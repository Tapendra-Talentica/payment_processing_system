export const APIContracts = {
  MerchantAuthenticationType: jest.fn().mockImplementation(() => ({
    setName: jest.fn(),
    setTransactionKey: jest.fn(),
  })),
  CreditCardType: jest.fn().mockImplementation(() => ({
    setCardNumber: jest.fn(),
    setExpirationDate: jest.fn(),
    setCardCode: jest.fn(),
  })),
  PaymentType: jest.fn().mockImplementation(() => ({
    setCreditCard: jest.fn(),
  })),
  TransactionRequestType: jest.fn().mockImplementation(() => ({
    setTransactionType: jest.fn(),
    setPayment: jest.fn(),
    setAmount: jest.fn(),
    setRefTransId: jest.fn(),
    setBillTo: jest.fn(),
  })),
  CustomerAddressType: jest.fn().mockImplementation(() => ({
    setFirstName: jest.fn(),
    setLastName: jest.fn(),
    setAddress: jest.fn(),
    setCity: jest.fn(),
    setState: jest.fn(),
    setZip: jest.fn(),
    setCountry: jest.fn(),
  })),
  CreateTransactionRequest: jest.fn().mockImplementation(() => ({
    setMerchantAuthentication: jest.fn(),
    setTransactionRequest: jest.fn(),
    getJSON: jest.fn(),
  })),
  CreateTransactionResponse: jest.fn().mockImplementation(() => ({
    getMessages: jest.fn(),
    getTransactionResponse: jest.fn(),
  })),
  TransactionTypeEnum: {
    AUTHCAPTURETRANSACTION: 'authCaptureTransaction',
    AUTHONLYTRANSACTION: 'authOnlyTransaction',
    PRIORAUTHCAPTURETRANSACTION: 'priorAuthCaptureTransaction',
    VOIDTRANSACTION: 'voidTransaction',
    REFUNDTRANSACTION: 'refundTransaction',
  },
  MessageTypeEnum: {
    OK: 'Ok',
    ERROR: 'Error',
  },
};

export const APIControllers = {
  CreateTransactionController: jest.fn().mockImplementation(() => ({
    execute: jest.fn(),
    getResponse: jest.fn(),
  })),
};

