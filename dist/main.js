"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
require("reflect-metadata");
const helmet_1 = require("helmet");
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const env_1 = require("./shared/config/env");
const api_exception_filter_1 = require("./shared/http/api-exception.filter");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule, { cors: false });
    app.use((0, helmet_1.default)());
    app.enableCors({
        origin: env_1.env.allowedOrigins,
        credentials: true,
        methods: ['GET', 'POST', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    });
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new common_1.ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    app.useGlobalFilters(new api_exception_filter_1.ApiExceptionFilter());
    await app.listen(env_1.env.port);
    common_1.Logger.log(`Las Chubys API en http://localhost:${env_1.env.port}`, 'Bootstrap');
}
void bootstrap();
//# sourceMappingURL=main.js.map