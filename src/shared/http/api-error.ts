import { HttpException } from '@nestjs/common';

export class ApiError extends HttpException {
  constructor(status: number, message: string, detail?: unknown) {
    super({ message, detail: detail ?? null }, status);
  }
}
