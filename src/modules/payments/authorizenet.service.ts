import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { APIContracts, APIControllers } from 'authorizenet';

@Injectable()
export class AuthorizeNetService {
  private readonly logger = new Logger(AuthorizeNetService.name);
  private readonly apiLoginId: string;
  private readonly transactionKey: string;
  private readonly environment: string;

  constructor(private readonly configService: ConfigService) {
    this.apiLoginId = this.configService.get<string>('AUTHORIZENET_API_LOGIN_ID') || '';
    this.transactionKey = this.configService.get<string>('AUTHORIZENET_TRANSACTION_KEY') || '';
    this.environment = this.configService.get<string>('AUTHORIZENET_ENVIRONMENT') || 'sandbox';

    this.logger.log(`Authorize.Net initialized in ${this.environment} mode`);
  }

  private getMerchantAuth() {
    const merchantAuth = new APIContracts.MerchantAuthenticationType();
    merchantAuth.setName(this.apiLoginId);
    merchantAuth.setTransactionKey(this.transactionKey);
    return merchantAuth;
  }

  async chargeCreditCard(
    amount: number,
    cardNumber: string,
    expirationDate: string,
    cardCode: string,
    billingAddress?: {
      firstName?: string;
      lastName?: string;
      address?: string;
      city?: string;
      state?: string;
      zip?: string;
      country?: string;
    },
  ): Promise<{
    success: boolean;
    transactionId: string;
    responseCode: string;
    messageCode: string;
    description: string;
    authCode: string;
  }> {
    return new Promise((resolve, reject) => {
      const merchantAuth = this.getMerchantAuth();

      const creditCard = new APIContracts.CreditCardType();
      creditCard.setCardNumber(cardNumber);
      creditCard.setExpirationDate(expirationDate);
      creditCard.setCardCode(cardCode);

      const paymentType = new APIContracts.PaymentType();
      paymentType.setCreditCard(creditCard);

      const transactionRequest = new APIContracts.TransactionRequestType();
      transactionRequest.setTransactionType(
        APIContracts.TransactionTypeEnum.AUTHCAPTURETRANSACTION,
      );
      transactionRequest.setPayment(paymentType);
      transactionRequest.setAmount(amount);

      if (billingAddress) {
        const billTo = new APIContracts.CustomerAddressType();
        billTo.setFirstName(billingAddress.firstName || '');
        billTo.setLastName(billingAddress.lastName || '');
        billTo.setAddress(billingAddress.address || '');
        billTo.setCity(billingAddress.city || '');
        billTo.setState(billingAddress.state || '');
        billTo.setZip(billingAddress.zip || '');
        billTo.setCountry(billingAddress.country || '');
        transactionRequest.setBillTo(billTo);
      }

      const request = new APIContracts.CreateTransactionRequest();
      request.setMerchantAuthentication(merchantAuth);
      request.setTransactionRequest(transactionRequest);

      const ctrl = new APIControllers.CreateTransactionController(request.getJSON());

      ctrl.execute(() => {
        const apiResponse = ctrl.getResponse();
        const response = new APIContracts.CreateTransactionResponse(apiResponse);

        if (
          response != null &&
          response.getMessages().getResultCode() === APIContracts.MessageTypeEnum.OK
        ) {
          const transactionResponse = response.getTransactionResponse();
          if (transactionResponse.getMessages() != null) {
            this.logger.log(`Charge successful: ${transactionResponse.getTransId()}`);
            resolve({
              success: true,
              transactionId: transactionResponse.getTransId(),
              responseCode: transactionResponse.getResponseCode(),
              messageCode: transactionResponse.getMessages().getMessage()[0].getCode(),
              description: transactionResponse.getMessages().getMessage()[0].getDescription(),
              authCode: transactionResponse.getAuthCode(),
            });
          } else {
            this.logger.error(
              'Charge failed: ' + transactionResponse.getErrors().getError()[0].getErrorText(),
            );
            reject(
              new BadRequestException(transactionResponse.getErrors().getError()[0].getErrorText()),
            );
          }
        } else {
          this.logger.error('Charge failed: ' + response.getMessages().getMessage()[0].getText());
          reject(new BadRequestException(response.getMessages().getMessage()[0].getText()));
        }
      });
    });
  }

