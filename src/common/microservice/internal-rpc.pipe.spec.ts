import { RpcException } from '@nestjs/microservices';

import { InternalRpcPipe } from './internal-rpc.pipe';

describe('InternalRpcPipe', () => {
  const originalSecret = process.env.INTERNAL_RPC_SECRET;
  const pipe = new InternalRpcPipe();

  beforeEach(() => {
    process.env.INTERNAL_RPC_SECRET = 'shared-rpc-secret';
  });

  afterAll(() => {
    if (originalSecret === undefined) {
      delete process.env.INTERNAL_RPC_SECRET;
    } else {
      process.env.INTERNAL_RPC_SECRET = originalSecret;
    }
  });

  it('rejects a missing token', () => {
    expect(() => pipe.transform({ data: { productId: 1 } })).toThrow(
      RpcException,
    );
  });

  it('rejects a wrong token', () => {
    expect(() =>
      pipe.transform({ data: { productId: 1 }, token: 'wrong' }),
    ).toThrow(RpcException);
  });

  it('unwraps data when the token matches', () => {
    expect(
      pipe.transform({
        data: { productId: 1 },
        token: 'shared-rpc-secret',
      }),
    ).toEqual({ productId: 1 });
  });
});
