import { ApiProperty } from "@nestjs/swagger";
import { z } from "zod";
import { BaseDto } from "../common/models/dto.model";

export class SettingsDto extends BaseDto {
	@ApiProperty({ type: Number, minimum: 1, maximum: 10080 })
	readonly lockdownMinutes!: number;

	@ApiProperty({ type: String, format: "date-time" })
	readonly updatedAt!: string;
}

export type Settings = {
	readonly lockdownMinutes: number;
	readonly updatedAt: string;
};

export const SettingsSchema = z.object({
	lockdownMinutes: z.number().int().min(1).max(10080),
	updatedAt: z.string().datetime(),
});

export class UpdateSettingsRequestDto extends BaseDto {
	@ApiProperty({ type: Number, minimum: 1, maximum: 10080 })
	readonly lockdownMinutes!: number;
}

export type UpdateSettingsRequest = {
	readonly lockdownMinutes: number;
};

export const UpdateSettingsRequestSchema = z.object({
	lockdownMinutes: z.number().int().min(1).max(10080),
});
