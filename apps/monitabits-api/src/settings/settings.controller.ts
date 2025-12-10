import { Body, Controller, Get, HttpCode, HttpStatus, Put, UseGuards } from "@nestjs/common";
import { ApiBody, ApiOperation, ApiResponse, ApiSecurity, ApiTags } from "@nestjs/swagger";
import { DeviceId } from "../common/decorators/device-id.decorator";
import { DeviceAuthGuard } from "../common/guards/device-auth.guard";
import { TimeValidationGuard } from "../common/guards/time-validation.guard";
import { ErrorResponseDto } from "../common/models";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import {
	type Settings,
	SettingsDto,
	type UpdateSettingsRequest,
	UpdateSettingsRequestDto,
	UpdateSettingsRequestSchema,
} from "./settings.model";
import { SettingsService } from "./settings.service";

@ApiTags("Settings")
@Controller("settings")
@UseGuards(DeviceAuthGuard, TimeValidationGuard)
@ApiSecurity("DeviceAuth")
@ApiSecurity("TimeValidation")
export class SettingsController {
	constructor(private readonly settingsService: SettingsService) {
		if (!this.settingsService) {
			throw new Error(
				"SettingsService not injected. Check module configuration and bundling settings.",
			);
		}
	}

	@Get()
	@ApiOperation({
		summary: "Get user settings",
		description: "Returns the current user settings, primarily the lockdown period.",
	})
	@ApiResponse({
		status: HttpStatus.OK,
		description: "Settings retrieved successfully",
		type: SettingsDto,
	})
	@ApiResponse({
		status: HttpStatus.BAD_REQUEST,
		description: "Time validation failed",
		type: ErrorResponseDto,
	})
	async getSettings(@DeviceId() deviceId: string): Promise<Settings> {
		return this.settingsService.getSettings(deviceId);
	}

	@Put()
	@HttpCode(HttpStatus.OK)
	@ApiOperation({
		summary: "Update user settings",
		description: "Updates user settings, primarily the lockdown period in minutes.",
	})
	@ApiBody({ type: UpdateSettingsRequestDto })
	@ApiResponse({
		status: HttpStatus.OK,
		description: "Settings updated successfully",
		type: SettingsDto,
	})
	@ApiResponse({
		status: HttpStatus.BAD_REQUEST,
		description: "Time validation failed or invalid settings",
		type: ErrorResponseDto,
	})
	async updateSettings(
		@DeviceId() deviceId: string,
		@Body(new ZodValidationPipe(UpdateSettingsRequestSchema)) updateDto: UpdateSettingsRequest,
	): Promise<Settings> {
		return this.settingsService.updateSettings(deviceId, updateDto.lockdownMinutes);
	}
}
