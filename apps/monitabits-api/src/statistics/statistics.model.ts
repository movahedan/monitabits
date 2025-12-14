import { ApiProperty } from "@nestjs/swagger";
import { z } from "zod";
import { BaseDto } from "../common/models/dto.model";

export class StatisticsSummaryDto extends BaseDto {
	@ApiProperty({ type: Number })
	readonly totalCompleted!: number;

	@ApiProperty({ type: Number })
	readonly totalWorkSessions!: number;

	@ApiProperty({ type: Number })
	readonly totalShortBreaks!: number;

	@ApiProperty({ type: Number })
	readonly totalLongBreaks!: number;

	@ApiProperty({ type: Number })
	readonly totalTimeSeconds!: number;

	@ApiProperty({ type: Number })
	readonly todayCount!: number;
}

export type StatisticsSummary = {
	readonly totalCompleted: number;
	readonly totalWorkSessions: number;
	readonly totalShortBreaks: number;
	readonly totalLongBreaks: number;
	readonly totalTimeSeconds: number;
	readonly todayCount: number;
};

export const StatisticsSummarySchema = z.object({
	totalCompleted: z.number().int(),
	totalWorkSessions: z.number().int(),
	totalShortBreaks: z.number().int(),
	totalLongBreaks: z.number().int(),
	totalTimeSeconds: z.number().int(),
	todayCount: z.number().int(),
});
