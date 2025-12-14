import { Injectable } from "@nestjs/common";
import { PrismaService } from "../common/services/prisma.service";
import type { Settings } from "./settings.model";

@Injectable()
export class SettingsService {
	constructor(private readonly prisma: PrismaService) {
		if (!this.prisma) {
			throw new Error(
				"PrismaService not injected. Check module configuration and bundling settings.",
			);
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

	async getSettings(deviceId: string): Promise<Settings> {
		await this.ensureDevice(deviceId);

		const settings = await this.prisma.settings.upsert({
			where: { deviceId },
			update: {},
			create: {
				deviceId,
				workMinutes: 25,
				shortBreakMinutes: 5,
				longBreakMinutes: 15,
			},
		});

		return {
			workMinutes: settings.workMinutes,
			shortBreakMinutes: settings.shortBreakMinutes,
			longBreakMinutes: settings.longBreakMinutes,
			updatedAt: settings.updatedAt.toISOString(),
		};
	}

	async updateSettings(
		deviceId: string,
		workMinutes: number,
		shortBreakMinutes: number,
		longBreakMinutes: number,
	): Promise<Settings> {
		await this.ensureDevice(deviceId);

		const settings = await this.prisma.settings.upsert({
			where: { deviceId },
			update: { workMinutes, shortBreakMinutes, longBreakMinutes },
			create: {
				deviceId,
				workMinutes,
				shortBreakMinutes,
				longBreakMinutes,
			},
		});

		return {
			workMinutes: settings.workMinutes,
			shortBreakMinutes: settings.shortBreakMinutes,
			longBreakMinutes: settings.longBreakMinutes,
			updatedAt: settings.updatedAt.toISOString(),
		};
	}
}
