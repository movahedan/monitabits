import { type ArgumentMetadata, BadRequestException, type PipeTransform } from "@nestjs/common";
import { z } from "zod";

/**
 * Zod validation pipe for NestJS
 * Validates request bodies and query parameters using Zod schemas
 */
export class ZodValidationPipe implements PipeTransform {
	constructor(private readonly schema: z.ZodSchema) {}

	transform(value: unknown, _metadata: ArgumentMetadata): unknown {
		try {
			const parsedValue = this.schema.parse(value);
			return parsedValue;
		} catch (error) {
			if (error instanceof Error && "issues" in error) {
				const zodError = error as z.ZodError;
				const errors = zodError.issues.map((issue) => ({
					property: issue.path.join("."),
					message: issue.message,
				}));

				throw new BadRequestException({
					success: false,
					error: "VALIDATION_FAILED",
					message: "Validation failed",
					statusCode: 400,
					timestamp: new Date().toISOString(),
					path: "",
					errors,
				});
			}

			throw new BadRequestException({
				success: false,
				error: "VALIDATION_FAILED",
				message: "Validation failed",
				statusCode: 400,
				timestamp: new Date().toISOString(),
				path: "",
			});
		}
	}
}
