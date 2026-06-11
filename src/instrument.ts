import * as Sentry from '@sentry/nestjs';
import { env } from './shared/config/env';

Sentry.init({
  dsn: env.sentryDsn || '',
  environment: env.nodeEnv,
  sendDefaultPii: false,
});
