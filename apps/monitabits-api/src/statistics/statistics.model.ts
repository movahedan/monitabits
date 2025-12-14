import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { z } from "zod";
import { BaseDto } from "../common/models/dto.model";
import { type SessionStatus } from "../sessions/session.model";

export class LockdownNowResponseDto extends BaseDto {
	@ApiProperty({ type: Boolean })
	readonly isLocked!: boolean;

	@ApiPropertyOptional({ type: Number, nullable: true })
	readonly timeRemaining?: number | null;

	@ApiPropertyOptional({ type: String, format: "uuid", nullable: true })
	readonly sessionId?: string | null;
}

export type LockdownNowResponse = {
	readonly isLocked: boolean;
	readonly timeRemaining?: number | null;
	readonly sessionId?: string | null;
};

export const LockdownNowResponseSchema = z.object({
	isLocked: z.boolean(),
	timeRemaining: z.number().int().nullable().optional(),
	sessionId: z.string().uuid().nullable().optional(),
});

export class SessionReportDto extends BaseDto {
	@ApiProperty({ type: Number, minimum: 0 })
	readonly checkInsDuringLockdown!: number;

	@ApiProperty({ type: Number, minimum: 0 })
	readonly timeSpentOnPageDuringLockdown!: number;
}

export type SessionReport = {
	readonly checkInsDuringLockdown: number;
	readonly timeSpentOnPageDuringLockdown: number;
};

export const SessionReportSchema = z.object({
	checkInsDuringLockdown: z.number().int().min(0),
	timeSpentOnPageDuringLockdown: z.number().int().min(0),
});

export class StatisticsSummaryDto extends BaseDto {
	@ApiProperty({ type: Number })
	readonly totalTimeSaved!: number;

	@ApiProperty({ type: Number })
	readonly currentStreak!: number;

	@ApiProperty({ type: Number })
	readonly longestStreak!: number;

	@ApiProperty({ type: Number })
	readonly totalCheckIns!: number;

	@ApiProperty({ type: Number })
	readonly totalActions!: number;

	@ApiPropertyOptional({ type: Number, nullable: true })
	readonly averageTimeBetweenActions?: number | null;

	@ApiPropertyOptional({ type: String, format: "date-time", nullable: true })
	readonly lastRelapse?: string | null;

	@ApiPropertyOptional({ type: () => SessionReportDto })
	readonly sessionReport?: SessionReport;
}

export type StatisticsSummary = {
	readonly totalTimeSaved: number;
	readonly currentStreak: number;
	readonly longestStreak: number;
	readonly totalCheckIns: number;
	readonly totalActions: number;
	readonly averageTimeBetweenActions?: number | null;
	readonly lastRelapse?: string | null;
	readonly sessionReport?: SessionReport;
};

export const StatisticsSummarySchema = z.object({
	totalTimeSaved: z.number().int(),
	currentStreak: z.number().int(),
	longestStreak: z.number().int(),
	totalCheckIns: z.number().int(),
	totalActions: z.number().int(),
	averageTimeBetweenActions: z.number().int().nullable().optional(),
	lastRelapse: z.string().datetime().nullable().optional(),
	sessionReport: SessionReportSchema.optional(),
});

export class TimeTableEntryDto extends BaseDto {
	@ApiProperty({ type: String, format: "date" })
	readonly date!: string;

	@ApiProperty({ enum: ["active", "locked", "completed"] })
	readonly status!: SessionStatus;

	@ApiProperty({ type: String, format: "date-time" })
	readonly startTime!: string;

	@ApiProperty({ type: String, format: "date-time", nullable: true })
	readonly endTime!: string | null;

	@ApiProperty({ type: Number })
	readonly lockdownMinutes!: number;

	@ApiProperty({ type: Number })
	readonly checkIns!: number;

	@ApiProperty({ type: Number })
	readonly actions!: number;

	@ApiProperty({ type: Number })
	readonly timeSpentOnPage!: number;
}

export type TimeTableEntry = {
	readonly date: string;
	readonly status: SessionStatus;
	readonly startTime: string;
	readonly endTime: string | null;
	readonly lockdownMinutes: number;
	readonly checkIns: number;
	readonly actions: number;
	readonly timeSpentOnPage: number;
};

export const TimeTableEntrySchema = z.object({
	date: z.string().date(),
	status: z.enum(["active", "locked", "completed"]),
	startTime: z.string().datetime(),
	endTime: z.string().datetime().nullable(),
	lockdownMinutes: z.number().int(),
	checkIns: z.number().int(),
	actions: z.number().int(),
	timeSpentOnPage: z.number().int(),
});

export class StatisticsDetailsResponseDto extends BaseDto {
	@ApiProperty({ type: [TimeTableEntryDto] })
	readonly entries!: TimeTableEntry[];

	@ApiProperty({ type: String, format: "date" })
	readonly startDate!: string;

	@ApiProperty({ type: String, format: "date" })
	readonly endDate!: string;

	@ApiProperty({ type: Number })
	readonly totalEntries!: number;
}

export type StatisticsDetailsResponse = {
	readonly entries: TimeTableEntry[];
	readonly startDate: string;
	readonly endDate: string;
	readonly totalEntries: number;
};

export const StatisticsDetailsResponseSchema = z.object({
	entries: z.array(TimeTableEntrySchema),
	startDate: z.string().date(),
	endDate: z.string().date(),
	totalEntries: z.number().int(),
});

export class StatsDetailsQueryParamsDto extends BaseDto {
	@ApiProperty({ type: String, format: "date" })
	readonly startDate!: string;

	@ApiProperty({ type: String, format: "date" })
	readonly endDate!: string;
}

export type StatsDetailsQueryParams = {
	readonly startDate: string;
	readonly endDate: string;
};

export const StatsDetailsQueryParamsSchema = z.object({
	startDate: z.string().date(),
	endDate: z.string().date(),
});
