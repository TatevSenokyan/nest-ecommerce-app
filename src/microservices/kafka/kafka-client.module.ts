import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';

import { KAFKA_SERVICE } from '../../common/constants/microservice.constants';
import { getKafkaBrokers } from '../../common/microservice/kafka-transport';
import { OutboxRelayService } from '../../common/outbox/outbox-relay.service';

@Module({})
export class KafkaClientModule {
  static register(clientId: string, groupId: string): DynamicModule {
    return {
      module: KafkaClientModule,
      imports: [
        ClientsModule.registerAsync([
          {
            name: KAFKA_SERVICE,
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => ({
              transport: Transport.KAFKA,
              options: {
                client: {
                  clientId,
                  brokers: getKafkaBrokers(configService),
                },
                consumer: {
                  groupId,
                },
              },
            }),
          },
        ]),
      ],
      providers: [OutboxRelayService],
      exports: [ClientsModule, OutboxRelayService],
    };
  }
}
