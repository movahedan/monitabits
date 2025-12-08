import { Injectable } from "@nestjs/common";
import { PrismaService } from "../common/services/prisma.service";
import { sessionStatusEnum } from "../sessions/session.model";
import {
	type LockdownNowResponse,
	type StatisticsDetailsResponse,
	type StatisticsSummary,
	type TimeTableEntry,
} from "./statistics.model";

@Injectable()
export class StatisticsService {
	constructor(private readonly prisma: PrismaService) {}

	async getLockdownNow(deviceId: string): Promise<LockdownNowResponse> {
		const now = new Date();

		const currentSession = await this.prisma.session.findFirst({
			where: { deviceId, status: sessionStatusEnum.locked },
			orderBy: { startTime: "desc" },
		});

		if (!currentSession) {
			return { isLocked: false, timeRemaining: null, sessionId: null };
		}

		const timeRemaining = currentSession.endTime
			? Math.max(0, Math.floor((currentSession.endTime.getTime() - now.getTime()) / 1000))
			: null;

		return { isLocked: true, timeRemaining, sessionId: currentSession.id };
	}

	async getSummary(deviceId: string): Promise<StatisticsSummary> {
		const now = new Date();

		const completedSessions = await this.prisma.session.findMany({
			where: { deviceId, status: sessionStatusEnum.completed },
			orderBy: { startTime: "desc" },
		});

		const totalTimeSaved = completedSessions.reduce(
			(sum, session) => sum + session.lockdownMinutes * 60,
			0,
		);

		let currentStreak = 0;
		for (const session of completedSessions) {
			if (session.endTime && session.endTime <= now) {
				currentStreak++;
			} else {
				break;
			}
		}

		let longestStreak = 0;
		let tempStreak = 0;
		for (const session of completedSessions) {
			if (session.endTime && session.endTime <= now) {
				tempStreak++;
				longestStreak = Math.max(longestStreak, tempStreak);
			} else {
				tempStreak = 0;
			}
		}

		const totalCheckIns = await this.prisma.checkIn.count({ where: { deviceId } });
		const totalActions = await this.prisma.action.count({ where: { deviceId } });

		const actions = await this.prisma.action.findMany({
			where: { deviceId },
			orderBy: { serverTime: "asc" },
		});

		let averageTimeBetweenActions = 0;
		if (actions.length > 1) {
			const timeDiffs: number[] = [];
			for (let i = 1; i < actions.length; i++) {
				const diff = actions[i].serverTime.getTime() - actions[i - 1].serverTime.getTime();
				timeDiffs.push(diff);
			}
			averageTimeBetweenActions =
				timeDiffs.reduce((sum, diff) => sum + diff, 0) / timeDiffs.length / 1000;
		}

		const lastHarmAction = await this.prisma.action.findFirst({
			where: { deviceId, type: "harm" },
			orderBy: { serverTime: "desc" },
		});

		const currentLockedSession = await this.prisma.session.findFirst({
			where: { deviceId, status: sessionStatusEnum.locked },
			orderBy: { startTime: "desc" },
		});

		const checkInsDuringLockdown = currentLockedSession
			? await this.prisma.checkIn.count({
					where: { deviceId, sessionId: currentLockedSession.id },
				})
			: 0;

		return {
			totalTimeSaved,
			currentStreak,
			longestStreak,
			totalCheckIns,
			totalActions,
			averageTimeBetweenActions: Math.floor(averageTimeBetweenActions),
			lastRelapse: lastHarmAction?.serverTime.toISOString() ?? null,
			sessionReport: { checkInsDuringLockdown, timeSpentOnPageDuringLockdown: 0 },
		};
	}

	async getDetails(
		deviceId: string,
		startDate: string,
		endDate: string,
	): Promise<StatisticsDetailsResponse> {
		const start = new Date(startDate);
		const end = new Date(endDate);
		end.setHours(23, 59, 59, 999);

		const sessions = await this.prisma.session.findMany({
			where: { deviceId, startTime: { gte: start, lte: end } },
			orderBy: { startTime: "asc" },
		});

		const sessionIds = sessions.map((s) => s.id);

		const checkIns = await this.prisma.checkIn.findMany({
			where: { deviceId, sessionId: { in: sessionIds } },
		});

		const actions = await this.prisma.action.findMany({
			where: { deviceId, sessionId: { in: sessionIds } },
		});

		type MutableEntry = {
			date: string;
			status: "active" | "locked" | "completed";
			startTime: string;
			endTime: string | null;
			lockdownMinutes: number;
			checkIns: number;
			actions: number;
			timeSpentOnPage: number;
		};

		const mutableEntriesByDate = new Map<string, MutableEntry>();

		for (const session of sessions) {
			const dateKey = session.startTime.toISOString().split("T")[0];

			if (!mutableEntriesByDate.has(dateKey)) {
				mutableEntriesByDate.set(dateKey, {
					date: dateKey,
					status: session.status as "active" | "locked" | "completed",
					startTime: session.startTime.toISOString(),
					endTime: session.endTime?.toISOString() ?? null,
					lockdownMinutes: session.lockdownMinutes,
					checkIns: 0,
					actions: 0,
					timeSpentOnPage: 0,
				});
			}

			const entry = mutableEntriesByDate.get(dateKey);
			if (entry) {
				entry.checkIns += checkIns.filter((c) => c.sessionId === session.id).length;
				entry.actions += actions.filter((a) => a.sessionId === session.id).length;
			}
		}

		const entries: TimeTableEntry[] = Array.from(mutableEntriesByDate.values());

		return { entries, startDate, endDate, totalEntries: entries.length };
	}
}
