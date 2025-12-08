import { ApiProperty } from "@nestjs/swagger";
import { z } from "zod";

export class SuccessResponseDto<TData = unknown> {
	@ApiProperty({ type: Boolean, default: true })
	readonly success!: boolean;

	@ApiProperty({ description: "Response data" })
	readonly data!: TData;

	@ApiProperty({ type: String, format: "date-time", required: false })
	readonly timestamp?: string;
}

export type SuccessResponse<TData = unknown> = {
	readonly success: boolean;
	readonly data: TData;
	readonly timestamp?: string;
};

export const SuccessResponseSchema = z.object({
	success: z.boolean().default(true),
	data: z.unknown(),
	timestamp: z.string().datetime().optional(),
});

export class ErrorResponseDto {
	@ApiProperty({ type: Boolean, default: false })
	readonly success!: boolean;

	@ApiProperty({ type: String })
	readonly error!: string;

	@ApiProperty({ type: String })
	readonly message!: string;

	@ApiProperty({ type: Number })
	readonly statusCode!: number;

	@ApiProperty({ type: String, format: "date-time" })
	readonly timestamp!: string;

	@ApiProperty({ type: String })
	readonly path!: string;
}

export type ErrorResponse = {
	readonly success: boolean;
	readonly error: string;
	readonly message: string;
	readonly statusCode: number;
	readonly timestamp: string;
	readonly path: string;
};

export const ErrorResponseSchema = z.object({
	success: z.boolean().default(false),
	error: z.string(),
	message: z.string(),
	statusCode: z.number().int(),
	timestamp: z.string().datetime(),
	path: z.string(),
});
