import { type ArgumentsHost, Catch, type ExceptionFilter, HttpStatus } from "@nestjs/common";
import { logger } from "@repo/utils/logger";
import { Request, Response } from "express";

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
	catch(exception: unknown, host: ArgumentsHost): void {
		const ctx = host.switchToHttp();
		const response = ctx.getResponse<Response>();
		const request = ctx.getRequest<Request>();

		const status =
			exception instanceof Error && "status" in exception && typeof exception.status === "number"
				? exception.status
				: HttpStatus.INTERNAL_SERVER_ERROR;

		const message = exception instanceof Error ? exception.message : "Internal server error";

		const errorResponse = {
			success: false,
			error: "INTERNAL_SERVER_ERROR",
			message,
			statusCode: status,
			timestamp: new Date().toISOString(),
			path: request.url,
		};

		logger.error("Unhandled Exception", {
			status,
			error: errorResponse,
			exception,
			url: request.url,
			method: request.method,
		});

		response.status(status).json(errorResponse);
	}
}
