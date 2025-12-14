import { Controller, Get, UseGuards } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiSecurity, ApiTags } from "@nestjs/swagger";
import { DeviceId } from "../common/decorators/device-id.decorator";
import { DeviceAuthGuard } from "../common/guards/device-auth.guard";
import { ErrorResponseDto } from "../common/models";
import type { StatisticsSummary } from "./statistics.model";
import { StatisticsSummaryDto } from "./statistics.model";
import { StatisticsService } from "./statistics.service";

@ApiTags("Statistics")
@Controller("stats")
@UseGuards(DeviceAuthGuard)
@ApiSecurity("DeviceAuth")
export class StatisticsController {
	constructor(private readonly statisticsService: StatisticsService) {
		if (!this.statisticsService) {
			throw new Error("StatisticsService not injected");
		}
	}

	@Get("summary")
	@ApiOperation({
		summary: "Get Pomodoro statistics summary",
		description:
			"Returns statistics about completed Pomodoro sessions including counts and total time.",
	})
	@ApiResponse({
		status: 200,
		description: "Statistics summary retrieved successfully",
		type: StatisticsSummaryDto,
	})
	@ApiResponse({
		status: 400,
		description: "Invalid request",
		type: ErrorResponseDto,
	})
	async getSummary(@DeviceId() deviceId: string): Promise<StatisticsSummary> {
		return this.statisticsService.getSummary(deviceId);
	}
}