  async authorizeCreditCard(
    amount: number,
    cardNumber: string,
    expirationDate: string,
    cardCode: string,
    billingAddress?: {
      firstName?: string;
      lastName?: string;
      address?: string;
      city?: string;
      state?: string;
      zip?: string;
      country?: string;
    },
  ): Promise<{
    success: boolean;
    transactionId: string;
    responseCode: string;
    messageCode: string;
    description: string;
    authCode: string;
  }> {
    return new Promise((resolve, reject) => {
      const merchantAuth = this.getMerchantAuth();

      const creditCard = new APIContracts.CreditCardType();
      creditCard.setCardNumber(cardNumber);
      creditCard.setExpirationDate(expirationDate);
      creditCard.setCardCode(cardCode);

      const paymentType = new APIContracts.PaymentType();
      paymentType.setCreditCard(creditCard);

      const transactionRequest = new APIContracts.TransactionRequestType();
      transactionRequest.setTransactionType(APIContracts.TransactionTypeEnum.AUTHONLYTRANSACTION);
      transactionRequest.setPayment(paymentType);
      transactionRequest.setAmount(amount);

      if (billingAddress) {
        const billTo = new APIContracts.CustomerAddressType();
        billTo.setFirstName(billingAddress.firstName || '');
        billTo.setLastName(billingAddress.lastName || '');
        billTo.setAddress(billingAddress.address || '');
        billTo.setCity(billingAddress.city || '');
        billTo.setState(billingAddress.state || '');
        billTo.setZip(billingAddress.zip || '');
        billTo.setCountry(billingAddress.country || '');
        transactionRequest.setBillTo(billTo);
      }

      const request = new APIContracts.CreateTransactionRequest();
      request.setMerchantAuthentication(merchantAuth);
      request.setTransactionRequest(transactionRequest);

      const ctrl = new APIControllers.CreateTransactionController(request.getJSON());

      ctrl.execute(() => {
        const apiResponse = ctrl.getResponse();
        const response = new APIContracts.CreateTransactionResponse(apiResponse);

        if (
          response != null &&
          response.getMessages().getResultCode() === APIContracts.MessageTypeEnum.OK
        ) {
          const transactionResponse = response.getTransactionResponse();
          if (transactionResponse.getMessages() != null) {
            this.logger.log(`Authorization successful: ${transactionResponse.getTransId()}`);
            resolve({
              success: true,
              transactionId: transactionResponse.getTransId(),
              responseCode: transactionResponse.getResponseCode(),
              messageCode: transactionResponse.getMessages().getMessage()[0].getCode(),
              description: transactionResponse.getMessages().getMessage()[0].getDescription(),
              authCode: transactionResponse.getAuthCode(),
            });
          } else {
            this.logger.error(
              'Authorization failed: ' +
                transactionResponse.getErrors().getError()[0].getErrorText(),
            );
            reject(
              new BadRequestException(transactionResponse.getErrors().getError()[0].getErrorText()),
            );
          }
        } else {
          this.logger.error(
            'Authorization failed: ' + response.getMessages().getMessage()[0].getText(),
          );
          reject(new BadRequestException(response.getMessages().getMessage()[0].getText()));
        }
      });
    });
  }

  async capturePreviousTransaction(
    transactionId: string,
    amount?: number,
  ): Promise<{
    success: boolean;
    transactionId: string;
    responseCode: string;
    messageCode: string;
    description: string;
  }> {
    return new Promise((resolve, reject) => {
      const merchantAuth = this.getMerchantAuth();

      const transactionRequest = new APIContracts.TransactionRequestType();
      transactionRequest.setTransactionType(
        APIContracts.TransactionTypeEnum.PRIORAUTHCAPTURETRANSACTION,
      );
      transactionRequest.setRefTransId(transactionId);
      if (amount) {
        transactionRequest.setAmount(amount);
      }

      const request = new APIContracts.CreateTransactionRequest();
      request.setMerchantAuthentication(merchantAuth);
      request.setTransactionRequest(transactionRequest);

      const ctrl = new APIControllers.CreateTransactionController(request.getJSON());

      ctrl.execute(() => {
        const apiResponse = ctrl.getResponse();
        const response = new APIContracts.CreateTransactionResponse(apiResponse);

        if (
          response != null &&
          response.getMessages().getResultCode() === APIContracts.MessageTypeEnum.OK
        ) {
          const transactionResponse = response.getTransactionResponse();
          if (transactionResponse.getMessages() != null) {
            this.logger.log(`Capture successful: ${transactionResponse.getTransId()}`);
            resolve({
              success: true,
              transactionId: transactionResponse.getTransId(),
              responseCode: transactionResponse.getResponseCode(),
              messageCode: transactionResponse.getMessages().getMessage()[0].getCode(),
              description: transactionResponse.getMessages().getMessage()[0].getDescription(),
            });
          } else {
            this.logger.error(
              'Capture failed: ' + transactionResponse.getErrors().getError()[0].getErrorText(),
            );
            reject(
              new BadRequestException(transactionResponse.getErrors().getError()[0].getErrorText()),
            );
          }
        } else {
          this.logger.error('Capture failed: ' + response.getMessages().getMessage()[0].getText());
          reject(new BadRequestException(response.getMessages().getMessage()[0].getText()));
        }
      });
    });
  }

