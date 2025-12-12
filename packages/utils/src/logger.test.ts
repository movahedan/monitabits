import { describe, expect, it, spyOn } from "bun:test";
import { createLogger } from "./logger";

function withEnv<TValue>(env: Record<string, string | undefined>, run: () => TValue): TValue {
	const previous: Record<string, string | undefined> = {};
	for (const [key, value] of Object.entries(env)) {
		previous[key] = process.env[key];
		if (value === undefined) delete process.env[key];
		else process.env[key] = value;
	}

	try {
		return run();
	} finally {
		for (const [key, value] of Object.entries(previous)) {
			if (value === undefined) delete process.env[key];
			else process.env[key] = value;
		}
	}
}

function withEnvProperty<TValue>(key: string, value: unknown, run: () => TValue): TValue {
	const desc = Object.getOwnPropertyDescriptor(process.env, key);
	Object.defineProperty(process.env, key, {
		value,
		configurable: true,
		enumerable: true,
		writable: true,
	});

	try {
		return run();
	} finally {
		if (desc) Object.defineProperty(process.env, key, desc);
		else delete (process.env as Record<string, unknown>)[key];
	}
}

function firstConsoleArg(spy: ReturnType<typeof spyOn>): string {
	const firstCall = spy.mock.calls[0] ?? [];
	return String(firstCall[0] ?? "");
}

function parseJsonPayload(spy: ReturnType<typeof spyOn>): Record<string, unknown> {
	const firstCall = spy.mock.calls[0] ?? [];
	return JSON.parse(String(firstCall[0] ?? "")) as Record<string, unknown>;
}

