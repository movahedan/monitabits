# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with the monitabits-api application.

## Application Overview

**monitabits-api** is a backend API server built with NestJS and TypeScript. It provides REST endpoints for the monorepo applications and runs on **port 3003** using modern development tooling with Bun and tsup.

## Essential Commands

### Development
- `bun run dev` - Start development server with hot reload on port 3003
- `bun run build` - Build TypeScript to JavaScript in `dist/`
- `bun run start` - Start production server from built files
- `bun run check:types` - Run TypeScript type checking

## Technology Stack

### Core Framework
- **NestJS** - Progressive Node.js framework for building efficient and scalable server-side applications
- **TypeScript** - Type-safe server development
- **Bun Runtime** - Fast JavaScript runtime for development

### NestJS Packages
- **@nestjs/core** - Core NestJS functionality
- **@nestjs/common** - Common NestJS utilities and decorators
- **@nestjs/platform-express** - Express platform adapter for NestJS
- **reflect-metadata** - Decorator metadata support
- **rxjs** - Reactive programming library (required by NestJS)

### Development Tools
- **tsup 8.5.0** - Fast TypeScript bundler
- **supertest 7.1.4** - HTTP testing library
- **@nestjs/testing** - NestJS testing utilities
- **@repo/test-preset** - Shared testing configuration

## Architecture

### Project Structure
```
apps/monitabits-api/
├── src/
│   ├── controllers/        # Route controllers (handlers)
│   │   ├── app.controller.ts # Main application controller
│   │   └── ...             # Feature controllers
│   ├── modules/            # NestJS modules
│   │   ├── app.module.ts   # Root application module
│   │   └── ...             # Feature modules
│   ├── services/           # Business logic layer
│   │   └── ...             # Service classes
│   ├── dto/                # Data Transfer Objects
│   │   └── ...             # Request/response DTOs
│   ├── interceptors/       # Request/response interceptors
│   │   └── ...             # Interceptor classes
│   ├── guards/             # Authentication/authorization guards
│   │   └── ...             # Guard classes
│   ├── pipes/              # Validation and transformation pipes
│   │   └── ...             # Pipe classes
│   ├── filters/            # Exception filters
│   │   └── ...             # Exception filter classes
│   ├── types/              # TypeScript type definitions
│   ├── __tests__/          # Test files
│   │   └── server.test.ts  # Server tests
│   ├── main.ts             # Application entry point
│   └── index.ts            # Entry point that imports main.ts
├── dist/                   # Built JavaScript files
├── tsconfig.json           # TypeScript configuration
├── tsup.config.ts          # Build configuration
└── package.json            # Dependencies and scripts
```

### Development Patterns

#### NestJS Application Setup
```typescript
// src/main.ts
import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { log } from "@repo/utils/logger";

async function bootstrap(): Promise<void> {
	const app = await NestFactory.create(AppModule);

	const host = process.env.HOST || "localhost";
	const port = process.env.PORT ? Number(process.env.PORT) : 3003;

	await app.listen(port, host);
	log(`API running on ${host}:${port}`);
}

bootstrap().catch((error) => {
	console.error("Failed to start server:", error);
	process.exit(1);
});
```

#### Module Pattern
```typescript
// src/app.module.ts
import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";

@Module({
	controllers: [AppController],
	providers: [AppService],
})
export class AppModule {}
```

#### Controller Pattern
```typescript
// src/app.controller.ts
import { Controller, Get, Post, Body, Param, Query } from "@nestjs/common";
import { AppService } from "./app.service";
import { CreateProductDto } from "./dto/create-product.dto";

@Controller("products")
export class ProductsController {
	constructor(private readonly appService: AppService) {}

	@Get()
	getProducts(@Query("page") page?: number, @Query("limit") limit?: number) {
		return this.appService.getProducts({ page, limit });
	}

	@Get(":id")
	getProductById(@Param("id") id: string) {
		return this.appService.getProductById(id);
	}

	@Post()
	createProduct(@Body() createProductDto: CreateProductDto) {
		return this.appService.createProduct(createProductDto);
	}
}
```

#### Service Pattern
```typescript
// src/app.service.ts
import { Injectable } from "@nestjs/common";
import { log } from "@repo/utils/logger";

export interface Product {
	readonly id: string;
	readonly name: string;
	readonly description: string;
	readonly price: number;
	readonly category: string;
	readonly createdAt: Date;
	readonly updatedAt: Date;
}

@Injectable()
export class AppService {
	async getProducts(options: { page?: number; limit?: number }): Promise<Product[]> {
		log("Service: Fetching products", options);
		
		// Business logic here
		// Database queries, external API calls, etc.
		
		return [];
	}

	async getProductById(id: string): Promise<Product | null> {
		log("Service: Fetching product by ID", { id });
		
		// Business logic here
		
		return null;
	}

	async createProduct(data: Partial<Product>): Promise<Product> {
		log("Service: Creating product", data);
		
		// Business logic here
		
		return {
			id: Math.random().toString(36).substring(7),
			name: data.name ?? "",
			description: data.description ?? "",
			price: data.price ?? 0,
			category: data.category ?? "",
			createdAt: new Date(),
			updatedAt: new Date(),
		};
	}
}
```