  async voidTransaction(transactionId: string): Promise<{
    success: boolean;
    transactionId: string;
    responseCode: string;
    messageCode: string;
    description: string;
  }> {
    return new Promise((resolve, reject) => {
      const merchantAuth = this.getMerchantAuth();

      const transactionRequest = new APIContracts.TransactionRequestType();
      transactionRequest.setTransactionType(APIContracts.TransactionTypeEnum.VOIDTRANSACTION);
      transactionRequest.setRefTransId(transactionId);

      const request = new APIContracts.CreateTransactionRequest();
      request.setMerchantAuthentication(merchantAuth);
      request.setTransactionRequest(transactionRequest);

      const ctrl = new APIControllers.CreateTransactionController(request.getJSON());

      ctrl.execute(() => {
        const apiResponse = ctrl.getResponse();
        const response = new APIContracts.CreateTransactionResponse(apiResponse);

        if (
          response != null &&
          response.getMessages().getResultCode() === APIContracts.MessageTypeEnum.OK
        ) {
          const transactionResponse = response.getTransactionResponse();
          if (transactionResponse.getMessages() != null) {
            this.logger.log(`Void successful: ${transactionResponse.getTransId()}`);
            resolve({
              success: true,
              transactionId: transactionResponse.getTransId(),
              responseCode: transactionResponse.getResponseCode(),
              messageCode: transactionResponse.getMessages().getMessage()[0].getCode(),
              description: transactionResponse.getMessages().getMessage()[0].getDescription(),
            });
          } else {
            this.logger.error(
              'Void failed: ' + transactionResponse.getErrors().getError()[0].getErrorText(),
            );
            reject(
              new BadRequestException(transactionResponse.getErrors().getError()[0].getErrorText()),
            );
          }
        } else {
          this.logger.error('Void failed: ' + response.getMessages().getMessage()[0].getText());
          reject(new BadRequestException(response.getMessages().getMessage()[0].getText()));
        }
      });
    });
  }

  async refundTransaction(
    transactionId: string,
    amount: number,
    cardNumber: string,
  ): Promise<{
    success: boolean;
    transactionId: string;
    responseCode: string;
    messageCode: string;
    description: string;
  }> {
    return new Promise((resolve, reject) => {
      const merchantAuth = this.getMerchantAuth();

      const creditCard = new APIContracts.CreditCardType();
      creditCard.setCardNumber(cardNumber.slice(-4));
      creditCard.setExpirationDate('XXXX');

      const paymentType = new APIContracts.PaymentType();
      paymentType.setCreditCard(creditCard);

      const transactionRequest = new APIContracts.TransactionRequestType();
      transactionRequest.setTransactionType(APIContracts.TransactionTypeEnum.REFUNDTRANSACTION);
      transactionRequest.setPayment(paymentType);
      transactionRequest.setAmount(amount);
      transactionRequest.setRefTransId(transactionId);

      const request = new APIContracts.CreateTransactionRequest();
      request.setMerchantAuthentication(merchantAuth);
      request.setTransactionRequest(transactionRequest);

      const ctrl = new APIControllers.CreateTransactionController(request.getJSON());

      ctrl.execute(() => {
        const apiResponse = ctrl.getResponse();
        const response = new APIContracts.CreateTransactionResponse(apiResponse);

        if (
          response != null &&
          response.getMessages().getResultCode() === APIContracts.MessageTypeEnum.OK
        ) {
          const transactionResponse = response.getTransactionResponse();
          if (transactionResponse.getMessages() != null) {
            this.logger.log(`Refund successful: ${transactionResponse.getTransId()}`);
            resolve({
              success: true,
              transactionId: transactionResponse.getTransId(),
              responseCode: transactionResponse.getResponseCode(),
              messageCode: transactionResponse.getMessages().getMessage()[0].getCode(),
              description: transactionResponse.getMessages().getMessage()[0].getDescription(),
            });
          } else {
            this.logger.error(
              'Refund failed: ' + transactionResponse.getErrors().getError()[0].getErrorText(),
            );
            reject(
              new BadRequestException(transactionResponse.getErrors().getError()[0].getErrorText()),
            );
          }
        } else {
          this.logger.error('Refund failed: ' + response.getMessages().getMessage()[0].getText());
          reject(new BadRequestException(response.getMessages().getMessage()[0].getText()));
        }
      });
    });
  }
}
