import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { z } from "zod";

export const sessionStatusEnum = {
	active: "active",
	locked: "locked",
	completed: "completed",
} as const;

export type SessionStatus = (typeof sessionStatusEnum)[keyof typeof sessionStatusEnum];

export class SessionDto {
	@ApiProperty({ type: String, format: "uuid" })
	readonly id!: string;

	@ApiProperty({ enum: ["active", "locked", "completed"] })
	readonly status!: SessionStatus;

	@ApiProperty({ type: String, format: "date-time" })
	readonly startTime!: string;

	@ApiProperty({ type: String, format: "date-time", nullable: true })
	readonly endTime!: string | null;

	@ApiProperty({ type: Number, minimum: 1, maximum: 10080 })
	readonly lockdownMinutes!: number;

	@ApiPropertyOptional({ type: Number, nullable: true })
	readonly timeRemaining?: number | null;

	@ApiPropertyOptional({ type: Number, nullable: true })
	readonly timeAhead?: number | null;
}

export type Session = {
	readonly id: string;
	readonly status: SessionStatus;
	readonly startTime: string;
	readonly endTime: string | null;
	readonly lockdownMinutes: number;
	readonly timeRemaining?: number | null;
	readonly timeAhead?: number | null;
};

export const SessionStatusSchema = z.enum(["active", "locked", "completed"]);
export const SessionSchema = z.object({
	id: z.string().uuid(),
	status: SessionStatusSchema,
	startTime: z.string().datetime(),
	endTime: z.string().datetime().nullable(),
	lockdownMinutes: z.number().int().min(1).max(10080),
	timeRemaining: z.number().int().nullable().optional(),
	timeAhead: z.number().int().nullable().optional(),
});

export const checkInTypeEnum = {
	check_in: "check_in",
	check_out: "check_out",
} as const;

export type CheckInType = (typeof checkInTypeEnum)[keyof typeof checkInTypeEnum];

export class CheckInDto {
	@ApiProperty({ type: String, format: "uuid" })
	readonly id!: string;

	@ApiProperty({ enum: ["check_in", "check_out"] })
	readonly type!: CheckInType;

	@ApiProperty({ type: String, format: "date-time" })
	readonly serverTime!: string;

	@ApiProperty({ type: String, format: "date-time" })
	readonly createdAt!: string;
}

export type CheckIn = {
	readonly id: string;
	readonly type: CheckInType;
	readonly serverTime: string;
	readonly createdAt: string;
};

export const CheckInTypeSchema = z.enum(["check_in", "check_out"]);
export const CheckInSchema = z.object({
	id: z.string().uuid(),
	type: CheckInTypeSchema,
	serverTime: z.string().datetime(),
	createdAt: z.string().datetime(),
});

export class CheckInResponseDto {
	@ApiProperty({ type: () => CheckInDto })
	readonly checkIn!: CheckIn;

	@ApiProperty({ type: () => SessionDto })
	readonly session!: Session;
}

export type CheckInResponse = {
	readonly checkIn: CheckIn;
	readonly session: Session;
};

export const CheckInResponseSchema = z.object({
	checkIn: CheckInSchema,
	session: SessionSchema,
});

// User stats for current session response
export class UserStatsDto {
	@ApiProperty({ type: String, format: "uuid" })
	readonly id!: string;

	@ApiProperty({ type: Number, description: "Total time saved in seconds" })
	readonly totalTimeSaved!: number;

	@ApiProperty({ type: Number, description: "Current consecutive lockdown periods completed" })
	readonly currentStreak!: number;

	@ApiProperty({ type: String, format: "date-time", nullable: true })
	readonly lastRelapse!: string | null;
}

export type UserStats = {
	readonly id: string;
	readonly totalTimeSaved: number;
	readonly currentStreak: number;
	readonly lastRelapse: string | null;
};

export const UserStatsSchema = z.object({
	id: z.string().uuid(),
	totalTimeSaved: z.number().int().min(0),
	currentStreak: z.number().int().min(0),
	lastRelapse: z.string().datetime().nullable(),
});

// Current session response
export class CurrentSessionResponseDto {
	@ApiProperty({ type: () => SessionDto, nullable: true })
	readonly session!: Session | null;

	@ApiProperty({ type: () => UserStatsDto })
	readonly user!: UserStats;
}

export type CurrentSessionResponse = {
	readonly session: Session | null;
	readonly user: UserStats;
};

export const CurrentSessionResponseSchema = z.object({
	session: SessionSchema.nullable(),
	user: UserStatsSchema,
});
