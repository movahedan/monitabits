import { BadRequestException, Injectable } from "@nestjs/common";
import { PrismaService } from "../common/services/prisma.service";
import { type Session, sessionStatusEnum } from "../sessions/session.model";
import {
	type Action,
	type ActionResponse,
	actionTypeEnum,
	type FollowUpRequest,
	type FollowUpResponse,
	type PendingFollowUpResponse,
} from "./action.model";

@Injectable()
export class ActionsService {
	constructor(private readonly prisma: PrismaService) {
		if (!this.prisma) {
			throw new Error(
				"PrismaService not injected. Check module configuration and bundling settings.",
			);
		}
	}

	async logCheat(deviceId: string, _clientTime: Date): Promise<ActionResponse> {
		const session = await this.getCurrentSession(deviceId);

		if (session.status !== sessionStatusEnum.locked) {
			throw new BadRequestException({
				success: false,
				error: "INVALID_ACTION",
				message: "Cheat action is only allowed during lockdown period",
				statusCode: 400,
				timestamp: new Date().toISOString(),
				path: "/api/actions/cheat",
			});
		}

		const serverTime = new Date();

		const actionRecord = await this.prisma.action.create({
			data: {
				deviceId,
				sessionId: session.id,
				type: actionTypeEnum.cheat,
				serverTime,
				lockdownStarted: false,
				consequences: {
					message: "Action logged. Consequences will apply.",
					additionalLockdown: 0,
				},
			},
		});

		const action: Action = {
			id: actionRecord.id,
			type: actionRecord.type as "cheat" | "harm",
			serverTime: actionRecord.serverTime.toISOString(),
			consequences: actionRecord.consequences as
				| { message?: string; additionalLockdown?: number }
				| undefined,
			lockdownStarted: actionRecord.lockdownStarted,
		};

		return { action, session };
	}

	async logHarm(deviceId: string, clientTime: Date): Promise<ActionResponse> {
		const session = await this.getCurrentSession(deviceId);

		if (session.status !== sessionStatusEnum.active) {
			throw new BadRequestException({
				success: false,
				error: "INVALID_ACTION",
				message: "Harm action is only allowed during active period",
				statusCode: 400,
				timestamp: new Date().toISOString(),
				path: "/api/actions/harm",
			});
		}

		const newSession = await this.startLockdown(deviceId, clientTime);
		const serverTime = new Date();

		const actionRecord = await this.prisma.action.create({
			data: {
				deviceId,
				sessionId: newSession.id,
				type: actionTypeEnum.harm,
				serverTime,
				lockdownStarted: true,
			},
		});

		const action: Action = {
			id: actionRecord.id,
			type: actionRecord.type as "cheat" | "harm",
			serverTime: actionRecord.serverTime.toISOString(),
			lockdownStarted: actionRecord.lockdownStarted,
		};

		return { action, session: newSession };
	}

	async getPendingFollowUp(deviceId: string): Promise<PendingFollowUpResponse> {
		const harmAction = await this.prisma.action.findFirst({
			where: {
				deviceId,
				type: actionTypeEnum.harm,
				followUps: { none: {} },
			},
			orderBy: { serverTime: "desc" },
		});

		if (!harmAction) {
			return {
				hasPending: false,
				question: null,
				lastLockdownTimestamp: null,
				cyclesMissed: null,
			};
		}

		const session = harmAction.sessionId
			? await this.prisma.session.findUnique({ where: { id: harmAction.sessionId } })
			: null;

		return {
			hasPending: true,
			question: { id: harmAction.id, text: "What have you done?" },
			lastLockdownTimestamp: session?.startTime.toISOString() ?? null,
			cyclesMissed: null,
		};
	}

	async submitFollowUp(
		deviceId: string,
		_clientTime: Date,
		followUpDto: FollowUpRequest,
	): Promise<{ followUp: FollowUpResponse }> {
		const harmAction = await this.prisma.action.findFirst({
			where: {
				deviceId,
				type: actionTypeEnum.harm,
				followUps: { none: {} },
			},
			orderBy: { serverTime: "desc" },
		});

		if (!harmAction) {
			throw new BadRequestException({
				success: false,
				error: "NO_PENDING_FOLLOWUP",
				message: "No pending follow-up question found",
				statusCode: 400,
				timestamp: new Date().toISOString(),
				path: "/api/actions/follow-up",
			});
		}

		const followUpRecord = await this.prisma.followUp.create({
			data: {
				deviceId,
				actionId: harmAction.id,
				question: "What have you done?",
				answer: followUpDto.answer,
				harmIds: followUpDto.harmIds ?? [],
			},
		});

		const followUp: FollowUpResponse = {
			id: followUpRecord.id,
			question: followUpRecord.question,
			answer: followUpRecord.answer,
			createdAt: followUpRecord.createdAt.toISOString(),
		};

		return { followUp };
	}

