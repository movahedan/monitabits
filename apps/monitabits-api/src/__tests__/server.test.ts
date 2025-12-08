import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import type { INestApplication } from "@nestjs/common";
import { Test, type TestingModule } from "@nestjs/testing";
import { AppController } from "../app.controller";

describe("Server", () => {
	let app: INestApplication;
	let appController: AppController;

	beforeAll(async () => {
		const moduleFixture: TestingModule = await Test.createTestingModule({
			controllers: [AppController],
		}).compile();

		app = moduleFixture.createNestApplication();
		appController = moduleFixture.get<AppController>(AppController);
		await app.init();
	});

	afterAll(async () => {
		await app.close();
	});

	it("health check returns success response", async () => {
		const result = await appController.getStatus();

		expect(result).toEqual({ success: true, data: { ok: true } });
	});
});
