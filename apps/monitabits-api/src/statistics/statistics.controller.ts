import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { ApiOperation, ApiQuery, ApiResponse, ApiSecurity, ApiTags } from "@nestjs/swagger";
import { DeviceId } from "../common/decorators/device-id.decorator";
import { DeviceAuthGuard } from "../common/guards/device-auth.guard";
import { TimeValidationGuard } from "../common/guards/time-validation.guard";
import { ErrorResponseDto } from "../common/models";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import {
	type LockdownNowResponse,
	LockdownNowResponseDto,
	type StatisticsDetailsResponse,
	StatisticsDetailsResponseDto,
	type StatisticsSummary,
	StatisticsSummaryDto,
	type StatsDetailsQueryParams,
	StatsDetailsQueryParamsSchema,
} from "./statistics.model";
import { StatisticsService } from "./statistics.service";

@ApiTags("Statistics")
@Controller("stats")
@UseGuards(DeviceAuthGuard, TimeValidationGuard)
@ApiSecurity("DeviceAuth")
@ApiSecurity("TimeValidation")
export class StatisticsController {
	constructor(private readonly statisticsService: StatisticsService) {}

	@Get("now")
	@ApiOperation({
		summary: "Get current lockdown status",
		description: `Returns the current lockdown status including whether the user is locked
and how much time remains in the lockdown period.`,
	})
	@ApiResponse({
		status: 200,
		description: "Current lockdown status",
		type: LockdownNowResponseDto,
	})
	@ApiResponse({
		status: 400,
		description: "Time validation failed",
		type: ErrorResponseDto,
	})
	async getLockdownNow(@DeviceId() deviceId: string): Promise<LockdownNowResponse> {
		return this.statisticsService.getLockdownNow(deviceId);
	}

	@Get("summary")
	@ApiOperation({
		summary: "Get comprehensive statistics summary",
		description: `Returns comprehensive user statistics including time saved, streaks, activity metrics,
and session report data (check-ins during lockdown, time spent on page during lockdown, etc.).
Fewer check-ins and less time spent on page during lockdown are better indicators.`,
	})
	@ApiResponse({
		status: 200,
		description: "Statistics summary retrieved successfully",
		type: StatisticsSummaryDto,
	})
	@ApiResponse({
		status: 400,
		description: "Time validation failed",
		type: ErrorResponseDto,
	})
	async getSummary(@DeviceId() deviceId: string): Promise<StatisticsSummary> {
		return this.statisticsService.getSummary(deviceId);
	}

	@Get("details")
	@ApiOperation({
		summary: "Get detailed time table report",
		description: `Returns a detailed time table report for a specified date range.
Each entry includes session status, check-ins, actions, and time spent on page.`,
	})
	@ApiQuery({
		name: "startDate",
		required: true,
		type: String,
		format: "date",
		description: "Start date for the report (inclusive)",
		example: "2024-01-01",
	})
	@ApiQuery({
		name: "endDate",
		required: true,
		type: String,
		format: "date",
		description: "End date for the report (inclusive)",
		example: "2024-01-31",
	})
	@ApiResponse({
		status: 200,
		description: "Detailed statistics retrieved successfully",
		type: StatisticsDetailsResponseDto,
	})
	@ApiResponse({
		status: 400,
		description: "Time validation failed or invalid date range",
		type: ErrorResponseDto,
	})
	async getDetails(
		@DeviceId() deviceId: string,
		@Query(new ZodValidationPipe(StatsDetailsQueryParamsSchema))
		query: StatsDetailsQueryParams,
	): Promise<StatisticsDetailsResponse> {
		return this.statisticsService.getDetails(deviceId, query.startDate, query.endDate);
	}
}
