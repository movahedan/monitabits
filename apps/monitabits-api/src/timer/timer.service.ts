import { Inject, Injectable } from "@nestjs/common";
import { PrismaService } from "../common/services/prisma.service";
import type { StartTimerRequest, TimerResponse } from "./timer.model";

@Injectable()
export class TimerService {
	constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {
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

	async getTimer(deviceId: string): Promise<TimerResponse> {
		await this.ensureDevice(deviceId);
		let timer = await this.prisma.timer.findUnique({
			where: { deviceId },
		});

		// If timer doesn't exist, create idle timer
		if (!timer) {
			timer = await this.prisma.timer.create({
				data: {
					deviceId,
					status: "idle",
					type: "work",
					durationSeconds: 25 * 60, // 25 minutes default
					remainingSeconds: 25 * 60,
				},
			});
		}

		// Calculate remaining time on the fly for running timers
		// Don't update remainingSeconds in DB during getTimer - only update on pause
		let calculatedRemaining: number | undefined;
		if (timer.status === "running" && timer.startedAt) {
			const elapsed = Math.floor((Date.now() - new Date(timer.startedAt).getTime()) / 1000);
			// Use remainingSeconds as the initial value when startedAt was set, not the updated value
			// remainingSeconds in DB represents the time remaining when the timer started/resumed
			// We calculate on the fly and don't update the DB (only update on pause)
			calculatedRemaining = Math.max(0, timer.remainingSeconds - elapsed);

			if (calculatedRemaining === 0) {
				// Timer completed
				await this.completeTimer(deviceId);
				const completedTimer = await this.prisma.timer.findUnique({
					where: { deviceId },
				});
				if (!completedTimer) {
					throw new Error("Timer not found after completion");
				}
				timer = completedTimer;
				calculatedRemaining = undefined; // Reset since timer is now completed
			}
		}

		return {
			timer: {
				id: timer.id,
				status: timer.status as "idle" | "running" | "paused" | "completed",
				type: timer.type as "work" | "short_break" | "long_break",
				durationSeconds: timer.durationSeconds,
				remainingSeconds:
					calculatedRemaining !== undefined ? calculatedRemaining : timer.remainingSeconds,
				startedAt: timer.startedAt?.toISOString() ?? null,
				pausedAt: timer.pausedAt?.toISOString() ?? null,
			},
		};
	}

	async startTimer(deviceId: string, request: StartTimerRequest): Promise<TimerResponse> {
		await this.ensureDevice(deviceId);

		// Get settings for duration
		const settings = await this.prisma.settings.findUnique({
			where: { deviceId },
		});

		let durationSeconds = 25 * 60; // Default 25 minutes
		if (request.type === "work") {
			durationSeconds = (settings?.workMinutes ?? 25) * 60;
		} else if (request.type === "short_break") {
			durationSeconds = (settings?.shortBreakMinutes ?? 5) * 60;
		} else if (request.type === "long_break") {
			durationSeconds = (settings?.longBreakMinutes ?? 15) * 60;
		}

		const startedAt = new Date();
		const timer = await this.prisma.timer.upsert({
			where: { deviceId },
			update: {
				status: "running",
				type: request.type,
				durationSeconds,
				remainingSeconds: durationSeconds,
				startedAt,
				pausedAt: null,
			},
			create: {
				deviceId,
				status: "running",
				type: request.type,
				durationSeconds,
				remainingSeconds: durationSeconds,
				startedAt,
				pausedAt: null,
			},
		});

		return {
			timer: {
				id: timer.id,
				status: timer.status as "idle" | "running" | "paused" | "completed",
				type: timer.type as "work" | "short_break" | "long_break",
				durationSeconds: timer.durationSeconds,
				remainingSeconds: timer.remainingSeconds,
				startedAt: timer.startedAt?.toISOString() ?? null,
				pausedAt: timer.pausedAt?.toISOString() ?? null,
			},
		};
	}

	async pauseTimer(deviceId: string): Promise<TimerResponse> {
		await this.ensureDevice(deviceId);

		const timer = await this.prisma.timer.findUnique({
			where: { deviceId },
		});

		if (!timer || timer.status !== "running") {
			throw new Error("Timer is not running");
		}

		// Calculate remaining time
		const elapsed = timer.startedAt
			? Math.floor((Date.now() - new Date(timer.startedAt).getTime()) / 1000)
			: 0;
		const remaining = Math.max(0, timer.remainingSeconds - elapsed);

		const updated = await this.prisma.timer.update({
			where: { deviceId },
			data: {
				status: "paused",
				remainingSeconds: remaining,
				pausedAt: new Date(),
			},
		});

		return {
			timer: {
				id: updated.id,
				status: updated.status as "idle" | "running" | "paused" | "completed",
				type: updated.type as "work" | "short_break" | "long_break",
				durationSeconds: updated.durationSeconds,
				remainingSeconds: updated.remainingSeconds,
				startedAt: updated.startedAt?.toISOString() ?? null,
				pausedAt: updated.pausedAt?.toISOString() ?? null,
			},
		};
	}

	async resumeTimer(deviceId: string): Promise<TimerResponse> {
		await this.ensureDevice(deviceId);

		const timer = await this.prisma.timer.findUnique({
			where: { deviceId },
		});

		if (!timer || timer.status !== "paused") {
			throw new Error("Timer is not paused");
		}

		const updated = await this.prisma.timer.update({
			where: { deviceId },
			data: {
				status: "running",
				startedAt: new Date(),
				pausedAt: null,
			},
		});

		return {
			timer: {
				id: updated.id,
				status: updated.status as "idle" | "running" | "paused" | "completed",
				type: updated.type as "work" | "short_break" | "long_break",
				durationSeconds: updated.durationSeconds,
				remainingSeconds: updated.remainingSeconds,
				startedAt: updated.startedAt?.toISOString() ?? null,
				pausedAt: updated.pausedAt?.toISOString() ?? null,
			},
		};
	}

	async resetTimer(deviceId: string): Promise<TimerResponse> {
		await this.ensureDevice(deviceId);

		const timer = await this.prisma.timer.findUnique({
			where: { deviceId },
		});

		if (!timer) {
			return this.getTimer(deviceId);
		}

		const updated = await this.prisma.timer.update({
			where: { deviceId },
			data: {
				status: "idle",
				remainingSeconds: timer.durationSeconds,
				startedAt: null,
				pausedAt: null,
			},
		});

		return {
			timer: {
				id: updated.id,
				status: updated.status as "idle" | "running" | "paused" | "completed",
				type: updated.type as "work" | "short_break" | "long_break",
				durationSeconds: updated.durationSeconds,
				remainingSeconds: updated.remainingSeconds,
				startedAt: updated.startedAt?.toISOString() ?? null,
				pausedAt: updated.pausedAt?.toISOString() ?? null,
			},
		};
	}

	private async completeTimer(deviceId: string): Promise<void> {
		const timer = await this.prisma.timer.findUnique({
			where: { deviceId },
		});

		if (!timer) return;

		// Record completed session
		await this.prisma.pomodoroSession.create({
			data: {
				deviceId,
				type: timer.type,
				durationSeconds: timer.durationSeconds,
			},
		});

		// Reset timer to idle
		await this.prisma.timer.update({
			where: { deviceId },
			data: {
				status: "completed",
				remainingSeconds: 0,
			},
		});
	}
}
