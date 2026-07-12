import { Test } from '@nestjs/testing';
import request from 'supertest';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { CheckoutController } from './checkout.controller';
import { CheckoutService } from './checkout.service';
import { CsrfGuard } from '../../shared/csrf/csrf.guard';

describe('CheckoutController (e2e)', () => {
  let app: INestApplication;
  const mockService = { createOrder: jest.fn() };
  const validOrder = {
    customer: {
      name: 'Ana',
      phone: '099',
      email: 'ana@test.com',
      province: 'Pichincha',
      address: 'Calle 1',
    },
    items: [{ id: 'p1', name: 'Arena', qty: 1, price: 10 }],
    total: 10,
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [CheckoutController],
      providers: [{ provide: CheckoutService, useValue: mockService }],
    })
      .overrideGuard(CsrfGuard)
      .useValue({ canActivate: () => true })
      .compile();
    app = module.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    await app.init();
  });

  afterEach(async () => await app.close());

  it('POST /checkout creates order', () => {
    mockService.createOrder.mockResolvedValue({ ok: true, orderId: 'o1' });
    return request(app.getHttpServer())
      .post('/checkout')
      .send(validOrder)
      .expect(201)
      .expect({ ok: true, orderId: 'o1' });
  });

  it('POST /checkout returns 400 on invalid order', () => {
    return request(app.getHttpServer()).post('/checkout').send({}).expect(400);
  });
});
