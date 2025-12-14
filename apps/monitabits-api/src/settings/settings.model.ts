import { ApiProperty } from "@nestjs/swagger";
import { z } from "zod";
import { BaseDto } from "../common/models/dto.model";

export class SettingsDto extends BaseDto {
	@ApiProperty({ type: Number, minimum: 1, maximum: 120 })
	readonly workMinutes!: number;

	@ApiProperty({ type: Number, minimum: 1, maximum: 60 })
	readonly shortBreakMinutes!: number;

	@ApiProperty({ type: Number, minimum: 1, maximum: 120 })
	readonly longBreakMinutes!: number;

	@ApiProperty({ type: String, format: "date-time" })
	readonly updatedAt!: string;
}

export type Settings = {
	readonly workMinutes: number;
	readonly shortBreakMinutes: number;
	readonly longBreakMinutes: number;
	readonly updatedAt: string;
};

export const SettingsSchema = z.object({
	workMinutes: z.number().int().min(1).max(120),
	shortBreakMinutes: z.number().int().min(1).max(60),
	longBreakMinutes: z.number().int().min(1).max(120),
	updatedAt: z.string().datetime(),
});

export class UpdateSettingsRequestDto extends BaseDto {
	@ApiProperty({ type: Number, minimum: 1, maximum: 120 })
	readonly workMinutes!: number;

	@ApiProperty({ type: Number, minimum: 1, maximum: 60 })
	readonly shortBreakMinutes!: number;

	@ApiProperty({ type: Number, minimum: 1, maximum: 120 })
	readonly longBreakMinutes!: number;
}

export type UpdateSettingsRequest = {
	readonly workMinutes: number;
	readonly shortBreakMinutes: number;
	readonly longBreakMinutes: number;
};

export const UpdateSettingsRequestSchema = z.object({
	workMinutes: z.number().int().min(1).max(120),
	shortBreakMinutes: z.number().int().min(1).max(60),
	longBreakMinutes: z.number().int().min(1).max(120),
});
