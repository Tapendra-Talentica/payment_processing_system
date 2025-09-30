import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as ApiContracts from 'authorizenet';
import * as ApiControllers from 'authorizenet';

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

    if (this.environment === 'sandbox') {
      ApiContracts.Constants.endpoint = 'https://apitest.authorize.net/xml/v1/request.api';
    }

    this.logger.log(`Authorize.Net initialized in ${this.environment} mode`);
  }

  private getMerchantAuth() {
    const merchantAuth = new ApiContracts.MerchantAuthenticationType();
    merchantAuth.setName(this.apiLoginId);
    merchantAuth.setTransactionKey(this.transactionKey);
    return merchantAuth;
  }

  async chargeCreditCard(amount: number, cardNumber: string, expirationDate: string, cardCode: string) {
    this.logger.log('Charge credit card - To be implemented with Authorize.Net SDK');
    return { message: 'To be implemented' };
  }

  async authorizeCreditCard(amount: number, cardNumber: string, expirationDate: string, cardCode: string) {
    this.logger.log('Authorize credit card - To be implemented with Authorize.Net SDK');
    return { message: 'To be implemented' };
  }

  async capturePreviousTransaction(transactionId: string, amount?: number) {
    this.logger.log('Capture transaction - To be implemented with Authorize.Net SDK');
    return { message: 'To be implemented' };
  }

  async voidTransaction(transactionId: string) {
    this.logger.log('Void transaction - To be implemented with Authorize.Net SDK');
    return { message: 'To be implemented' };
  }

  async refundTransaction(transactionId: string, amount: number, last4Digits: string) {
    this.logger.log('Refund transaction - To be implemented with Authorize.Net SDK');
    return { message: 'To be implemented' };
  }
}
