import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import type { INestApplication } from "@nestjs/common";
import { Test, type TestingModule } from "@nestjs/testing";
import supertest from "supertest";
import { AppController } from "../app.controller";

describe("Server", () => {
	let app: INestApplication;

	beforeAll(async () => {
		const moduleFixture: TestingModule = await Test.createTestingModule({
			controllers: [AppController],
		}).compile();

		app = moduleFixture.createNestApplication();
		await app.init();
	});

	afterAll(async () => {
		await app.close();
	});

	it("health check returns 200", async () => {
		await supertest(app.getHttpServer())
			.get("/status")
			.expect(200)
			.then((res) => {
				expect(res.ok).toBe(true);
				expect(res.body).toEqual({ ok: true });
			});
	});

	it("message endpoint says hello", async () => {
		await supertest(app.getHttpServer())
			.get("/message/jared")
			.expect(200)
			.then((res) => {
				expect(res.body).toEqual({ message: "hello jared" });
			});
	});
});
