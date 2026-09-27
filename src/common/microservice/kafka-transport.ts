import { ConfigService } from '@nestjs/config';
import { KafkaOptions, Transport } from '@nestjs/microservices';

export const getKafkaBrokers = (configService: ConfigService): string[] =>
  configService
    .get<string>('KAFKA_BROKERS', 'localhost:9092')
    .split(',')
    .map((broker) => broker.trim());

export const getKafkaTransportOptions = (
  configService: ConfigService,
  clientId: string,
  groupId: string,
): KafkaOptions => ({
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
});