	private async getCurrentSession(deviceId: string): Promise<Session> {
		const now = new Date();

		const currentSession = await this.prisma.session.findFirst({
			where: {
				deviceId,
				status: { in: [sessionStatusEnum.active, sessionStatusEnum.locked] },
			},
			orderBy: { startTime: "desc" },
		});

		if (!currentSession) {
			const settings = await this.getOrCreateSettings(deviceId);
			const startTime = now;
			const endTime = new Date(startTime.getTime() + settings.lockdownMinutes * 60 * 1000);

			const newSession = await this.prisma.session.create({
				data: {
					deviceId,
					status: sessionStatusEnum.locked,
					startTime,
					endTime,
					lockdownMinutes: settings.lockdownMinutes,
					timeRemaining: settings.lockdownMinutes * 60,
					timeAhead: null,
				},
			});

			return this.mapSessionToResponse(newSession);
		}

		const updatedSession = await this.updateSessionStatus(currentSession, now);
		return this.mapSessionToResponse(updatedSession);
	}

	private async startLockdown(deviceId: string, _clientTime: Date): Promise<Session> {
		const now = new Date();
		const settings = await this.getOrCreateSettings(deviceId);

		await this.prisma.session.updateMany({
			where: { deviceId, status: sessionStatusEnum.active },
			data: { status: sessionStatusEnum.completed },
		});

		const startTime = now;
		const endTime = new Date(startTime.getTime() + settings.lockdownMinutes * 60 * 1000);

		const newSession = await this.prisma.session.create({
			data: {
				deviceId,
				status: sessionStatusEnum.locked,
				startTime,
				endTime,
				lockdownMinutes: settings.lockdownMinutes,
				timeRemaining: settings.lockdownMinutes * 60,
				timeAhead: null,
			},
		});

		return this.mapSessionToResponse(newSession);
	}

	private async updateSessionStatus(
		session: { id: string; startTime: Date; endTime: Date | null; status: string },
		now: Date,
	): Promise<{
		id: string;
		status: string;
		startTime: Date;
		endTime: Date | null;
		lockdownMinutes: number;
		timeRemaining: number | null;
		timeAhead: number | null;
	}> {
		if (session.status === sessionStatusEnum.completed) {
			return session as {
				id: string;
				status: string;
				startTime: Date;
				endTime: Date | null;
				lockdownMinutes: number;
				timeRemaining: number | null;
				timeAhead: number | null;
			};
		}

		if (session.endTime && now >= session.endTime) {
			return await this.prisma.session.update({
				where: { id: session.id },
				data: { status: sessionStatusEnum.active, timeRemaining: null, timeAhead: 0 },
			});
		}

		if (session.status === sessionStatusEnum.locked) {
			const timeRemaining = session.endTime
				? Math.max(0, Math.floor((session.endTime.getTime() - now.getTime()) / 1000))
				: null;

			return await this.prisma.session.update({
				where: { id: session.id },
				data: { timeRemaining },
			});
		}

		if (session.status === sessionStatusEnum.active) {
			const timeAhead = session.endTime
				? Math.floor((now.getTime() - session.endTime.getTime()) / 1000)
				: null;

			return await this.prisma.session.update({
				where: { id: session.id },
				data: { timeAhead },
			});
		}

		return session as {
			id: string;
			status: string;
			startTime: Date;
			endTime: Date | null;
			lockdownMinutes: number;
			timeRemaining: number | null;
			timeAhead: number | null;
		};
	}

	private async getOrCreateSettings(deviceId: string): Promise<{ lockdownMinutes: number }> {
		const settings = await this.prisma.settings.upsert({
			where: { deviceId },
			update: {},
			create: { deviceId, lockdownMinutes: 60 },
		});

		return { lockdownMinutes: settings.lockdownMinutes };
	}

	private mapSessionToResponse(session: {
		id: string;
		status: string;
		startTime: Date;
		endTime: Date | null;
		lockdownMinutes: number;
		timeRemaining: number | null;
		timeAhead: number | null;
	}): Session {
		return {
			id: session.id,
			status: session.status as "active" | "locked" | "completed",
			startTime: session.startTime.toISOString(),
			endTime: session.endTime?.toISOString() ?? null,
			lockdownMinutes: session.lockdownMinutes,
			timeRemaining: session.timeRemaining,
			timeAhead: session.timeAhead,
		};
	}
}
