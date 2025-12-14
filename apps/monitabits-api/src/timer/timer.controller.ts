import {
	Body,
	Controller,
	Get,
	HttpCode,
	HttpStatus,
	Inject,
	Post,
	UseGuards,
} from "@nestjs/common";
import { ApiBody, ApiOperation, ApiResponse, ApiSecurity, ApiTags } from "@nestjs/swagger";
import { DeviceId } from "../common/decorators/device-id.decorator";
import { DeviceAuthGuard } from "../common/guards/device-auth.guard";
import { ErrorResponseDto } from "../common/models";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import {
	type StartTimerRequest,
	StartTimerRequestDto,
	StartTimerRequestSchema,
	type TimerResponse,
	TimerResponseDto,
} from "./timer.model";
import { TimerService } from "./timer.service";

@ApiTags("Timer")
@Controller("timer")
@UseGuards(DeviceAuthGuard)
@ApiSecurity("DeviceAuth")
export class TimerController {
	constructor(@Inject(TimerService) private readonly timerService: TimerService) {
		if (!this.timerService) {
			throw new Error("TimerService not injected");
		}
	}

	@Get("current")
	@ApiOperation({
		summary: "Get current timer status",
		description: "Returns the current timer state (idle, running, paused, or completed)",
	})
	@ApiResponse({
		status: HttpStatus.OK,
		description: "Timer status retrieved successfully",
		type: TimerResponseDto,
	})
	@ApiResponse({
		status: HttpStatus.BAD_REQUEST,
		description: "Invalid request",
		type: ErrorResponseDto,
	})
	async getCurrentTimer(@DeviceId() deviceId: string): Promise<TimerResponse> {
		return this.timerService.getTimer(deviceId);
	}

	@Post("start")
	@HttpCode(HttpStatus.OK)
	@ApiOperation({
		summary: "Start a timer",
		description: "Starts a new timer session (work, short break, or long break)",
	})
	@ApiBody({ type: StartTimerRequestDto })
	@ApiResponse({
		status: HttpStatus.OK,
		description: "Timer started successfully",
		type: TimerResponseDto,
	})
	@ApiResponse({
		status: HttpStatus.BAD_REQUEST,
		description: "Invalid request",
		type: ErrorResponseDto,
	})
	async startTimer(
		@DeviceId() deviceId: string,
		@Body(new ZodValidationPipe(StartTimerRequestSchema)) request: StartTimerRequest,
	): Promise<TimerResponse> {
		return this.timerService.startTimer(deviceId, request);
	}

	@Post("pause")
	@HttpCode(HttpStatus.OK)
	@ApiOperation({
		summary: "Pause the timer",
		description: "Pauses the currently running timer",
	})
	@ApiResponse({
		status: HttpStatus.OK,
		description: "Timer paused successfully",
		type: TimerResponseDto,
	})
	@ApiResponse({
		status: HttpStatus.BAD_REQUEST,
		description: "Timer is not running",
		type: ErrorResponseDto,
	})
	async pauseTimer(@DeviceId() deviceId: string): Promise<TimerResponse> {
		return this.timerService.pauseTimer(deviceId);
	}

	@Post("resume")
	@HttpCode(HttpStatus.OK)
	@ApiOperation({
		summary: "Resume the timer",
		description: "Resumes a paused timer",
	})
	@ApiResponse({
		status: HttpStatus.OK,
		description: "Timer resumed successfully",
		type: TimerResponseDto,
	})
	@ApiResponse({
		status: HttpStatus.BAD_REQUEST,
		description: "Timer is not paused",
		type: ErrorResponseDto,
	})
	async resumeTimer(@DeviceId() deviceId: string): Promise<TimerResponse> {
		return this.timerService.resumeTimer(deviceId);
	}

	@Post("reset")
	@HttpCode(HttpStatus.OK)
	@ApiOperation({
		summary: "Reset the timer",
		description: "Resets the timer to idle state",
	})
	@ApiResponse({
		status: HttpStatus.OK,
		description: "Timer reset successfully",
		type: TimerResponseDto,
	})
	@ApiResponse({
		status: HttpStatus.BAD_REQUEST,
		description: "Invalid request",
		type: ErrorResponseDto,
	})
	async resetTimer(@DeviceId() deviceId: string): Promise<TimerResponse> {
		return this.timerService.resetTimer(deviceId);
	}
}
