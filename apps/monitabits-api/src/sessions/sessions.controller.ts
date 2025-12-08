import { Controller, HttpCode, HttpStatus, Post, UseGuards } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiSecurity, ApiTags } from "@nestjs/swagger";
import { ClientTime } from "../common/decorators/client-time.decorator";
import { DeviceId } from "../common/decorators/device-id.decorator";
import { DeviceAuthGuard } from "../common/guards/device-auth.guard";
import { TimeValidationGuard } from "../common/guards/time-validation.guard";
import { ErrorResponseDto } from "../common/models";
import { type CheckInResponse, CheckInResponseDto } from "./session.model";
import { SessionsService } from "./sessions.service";

@ApiTags("Sessions")
@Controller("sessions")
@UseGuards(DeviceAuthGuard, TimeValidationGuard)
@ApiSecurity("DeviceAuth")
@ApiSecurity("TimeValidation")
export class SessionsController {
	constructor(private readonly sessionsService: SessionsService) {}

	@Post("check-in")
	@HttpCode(HttpStatus.CREATED)
	@ApiOperation({
		summary: "Create a check-in",
		description: `Creates a check-in record when the app is opened or synced.
This is used for auto-save functionality and activity tracking.
The server handles timezone calculations internally.`,
	})
	@ApiResponse({
		status: HttpStatus.CREATED,
		description: "Check-in created successfully",
		type: CheckInResponseDto,
	})
	@ApiResponse({
		status: HttpStatus.BAD_REQUEST,
		description: "Time validation failed or invalid request",
		type: ErrorResponseDto,
	})
	async checkIn(
		@DeviceId() deviceId: string,
		@ClientTime() clientTime: Date,
	): Promise<CheckInResponse> {
		return this.sessionsService.createCheckIn(deviceId, clientTime, "check_in");
	}

	@Post("check-out")
	@HttpCode(HttpStatus.CREATED)
	@ApiOperation({
		summary: "Create a check-out",
		description: `Creates a check-out record when the app is closed or backgrounded.
This is used for tracking session duration and activity patterns.
The server handles timezone calculations internally.`,
	})
	@ApiResponse({
		status: HttpStatus.CREATED,
		description: "Check-out created successfully",
		type: CheckInResponseDto,
	})
	@ApiResponse({
		status: HttpStatus.BAD_REQUEST,
		description: "Time validation failed or invalid request",
		type: ErrorResponseDto,
	})
	async checkOut(
		@DeviceId() deviceId: string,
		@ClientTime() clientTime: Date,
	): Promise<CheckInResponse> {
		return this.sessionsService.createCheckIn(deviceId, clientTime, "check_out");
	}
}
