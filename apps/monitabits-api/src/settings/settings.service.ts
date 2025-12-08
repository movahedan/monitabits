import { Injectable } from "@nestjs/common";
import { PrismaService } from "../common/services/prisma.service";
import type { Settings } from "./settings.model";

@Injectable()
export class SettingsService {
	constructor(private readonly prisma: PrismaService) {}

	async getSettings(deviceId: string): Promise<Settings> {
		const settings = await this.prisma.settings.upsert({
			where: { deviceId },
			update: {},
			create: { deviceId, lockdownMinutes: 60 },
		});

		return {
			lockdownMinutes: settings.lockdownMinutes,
			updatedAt: settings.updatedAt.toISOString(),
		};
	}

	async updateSettings(deviceId: string, lockdownMinutes: number): Promise<Settings> {
		const settings = await this.prisma.settings.upsert({
			where: { deviceId },
			update: { lockdownMinutes },
			create: { deviceId, lockdownMinutes },
		});

		return {
			lockdownMinutes: settings.lockdownMinutes,
			updatedAt: settings.updatedAt.toISOString(),
		};
	}
}