describe("@repo/utils/logger - createLogger", () => {
	describe("pretty format", () => {
		it("prints message when info is called", () => {
			const infoSpy = spyOn(console, "info").mockImplementation(() => {});

			try {
				const logger = createLogger({ level: "info", format: "pretty", colors: false });

				logger.info("hello");

				expect(infoSpy).toHaveBeenCalled();
				expect(firstConsoleArg(infoSpy)).toContain("INFO");
				expect(firstConsoleArg(infoSpy)).toContain("hello");
			} finally {
				infoSpy.mockRestore();
			}
		});

		it("preserves objects when passed as args", () => {
			const infoSpy = spyOn(console, "info").mockImplementation(() => {});
			const obj = { a: 1 };

			try {
				const logger = createLogger({ level: "info", format: "pretty", colors: false });

				logger.info("hello", obj);

				expect(infoSpy).toHaveBeenCalled();
				const firstCall = infoSpy.mock.calls[0] ?? [];
				expect(String(firstCall[0] ?? "")).toContain("hello");
				expect(firstCall[1]).toEqual(obj);
			} finally {
				infoSpy.mockRestore();
			}
		});

		it("routes each level to the expected console method", () => {
			const spies = {
				info: spyOn(console, "info").mockImplementation(() => {}),
				warn: spyOn(console, "warn").mockImplementation(() => {}),
				error: spyOn(console, "error").mockImplementation(() => {}),
				log: spyOn(console, "log").mockImplementation(() => {}),
			};

			const cases = [
				{
					level: "info",
					call: (l: ReturnType<typeof createLogger>) => l.info("i"),
					expectSpy: "info",
				},
				{
					level: "warn",
					call: (l: ReturnType<typeof createLogger>) => l.warn("w"),
					expectSpy: "warn",
				},
				{
					level: "error",
					call: (l: ReturnType<typeof createLogger>) => l.error("e"),
					expectSpy: "error",
				},
				{
					level: "fatal",
					call: (l: ReturnType<typeof createLogger>) => l.fatal("f"),
					expectSpy: "error",
				},
				{
					level: "debug",
					call: (l: ReturnType<typeof createLogger>) => l.debug("d"),
					expectSpy: "log",
				},
				{
					level: "trace",
					call: (l: ReturnType<typeof createLogger>) => l.trace("t"),
					expectSpy: "log",
				},
			] as const;

			try {
				const logger = createLogger({ level: "trace", format: "pretty", colors: false });

				cases.forEach((tc) => {
					tc.call(logger);
					expect(spies[tc.expectSpy]).toHaveBeenCalled();
				});
			} finally {
				spies.info.mockRestore();
				spies.warn.mockRestore();
				spies.error.mockRestore();
				spies.log.mockRestore();
			}
		});

		it("includes service in prefix when service is provided", () => {
			const infoSpy = spyOn(console, "info").mockImplementation(() => {});

			try {
				const logger = createLogger({
					level: "info",
					format: "pretty",
					colors: false,
					service: "svc",
				});

				logger.info("hello");

				expect(infoSpy).toHaveBeenCalled();
				expect(firstConsoleArg(infoSpy)).toContain("INFO");
				expect(firstConsoleArg(infoSpy)).toContain("svc");
				expect(firstConsoleArg(infoSpy)).toContain("hello");
			} finally {
				infoSpy.mockRestore();
			}
		});

		it("prints bindings and merges them with child() bindings", () => {
			const infoSpy = spyOn(console, "info").mockImplementation(() => {});

			try {
				const base = createLogger({
					level: "info",
					format: "pretty",
					colors: false,
					bindings: { reqId: "r1" },
				});
				const child = base.child({ deviceId: "d1" });

				child.info("hello");

				expect(infoSpy).toHaveBeenCalled();
				const firstCall = infoSpy.mock.calls[0] ?? [];
				expect(String(firstCall[0] ?? "")).toContain("hello");
				expect(firstCall[1]).toEqual({ reqId: "r1", deviceId: "d1" });
			} finally {
				infoSpy.mockRestore();
			}
		});
	});

	describe("json format", () => {
		it("emits payload with msg + args when called with string + meta", () => {
			const infoSpy = spyOn(console, "info").mockImplementation(() => {});

			try {
				const logger = createLogger({
					level: "info",
					format: "json",
					colors: false,
					service: "svc",
				});

				logger.info("hello", { a: 1 });

				expect(infoSpy).toHaveBeenCalled();
				const payload = parseJsonPayload(infoSpy);
				expect(payload.level).toBe("info");
				expect(payload.service).toBe("svc");
				expect(payload.msg).toBe("hello");
				expect(payload.args).toEqual(["hello", { a: 1 }]);
			} finally {
				infoSpy.mockRestore();
			}
		});

		it("serializes circular objects safely", () => {
			const infoSpy = spyOn(console, "info").mockImplementation(() => {});
			const obj: Record<string, unknown> = {};
			obj.self = obj;

			try {
				const logger = createLogger({ level: "info", format: "json", colors: false });

				logger.info("hello", obj);

				expect(infoSpy).toHaveBeenCalled();
				const payload = parseJsonPayload(infoSpy) as { readonly args?: unknown[] };
				expect(payload.args).toEqual(["hello", { self: "[Circular]" }]);
			} finally {
				infoSpy.mockRestore();
			}
		});

		it("serializes bigint values", () => {
			const infoSpy = spyOn(console, "info").mockImplementation(() => {});

			try {
				const logger = createLogger({ level: "info", format: "json", colors: false });

				logger.info("hello", { n: 1n });

				expect(infoSpy).toHaveBeenCalled();
				const payload = parseJsonPayload(infoSpy) as { readonly args?: unknown[] };
				expect(payload.args).toEqual(["hello", { n: "1" }]);
			} finally {
				infoSpy.mockRestore();
			}
		});
	});

	describe("level filtering (threshold vs allowlist)", () => {
		it("filters by severity when level is set via options (threshold)", () => {
			const infoSpy = spyOn(console, "info").mockImplementation(() => {});
			const errorSpy = spyOn(console, "error").mockImplementation(() => {});

			try {
				const logger = createLogger({ level: "error", format: "pretty", colors: false });

				logger.info("nope");
				logger.error("yep");

				expect(infoSpy).not.toHaveBeenCalled();
				expect(errorSpy).toHaveBeenCalled();
			} finally {
				infoSpy.mockRestore();
				errorSpy.mockRestore();
			}
		});

		const envCases = [
			{
				name: "treats LOG_LEVEL=warn as threshold (includes more severe)",
				env: { LOG_LEVEL: "warn", LOG_FORMAT: "pretty" },
				expectErrorCalls: 2,
				expectWarnCalls: 1,
			},
			{
				name: "treats LOG_LEVEL=warn,error as allowlist (does not include fatal)",
				env: { LOG_LEVEL: "warn,error", LOG_FORMAT: "pretty" },
				expectErrorCalls: 1,
				expectWarnCalls: 1,
			},
		] as const;

		envCases.forEach((tc) => {
			it(tc.name, () => {
				const warnSpy = spyOn(console, "warn").mockImplementation(() => {});
				const errorSpy = spyOn(console, "error").mockImplementation(() => {});
				const infoSpy = spyOn(console, "info").mockImplementation(() => {});

				try {
					withEnv(tc.env, () => {
						const logger = createLogger({ colors: false });
						logger.info("info");
						logger.warn("warn");
						logger.error("error");
						logger.fatal("fatal");
					});

					expect(infoSpy).not.toHaveBeenCalled();
					expect(warnSpy.mock.calls.length).toBe(tc.expectWarnCalls);
					expect(errorSpy.mock.calls.length).toBe(tc.expectErrorCalls);
				} finally {
					warnSpy.mockRestore();
					errorSpy.mockRestore();
					infoSpy.mockRestore();
				}
			});
		});
	});

	describe("env validation + precedence", () => {
		it("uses LOG_* env when provided (and ignores NEXT_PUBLIC_* for same keys)", () => {
			const infoSpy = spyOn(console, "info").mockImplementation(() => {});
			const errorSpy = spyOn(console, "error").mockImplementation(() => {});

			try {
				withEnv(
					{
						LOG_LEVEL: "error",
						LOG_FORMAT: "pretty",
						LOG_SERVICE: "svc-env",
						NEXT_PUBLIC_LOG_LEVEL: "debug",
						NEXT_PUBLIC_LOG_SERVICE: "svc-public",
					},
					() => {
						const logger = createLogger({ colors: false });
						logger.info("nope");
						logger.error("yep");
					},
				);

				expect(infoSpy).not.toHaveBeenCalled();
				expect(errorSpy).toHaveBeenCalled();
				expect(firstConsoleArg(errorSpy)).toContain("ERROR");
				expect(firstConsoleArg(errorSpy)).toContain("svc-env");
				expect(firstConsoleArg(errorSpy)).toContain("yep");
				expect(firstConsoleArg(errorSpy)).not.toContain("svc-public");
			} finally {
				infoSpy.mockRestore();
				errorSpy.mockRestore();
			}
		});

		it("falls back to NEXT_PUBLIC_* env when LOG_* keys are missing", () => {
			const logSpy = spyOn(console, "log").mockImplementation(() => {});

			try {
				withEnv(
					{
						LOG_LEVEL: undefined,
						LOG_SERVICE: undefined,
						LOG_FORMAT: undefined,
						NEXT_PUBLIC_LOG_LEVEL: "debug",
						NEXT_PUBLIC_LOG_SERVICE: "svc-public",
						NEXT_PUBLIC_LOG_FORMAT: "pretty",
					},
					() => {
						const logger = createLogger({ colors: false });
						logger.debug("hello");
					},
				);

				expect(logSpy).toHaveBeenCalled();
				expect(firstConsoleArg(logSpy)).toContain("DEBUG");
				expect(firstConsoleArg(logSpy)).toContain("svc-public");
				expect(firstConsoleArg(logSpy)).toContain("hello");
			} finally {
				logSpy.mockRestore();
			}
		});

		const invalidEnvCases = [
			{ name: "throws when LOG_LEVEL is invalid", env: { LOG_LEVEL: "nope" } },
			{ name: "throws when LOG_FORMAT is invalid", env: { LOG_FORMAT: "xml" } },
		] as const;

		invalidEnvCases.forEach((tc) => {
			it(tc.name, () => {
				const run = () => withEnv(tc.env, () => createLogger());

				expect(run).toThrow();
			});
		});

		it("treats whitespace LOG_SERVICE as undefined", () => {
			const infoSpy = spyOn(console, "info").mockImplementation(() => {});

			try {
				withEnv(
					{
						LOG_LEVEL: "info",
						LOG_FORMAT: "pretty",
						LOG_SERVICE: "   ",
					},
					() => {
						const logger = createLogger({ colors: false });
						logger.info("hello");
					},
				);

				expect(infoSpy).toHaveBeenCalled();
				const line = firstConsoleArg(infoSpy);
				expect(line).toContain("INFO");
				expect(line).toContain("hello");
				expect(line).not.toContain("svc");
			} finally {
				infoSpy.mockRestore();
			}
		});

		it("accepts allowlist when process.env is patched to provide an array value (defensive)", () => {
			const warnSpy = spyOn(console, "warn").mockImplementation(() => {});
			const errorSpy = spyOn(console, "error").mockImplementation(() => {});

			try {
				withEnvProperty("LOG_LEVEL", ["warn", "error"], () => {
					withEnv({ LOG_FORMAT: "pretty" }, () => {
						const logger = createLogger({ colors: false });
						logger.warn("warn");
						logger.error("error");
						logger.fatal("fatal");
					});
				});

				expect(warnSpy).toHaveBeenCalled();
				expect(errorSpy.mock.calls.length).toBe(1);
			} finally {
				warnSpy.mockRestore();
				errorSpy.mockRestore();
			}
		});
	});
});
