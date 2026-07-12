import { Test } from '@nestjs/testing';
import request from 'supertest';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ContactController } from './contact.controller';
import { ContactService } from './contact.service';
import { CsrfGuard } from '../../shared/csrf/csrf.guard';

describe('ContactController (e2e)', () => {
  let app: INestApplication;
  const mockService = { create: jest.fn() };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [ContactController],
      providers: [{ provide: ContactService, useValue: mockService }],
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

  it('POST /contact returns 201 on valid dto', () => {
    mockService.create.mockResolvedValue({ ok: true, contactId: '1' });
    return request(app.getHttpServer())
      .post('/contact')
      .send({ name: 'Ana', email: 'ana@test.com', message: 'Hola mundo' })
      .expect(201)
      .expect({ ok: true, contactId: '1' });
  });

  it('POST /contact returns 400 on invalid dto', () => {
    return request(app.getHttpServer()).post('/contact').send({ email: 'no-valid' }).expect(400);
  });
});
