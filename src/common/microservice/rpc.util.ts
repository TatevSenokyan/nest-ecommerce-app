import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  NotFoundException,
} from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { firstValueFrom, timeout } from 'rxjs';
import { ClientProxy } from '@nestjs/microservices';

export const TEST_INTERNAL_RPC_SECRET = 'test-internal-rpc-secret';

export type InternalRpcEnvelope<T = unknown> = {
  data: T;
  token: string;
};

export function getInternalRpcSecret(): string {
  const secret = process.env.INTERNAL_RPC_SECRET;
  if (secret) {
    return secret;
  }

  if (process.env.NODE_ENV === 'test') {
    return TEST_INTERNAL_RPC_SECRET;
  }

  return '';
}

export function toRpcException(error: unknown): RpcException {
  if (error instanceof HttpException) {
    return new RpcException({
      statusCode: error.getStatus(),
      message: error.message,
    });
  }

  const message =
    error instanceof Error ? error.message : 'Internal microservice error';

  return new RpcException({
    statusCode: 500,
    message,
  });
}

export function rethrowRpc(error: unknown): never {
  const payload =
    typeof error === 'object' && error !== null
      ? (error as { statusCode?: number; message?: string; error?: { statusCode?: number; message?: string } })
      : {};

  const status =
    payload.statusCode ?? payload.error?.statusCode ?? 500;
  const message =
    payload.message ?? payload.error?.message ?? 'Microservice error';

  if (status === 404) {
    throw new NotFoundException(message);
  }

  if (status === 400) {
    throw new BadRequestException(message);
  }

  if (status === 403) {
    throw new ForbiddenException(message);
  }

  throw new BadRequestException(message);
}

export async function sendCommand<T>(
  client: ClientProxy,
  pattern: string,
  data: unknown,
): Promise<T> {
  try {
    return await firstValueFrom(
      client
        .send<T>(pattern, {
          data,
          token: getInternalRpcSecret(),
        } satisfies InternalRpcEnvelope)
        .pipe(timeout(10_000)),
    );
  } catch (error) {
    rethrowRpc(error);
  }
}
