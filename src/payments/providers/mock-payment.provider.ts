import { Injectable } from '@nestjs/common';
import { PaymentProvider } from './payment-provider';

@Injectable()
export class MockPaymentProvider
  implements PaymentProvider
{
  async charge(
    amount: number,
  ): Promise<{
    success: boolean;
    transactionId: string;
  }> {
    console.log(
      `Mock payment: charging ${amount}`,
    );

    return {
      success: true,
      transactionId: `mock-${Date.now()}`,
    };
  }
}
