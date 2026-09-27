import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';

import { PaymentsService } from './payments.service';
import { PaymentProvider } from './providers/payment-provider';
import { PaymentStatus } from './entities/payment.entity';

describe('PaymentsService', () => {
  let service: PaymentsService;

  const managerMock = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const paymentRepositoryMock = {
    findOne: jest.fn(),
  };

  const dataSourceMock = {
    getRepository: jest.fn().mockReturnValue(paymentRepositoryMock),
    transaction: jest.fn(),
  };

  const paymentProviderMock = {
    charge: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    dataSourceMock.getRepository.mockReturnValue(paymentRepositoryMock);
    dataSourceMock.transaction.mockImplementation(async (callback) =>
      callback(managerMock),
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        {
          provide: DataSource,
          useValue: dataSourceMock,
        },
        {
          provide: PaymentProvider,
          useValue: paymentProviderMock,
        },
      ],
    }).compile();

    service = module.get(PaymentsService);
  });

  it('should charge and mark the payment succeeded', async () => {
    paymentRepositoryMock.findOne.mockResolvedValue(null);

    const created = {
      id: 3,
      orderId: 10,
      userId: 7,
      amount: 50,
      status: PaymentStatus.PROCESSING,
      idempotencyKey: 'key-1',
    };

    managerMock.findOne
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(created);
    managerMock.create.mockImplementation((_entity, value) => value);
    managerMock.save.mockImplementation(async (value) => ({
      ...created,
      ...value,
      id: 3,
    }));
    paymentProviderMock.charge.mockResolvedValue({
      success: true,
      transactionId: 'mock-1',
    });

    const result = await service.create({
      orderId: 10,
      userId: 7,
      amount: 50,
      idempotencyKey: 'key-1',
    });

    expect(paymentProviderMock.charge).toHaveBeenCalledWith(50);
    expect(result.status).toBe(PaymentStatus.SUCCEEDED);
  });

  it('should return an existing completed payment for the same idempotency key', async () => {
    paymentRepositoryMock.findOne.mockResolvedValue({
      id: 3,
      status: PaymentStatus.SUCCEEDED,
      idempotencyKey: 'key-1',
    });

    const result = await service.create({
      orderId: 10,
      userId: 7,
      amount: 50,
      idempotencyKey: 'key-1',
    });

    expect(result.status).toBe(PaymentStatus.SUCCEEDED);
    expect(paymentProviderMock.charge).not.toHaveBeenCalled();
  });
});
