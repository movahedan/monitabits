import { Injectable } from "@nestjs/common";
import { PrismaService } from "../common/services/prisma.service";
import type { StatisticsSummary } from "./statistics.model";

@Injectable()
export class StatisticsService {
	constructor(private readonly prisma: PrismaService) {
		if (!this.prisma) {
			throw new Error("PrismaService not injected");
		}
	}

	/**
	 * Ensure device exists, creating it if necessary
	 */
	private async ensureDevice(deviceId: string): Promise<void> {
		await this.prisma.device.upsert({
			where: { id: deviceId },
			update: {},
			create: { id: deviceId },
		});
	}

	async getSummary(deviceId: string): Promise<StatisticsSummary> {
		await this.ensureDevice(deviceId);
		// Get all completed pomodoro sessions
		const sessions = await this.prisma.pomodoroSession.findMany({
			where: { deviceId },
			orderBy: { completedAt: "desc" },
		});

		// Count by type
		const workSessions = sessions.filter((s) => s.type === "work");
		const shortBreakSessions = sessions.filter((s) => s.type === "short_break");
		const longBreakSessions = sessions.filter((s) => s.type === "long_break");

		// Calculate total time (only work sessions count)
		const totalTimeSeconds = workSessions.reduce(
			(sum, session) => sum + session.durationSeconds,
			0,
		);

		// Today's count
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		const todaySessions = sessions.filter((s) => new Date(s.completedAt) >= today);

		return {
			totalCompleted: sessions.length,
			totalWorkSessions: workSessions.length,
			totalShortBreaks: shortBreakSessions.length,
			totalLongBreaks: longBreakSessions.length,
			totalTimeSeconds,
			todayCount: todaySessions.length,
		};
	}
}
