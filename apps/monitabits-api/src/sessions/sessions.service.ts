import { Injectable } from "@nestjs/common";
import { PrismaService } from "../common/services/prisma.service";
import {
	type CheckIn,
	type CheckInResponse,
	type CurrentSessionResponse,
	type Session,
	sessionStatusEnum,
	type UserStats,
} from "./session.model";

@Injectable()
export class SessionsService {
	constructor(private readonly prisma: PrismaService) {}

	async getCurrentSession(deviceId: string): Promise<CurrentSessionResponse> {
		const now = new Date();

		// Ensure device exists
		await this.prisma.device.upsert({
			where: { id: deviceId },
			update: {},
			create: { id: deviceId },
		});

		// Get current active or locked session
		const currentSession = await this.prisma.session.findFirst({
			where: {
				deviceId,
				status: { in: [sessionStatusEnum.active, sessionStatusEnum.locked] },
			},
			orderBy: { startTime: "desc" },
		});

		let session: Session | null = null;
		if (currentSession) {
			const updatedSession = await this.updateSessionStatus(currentSession, now);
			session = this.mapSessionToResponse(updatedSession);
		}

		// Get user stats
		const user = await this.getUserStats(deviceId);

		return { session, user };
	}

	private async getUserStats(deviceId: string): Promise<UserStats> {
		const now = new Date();

		// Get completed sessions for stats
		const completedSessions = await this.prisma.session.findMany({
			where: { deviceId, status: sessionStatusEnum.completed },
			orderBy: { startTime: "desc" },
		});

		// Calculate total time saved
		const totalTimeSaved = completedSessions.reduce(
			(sum, session) => sum + session.lockdownMinutes * 60,
			0,
		);

		// Calculate current streak
		let currentStreak = 0;
		for (const session of completedSessions) {
			if (session.endTime && session.endTime <= now) {
				currentStreak++;
			} else {
				break;
			}
		}

		// Get last relapse (last harm action)
		const lastHarmAction = await this.prisma.action.findFirst({
			where: { deviceId, type: "harm" },
			orderBy: { serverTime: "desc" },
		});

		return {
			id: deviceId,
			totalTimeSaved,
			currentStreak,
			lastRelapse: lastHarmAction?.serverTime.toISOString() ?? null,
		};
	}

	async createCheckIn(
		deviceId: string,
		clientTime: Date,
		type: "check_in" | "check_out",
	): Promise<CheckInResponse> {
		const session = await this.getOrCreateSession(deviceId, clientTime);
		const serverTime = new Date();

		const checkInRecord = await this.prisma.checkIn.create({
			data: { deviceId, sessionId: session.id, type, serverTime },
		});

		const checkIn: CheckIn = {
			id: checkInRecord.id,
			type: checkInRecord.type as "check_in" | "check_out",
			serverTime: checkInRecord.serverTime.toISOString(),
			createdAt: checkInRecord.createdAt.toISOString(),
		};

		return { checkIn, session };
	}

	private async getOrCreateSession(deviceId: string, _clientTime: Date): Promise<Session> {
		const now = new Date();
		const settings = await this.getOrCreateSettings(deviceId);
		const lockdownMinutes = settings.lockdownMinutes;

		const currentSession = await this.prisma.session.findFirst({
			where: {
				deviceId,
				status: { in: [sessionStatusEnum.active, sessionStatusEnum.locked] },
			},
			orderBy: { startTime: "desc" },
		});

		if (currentSession) {
			const updatedSession = await this.updateSessionStatus(currentSession, now);
			return this.mapSessionToResponse(updatedSession);
		}

		const startTime = now;
		const endTime = new Date(startTime.getTime() + lockdownMinutes * 60 * 1000);

		const newSession = await this.prisma.session.create({
			data: {
				deviceId,
				status: sessionStatusEnum.locked,
				startTime,
				endTime,
				lockdownMinutes,
				timeRemaining: lockdownMinutes * 60,
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
				data: { status: sessionStatusEnum.completed, timeRemaining: null, timeAhead: null },
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
