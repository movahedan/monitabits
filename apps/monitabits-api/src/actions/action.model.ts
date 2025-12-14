import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { z } from "zod";
import { BaseDto } from "../common/models/dto.model";
import { type Session, SessionDto, SessionSchema } from "../sessions/session.model";

export const actionTypeEnum = {
	cheat: "cheat",
	harm: "harm",
} as const;

export type ActionType = (typeof actionTypeEnum)[keyof typeof actionTypeEnum];

export class ActionConsequencesDto extends BaseDto {
	@ApiPropertyOptional({ type: String })
	readonly message?: string;

	@ApiPropertyOptional({ type: Number })
	readonly additionalLockdown?: number;
}

export type ActionConsequences = {
	readonly message?: string;
	readonly additionalLockdown?: number;
};

export const ActionConsequencesSchema = z.object({
	message: z.string().optional(),
	additionalLockdown: z.number().int().optional(),
});

export class ActionDto extends BaseDto {
	@ApiProperty({ type: String, format: "uuid" })
	readonly id!: string;

	@ApiProperty({ enum: ["cheat", "harm"] })
	readonly type!: ActionType;

	@ApiProperty({ type: String, format: "date-time" })
	readonly serverTime!: string;

	@ApiPropertyOptional({ type: () => ActionConsequencesDto })
	readonly consequences?: ActionConsequences;

	@ApiPropertyOptional({ type: Boolean })
	readonly lockdownStarted?: boolean;
}

export type Action = {
	readonly id: string;
	readonly type: ActionType;
	readonly serverTime: string;
	readonly consequences?: ActionConsequences;
	readonly lockdownStarted?: boolean;
};

export const ActionTypeSchema = z.enum(["cheat", "harm"]);
export const ActionSchema = z.object({
	id: z.string().uuid(),
	type: ActionTypeSchema,
	serverTime: z.string().datetime(),
	consequences: ActionConsequencesSchema.optional(),
	lockdownStarted: z.boolean().optional(),
});

export class ActionResponseDto extends BaseDto {
	@ApiProperty({ type: () => ActionDto })
	readonly action!: Action;

	@ApiProperty({ type: () => SessionDto })
	readonly session!: Session;
}

export type ActionResponse = {
	readonly action: Action;
	readonly session: Session;
};

export const ActionResponseSchema = z.object({
	action: ActionSchema,
	session: SessionSchema,
});

export class PendingFollowUpQuestionDto extends BaseDto {
	@ApiProperty({ type: String, format: "uuid" })
	readonly id!: string;

	@ApiProperty({ type: String })
	readonly text!: string;
}

export type PendingFollowUpQuestion = {
	readonly id: string;
	readonly text: string;
};

export const PendingFollowUpQuestionSchema = z.object({
	id: z.string().uuid(),
	text: z.string(),
});

export class PendingFollowUpResponseDto extends BaseDto {
	@ApiProperty({ type: Boolean })
	readonly hasPending!: boolean;

	@ApiPropertyOptional({ type: () => PendingFollowUpQuestionDto, nullable: true })
	readonly question?: PendingFollowUpQuestion | null;

	@ApiPropertyOptional({ type: String, format: "date-time", nullable: true })
	readonly lastLockdownTimestamp?: string | null;

	@ApiPropertyOptional({ type: Number, minimum: 0, nullable: true })
	readonly cyclesMissed?: number | null;
}

export type PendingFollowUpResponse = {
	readonly hasPending: boolean;
	readonly question?: PendingFollowUpQuestion | null;
	readonly lastLockdownTimestamp?: string | null;
	readonly cyclesMissed?: number | null;
};

export const PendingFollowUpResponseSchema = z.object({
	hasPending: z.boolean(),
	question: PendingFollowUpQuestionSchema.nullable().optional(),
	lastLockdownTimestamp: z.string().datetime().nullable().optional(),
	cyclesMissed: z.number().int().min(0).nullable().optional(),
});

export class FollowUpRequestDto extends BaseDto {
	@ApiProperty({ type: String, minLength: 1 })
	readonly answer!: string;

	@ApiPropertyOptional({ type: [String] })
	readonly harmIds?: string[];
}

export type FollowUpRequest = {
	readonly answer: string;
	readonly harmIds?: string[];
};

export const FollowUpRequestSchema = z.object({
	answer: z.string().min(1),
	harmIds: z.array(z.string().uuid()).optional(),
});

export class FollowUpResponseDto extends BaseDto {
	@ApiProperty({ type: String, format: "uuid" })
	readonly id!: string;

	@ApiProperty({ type: String })
	readonly question!: string;

	@ApiProperty({ type: String })
	readonly answer!: string;

	@ApiProperty({ type: String, format: "date-time" })
	readonly createdAt!: string;
}

export type FollowUpResponse = {
	readonly id: string;
	readonly question: string;
	readonly answer: string;
	readonly createdAt: string;
};

export const FollowUpResponseSchema = z.object({
	id: z.string().uuid(),
	question: z.string(),
	answer: z.string(),
	createdAt: z.string().datetime(),
});
