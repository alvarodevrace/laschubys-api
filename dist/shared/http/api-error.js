"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiError = void 0;
const common_1 = require("@nestjs/common");
class ApiError extends common_1.HttpException {
    constructor(status, message, detail) {
        super({ message, detail: detail ?? null }, status);
    }
}
exports.ApiError = ApiError;
//# sourceMappingURL=api-error.js.map