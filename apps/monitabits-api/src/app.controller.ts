import { Controller, Get, HttpStatus } from "@nestjs/common";
import { ApiOperation, ApiProperty, ApiResponse, ApiTags } from "@nestjs/swagger";
import { z } from "zod";
import { ErrorResponseDto, SuccessResponseDto } from "./common/models";

export class AppDto {
	@ApiProperty({ type: Boolean })
	readonly ok!: boolean;
}

export const AppSchema = z.object({
	ok: z.boolean(),
});

export class AppResponseDto {
	@ApiProperty({ type: () => AppDto })
	readonly data!: AppDto;
}

@Controller()
@ApiTags("Health")
export class AppController {
	@Get("status")
	@ApiOperation({ summary: "Health check endpoint" })
	@ApiResponse({ status: HttpStatus.OK, description: "Service is healthy", type: AppResponseDto })
	@ApiResponse({
		status: HttpStatus.INTERNAL_SERVER_ERROR,
		description: "Service is unhealthy",
		type: ErrorResponseDto,
	})
	async getStatus(): Promise<SuccessResponseDto<AppDto>> {
		return { success: true, data: { ok: true } };
	}
}
