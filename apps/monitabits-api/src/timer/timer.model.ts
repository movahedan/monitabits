import { ApiProperty } from "@nestjs/swagger";
import { z } from "zod";
import { BaseDto } from "../common/models";

export class TimerDto extends BaseDto {
	@ApiProperty({ type: String })
	readonly id!: string;

	@ApiProperty({ type: String, enum: ["idle", "running", "paused", "completed"] })
	readonly status!: "idle" | "running" | "paused" | "completed";

	@ApiProperty({ type: String, enum: ["work", "short_break", "long_break"] })
	readonly type!: "work" | "short_break" | "long_break";

	@ApiProperty({ type: Number })
	readonly durationSeconds!: number;

	@ApiProperty({ type: Number })
	readonly remainingSeconds!: number;

	@ApiProperty({ type: String, nullable: true })
	readonly startedAt!: string | null;

	@ApiProperty({ type: String, nullable: true })
	readonly pausedAt!: string | null;
}

export const TimerSchema = z.object({
	id: z.string(),
	status: z.enum(["idle", "running", "paused", "completed"]),
	type: z.enum(["work", "short_break", "long_break"]),
	durationSeconds: z.number(),
	remainingSeconds: z.number(),
	startedAt: z.string().nullable(),
	pausedAt: z.string().nullable(),
});

export class TimerResponseDto extends BaseDto {
	@ApiProperty({ type: () => TimerDto })
	readonly timer!: TimerDto;
}

export type TimerResponse = {
	readonly timer: TimerDto;
};

export class StartTimerRequestDto extends BaseDto {
	@ApiProperty({ type: String, enum: ["work", "short_break", "long_break"] })
	readonly type!: "work" | "short_break" | "long_break";
}

export const StartTimerRequestSchema = z.object({
	type: z.enum(["work", "short_break", "long_break"]),
});

export type StartTimerRequest = z.infer<typeof StartTimerRequestSchema>;
