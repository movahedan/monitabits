import { type ArgumentsHost, Catch, type ExceptionFilter, HttpException } from "@nestjs/common";
import { log } from "@repo/utils/logger";
import { Request, Response } from "express";

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
	catch(exception: HttpException, host: ArgumentsHost): void {
		const ctx = host.switchToHttp();
		const response = ctx.getResponse<Response>();
		const request = ctx.getRequest<Request>();
		const status = exception.getStatus();
		const exceptionResponse = exception.getResponse();

		// If the exception already has our custom error format, use it
		if (
			typeof exceptionResponse === "object" &&
			exceptionResponse !== null &&
			"success" in exceptionResponse
		) {
			log("HTTP Exception", {
				status,
				error: exceptionResponse,
				url: request.url,
				method: request.method,
			});

			response.status(status).json(exceptionResponse);
			return;
		}

		// Otherwise, format it as ErrorResponse
		const message =
			typeof exceptionResponse === "string"
				? exceptionResponse
				: typeof exceptionResponse === "object" &&
						exceptionResponse !== null &&
						"message" in exceptionResponse
					? String(exceptionResponse.message)
					: exception.message || "An error occurred";

		const errorResponse = {
			success: false,
			error: exception.name || "HTTP_EXCEPTION",
			message,
			statusCode: status,
			timestamp: new Date().toISOString(),
			path: request.url,
		};

		log("HTTP Exception", {
			status,
			error: errorResponse,
			url: request.url,
			method: request.method,
		});

		response.status(status).json(errorResponse);
	}
}
