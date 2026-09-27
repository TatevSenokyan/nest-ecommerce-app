export abstract class PaymentProvider {
  abstract charge(
    amount: number,
  ): Promise<{
    success: boolean;
    transactionId: string;
  }>;
}
