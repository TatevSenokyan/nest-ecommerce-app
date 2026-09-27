import { PipeTransform } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';

import {
  getInternalRpcSecret,
  type InternalRpcEnvelope,
} from './rpc.util';

function isEnvelope(value: unknown): value is InternalRpcEnvelope {
  return (
    typeof value === 'object' &&
    value !== null &&
    'token' in value &&
    'data' in value
  );
}

export class InternalRpcPipe implements PipeTransform {
  transform(value: unknown) {
    const expected = getInternalRpcSecret();

    if (!expected || !isEnvelope(value) || value.token !== expected) {
      throw new RpcException({
        statusCode: 403,
        message: 'Forbidden',
      });
    }

    return value.data;
  }
}
