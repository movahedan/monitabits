import { Body, Controller, Get, HttpCode, HttpStatus, Post, UseGuards } from "@nestjs/common";
import { ApiBody, ApiOperation, ApiResponse, ApiSecurity, ApiTags } from "@nestjs/swagger";
import { ClientTime } from "../common/decorators/client-time.decorator";
import { DeviceId } from "../common/decorators/device-id.decorator";
import { DeviceAuthGuard } from "../common/guards/device-auth.guard";
import { TimeValidationGuard } from "../common/guards/time-validation.guard";
import { ErrorResponseDto } from "../common/models";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import {
	type ActionResponse,
	ActionResponseDto,
	type FollowUpRequest,
	FollowUpRequestDto,
	FollowUpRequestSchema,
	type FollowUpResponse,
	FollowUpResponseDto,
	type PendingFollowUpResponse,
	PendingFollowUpResponseDto,
} from "./action.model";
import { ActionsService } from "./actions.service";

@ApiTags("Actions")
@Controller("actions")
@UseGuards(DeviceAuthGuard, TimeValidationGuard)
@ApiSecurity("DeviceAuth")
@ApiSecurity("TimeValidation")
export class ActionsController {
	constructor(private readonly actionsService: ActionsService) {}

	@Post("cheat")
	@HttpCode(HttpStatus.CREATED)
	@ApiOperation({
		summary: 'Log "I cheated" action',
		description: `Logs when the user clicks "I cheated and dishonored myself" while in a locked state.
The action is logged but consequences may be delayed.
Note: If the user calls the harm endpoint while cheating, the system detects this automatically.`,
	})
	@ApiResponse({
		status: HttpStatus.CREATED,
		description: "Action logged successfully",
		type: ActionResponseDto,
	})
	@ApiResponse({
		status: HttpStatus.BAD_REQUEST,
		description: "Time validation failed, invalid action, or action not allowed in current state",
		type: ErrorResponseDto,
	})
	async cheat(
		@DeviceId() deviceId: string,
		@ClientTime() clientTime: Date,
	): Promise<ActionResponse> {
		return this.actionsService.logCheat(deviceId, clientTime);
	}

	@Post("harm")
	@HttpCode(HttpStatus.CREATED)
	@ApiOperation({
		summary: 'Log "I\'m choosing to harm myself" action',
		description: `Logs when the user clicks "I'm choosing to harm myself" while in an active state.
This starts a new lockdown period.
Note: This is essentially the same as cheating - if you're cheating and call harm endpoint,
the system detects this automatically.`,
	})
	@ApiResponse({
		status: HttpStatus.CREATED,
		description: "Action logged and lockdown started",
		type: ActionResponseDto,
	})
	@ApiResponse({
		status: HttpStatus.BAD_REQUEST,
		description: "Time validation failed, invalid action, or action not allowed in current state",
		type: ErrorResponseDto,
	})
	async harm(
		@DeviceId() deviceId: string,
		@ClientTime() clientTime: Date,
	): Promise<ActionResponse> {
		return this.actionsService.logHarm(deviceId, clientTime);
	}

	@Get("follow-up/pending")
	@ApiOperation({
		summary: "Get pending follow-up question",
		description: `Returns a pending follow-up question if one is available.
The response includes information about the last lockdown timestamp and
how many cycles the user has been gone.`,
	})
	@ApiResponse({
		status: HttpStatus.OK,
		description: "Follow-up question status",
		type: PendingFollowUpResponseDto,
	})
	@ApiResponse({
		status: HttpStatus.BAD_REQUEST,
		description: "Time validation failed",
		type: ErrorResponseDto,
	})
	async getPendingFollowUp(@DeviceId() deviceId: string): Promise<PendingFollowUpResponse> {
		return this.actionsService.getPendingFollowUp(deviceId);
	}

	@Post("follow-up")
	@HttpCode(HttpStatus.CREATED)
	@ApiOperation({
		summary: "Submit follow-up answer",
		description: `Submits an answer to a follow-up question related to harm actions.
The request can include an array of harm action IDs that this follow-up relates to.`,
	})
	@ApiBody({ type: FollowUpRequestDto })
	@ApiResponse({
		status: HttpStatus.CREATED,
		description: "Follow-up answer submitted successfully",
		type: FollowUpResponseDto,
	})
	@ApiResponse({
		status: HttpStatus.BAD_REQUEST,
		description: "Time validation failed or invalid request",
		type: ErrorResponseDto,
	})
	async submitFollowUp(
		@DeviceId() deviceId: string,
		@ClientTime() clientTime: Date,
		@Body(new ZodValidationPipe(FollowUpRequestSchema)) followUpDto: FollowUpRequest,
	): Promise<{ followUp: FollowUpResponse }> {
		return this.actionsService.submitFollowUp(deviceId, clientTime, followUpDto);
	}
}
