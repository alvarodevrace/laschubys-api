import { HttpException } from '@nestjs/common';
export declare class ApiError extends HttpException {
    constructor(status: number, message: string, detail?: unknown);
}
