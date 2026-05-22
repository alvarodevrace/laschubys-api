import * as Sentry from '@sentry/nestjs';

Sentry.init({
  dsn: 'https://310ad1fd37eef97bc2d6719d2b3654f4@o4511020887638016.ingest.us.sentry.io/4511434504732672',
  environment: process.env.NODE_ENV ?? 'production',
  sendDefaultPii: false,
});