#### DTO Pattern (Data Transfer Objects)
```typescript
// src/dto/create-product.dto.ts
export class CreateProductDto {
	readonly name: string;
	readonly description: string;
	readonly price: number;
	readonly category: string;
}

// Usage with validation
import { IsString, IsNumber, IsNotEmpty, Min } from "class-validator";

export class CreateProductDto {
	@IsString()
	@IsNotEmpty()
	readonly name: string;

	@IsString()
	@IsNotEmpty()
	readonly description: string;

	@IsNumber()
	@Min(0)
	readonly price: number;

	@IsString()
	@IsNotEmpty()
	readonly category: string;
}
```

#### Guard Pattern (Authentication/Authorization)
```typescript
// src/guards/auth.guard.ts
import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from "@nestjs/common";
import { Observable } from "rxjs";

@Injectable()
export class AuthGuard implements CanActivate {
	canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
		const request = context.switchToHttp().getRequest();
		const token = request.headers.authorization?.replace("Bearer ", "");

		if (!token) {
			throw new UnauthorizedException("Authentication required");
		}

		// Token validation logic here
		return true;
	}
}

// Usage in controller
@UseGuards(AuthGuard)
@Controller("protected")
export class ProtectedController {
	// Protected routes
}
```

#### Exception Filter Pattern
```typescript
// src/filters/http-exception.filter.ts
import { ExceptionFilter, Catch, ArgumentsHost, HttpException } from "@nestjs/common";
import { Request, Response } from "express";
import { log } from "@repo/utils/logger";

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
	catch(exception: HttpException, host: ArgumentsHost) {
		const ctx = host.switchToHttp();
		const response = ctx.getResponse<Response>();
		const request = ctx.getRequest<Request>();
		const status = exception.getStatus();

		log("HTTP Exception", {
			status,
			message: exception.message,
			url: request.url,
			method: request.method,
		});

		response.status(status).json({
			success: false,
			statusCode: status,
			message: exception.message,
			timestamp: new Date().toISOString(),
			path: request.url,
		});
	}
}

// Usage in main.ts
app.useGlobalFilters(new HttpExceptionFilter());
```

## Development Guidelines

### API Design Principles
- **RESTful endpoints** following REST conventions
- **Consistent response format** with success/error structure
- **Proper HTTP status codes** for different scenarios
- **Comprehensive logging** for monitoring and debugging
- **Error handling** at all layers using NestJS exception filters

### Response Format Standards
```typescript
// Success responses
{
	success: true,
	data: {...},
	pagination: {...} // for paginated responses
}

// Error responses (handled by exception filters)
{
	success: false,
	statusCode: 400,
	message: "Error message",
	timestamp: "2024-01-01T00:00:00.000Z",
	path: "/api/products"
}
```

### Security Best Practices
- Input validation using class-validator and DTOs
- Authentication guards for protected routes
- CORS configuration in main.ts
- Rate limiting using @nestjs/throttler
- Secure headers and middleware

### Testing Patterns
```typescript
import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import supertest from "supertest";
import { AppModule } from "../app.module";

describe("ProductsController", () => {
	let app: INestApplication;

	beforeAll(async () => {
		const moduleFixture: TestingModule = await Test.createTestingModule({
			imports: [AppModule],
		}).compile();

		app = moduleFixture.createNestApplication();
		await app.init();
	});

	afterAll(async () => {
		await app.close();
	});

	it("GET /products should return products list", async () => {
		const response = await supertest(app.getHttpServer())
			.get("/products")
			.expect(200);

		expect(response.body.success).toBe(true);
		expect(Array.isArray(response.body.data)).toBe(true);
	});

	it("POST /products should create new product", async () => {
		const productData = {
			name: "Test Product",
			description: "Test Description",
			price: 29.99,
			category: "test",
		};

		const response = await supertest(app.getHttpServer())
			.post("/products")
			.send(productData)
			.expect(201);

		expect(response.body.success).toBe(true);
		expect(response.body.data.name).toBe(productData.name);
	});
});
```

## Integration with Monorepo

### Port Configuration
- Runs on port 3003 by default
- Configured to accept requests from frontend apps (ports 3001, 3002)
- CORS can be configured in main.ts using `app.enableCors()`

### Shared Dependencies
- **@repo/utils**: Uses logger for consistent logging across the monorepo
- **@repo/test-preset**: Shared testing configuration and utilities

### Frontend Integration
- Provides REST API endpoints for admin and storefront applications
- Consistent response formats for easy frontend integration
- Proper error handling and status codes

When working with this API application, focus on building robust, scalable REST endpoints using NestJS best practices while maintaining consistency with monorepo patterns and leveraging shared utilities.
