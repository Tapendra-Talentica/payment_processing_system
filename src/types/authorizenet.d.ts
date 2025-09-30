declare module 'authorizenet' {
  export namespace APIContracts {
    enum TransactionTypeEnum {
      AUTHCAPTURETRANSACTION = 'authCaptureTransaction',
      AUTHONLYTRANSACTION = 'authOnlyTransaction',
      PRIORAUTHCAPTURETRANSACTION = 'priorAuthCaptureTransaction',
      VOIDTRANSACTION = 'voidTransaction',
      REFUNDTRANSACTION = 'refundTransaction',
    }

    enum MessageTypeEnum {
      OK = 'Ok',
      ERROR = 'Error',
    }

    class MerchantAuthenticationType {
      setName(name: string): void;
      setTransactionKey(key: string): void;
    }

    class CreditCardType {
      setCardNumber(cardNumber: string): void;
      setExpirationDate(expirationDate: string): void;
      setCardCode(cardCode: string): void;
    }

    class PaymentType {
      setCreditCard(creditCard: CreditCardType): void;
    }

    class CustomerAddressType {
      setFirstName(firstName: string): void;
      setLastName(lastName: string): void;
      setAddress(address: string): void;
      setCity(city: string): void;
      setState(state: string): void;
      setZip(zip: string): void;
      setCountry(country: string): void;
    }

    class OrderType {
      setInvoiceNumber(invoiceNumber: string): void;
      setDescription(description: string): void;
    }

    class TransactionRequestType {
      setTransactionType(type: string): void;
      setAmount(amount: number): void;
      setPayment(payment: PaymentType): void;
      setOrder(order: OrderType): void;
      setRefTransId(transactionId: string): void;
      setBillTo(billTo: CustomerAddressType): void;
    }

    class CreateTransactionRequest {
      setMerchantAuthentication(auth: MerchantAuthenticationType): void;
      setTransactionRequest(request: TransactionRequestType): void;
      getJSON(): any;
    }

    class Message {
      getCode(): string;
      getText(): string;
      getDescription(): string;
    }

    class Messages {
      getResultCode(): string;
      getMessage(): Message[];
    }

    class Error {
      getErrorCode(): string;
      getErrorText(): string;
    }

    class Errors {
      getError(): Error[];
    }

    class TransactionResponse {
      getTransId(): string;
      getResponseCode(): string;
      getAuthCode(): string;
      getMessages(): Messages;
      getErrors(): Errors;
    }

    class CreateTransactionResponse {
      constructor(response: any);
      getMessages(): Messages;
      getTransactionResponse(): TransactionResponse;
    }

    class GetTransactionDetailsRequest {
      setMerchantAuthentication(auth: MerchantAuthenticationType): void;
      setTransId(transactionId: string): void;
    }
  }

  export namespace APIControllers {
    class CreateTransactionController {
      constructor(request: any);
      execute(callback: () => void): void;
      getResponse(): any;
    }

    class GetTransactionDetailsController {
      constructor(request: any);
      execute(callback: () => void): void;
      getResponse(): any;
    }
  }
}
