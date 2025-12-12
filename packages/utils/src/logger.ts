import { z } from "zod";

/**
 * @packageDocumentation logger
 * @module utils/logger
 * @description Logs everywhere, depends which level is set.
 * @example
 * ```typescript
 * import { logger } from "@repo/utils/logger";
 * logger.info("Hello, world!");
 * logger.error("Hello, world!");
 * logger.warn("Hello, world!");
 * logger.debug("Hello, world!");
 * logger.trace("Hello, world!");
 * logger.fatal("Hello, world!");
 * logger.silent("Hello, world!");
 * ```
 * @example
 * ```typescript
 * import { createLogger } from "@repo/utils/logger";
 * const logger = createLogger({ level: "info", format: "pretty", colors: false });
 * logger.info("Hello, world!");
 * ```
 * @env
 * - LOG_LEVEL=trace|debug|info|warn|error|fatal|silent
 * - NEXT_PUBLIC_LOG_LEVEL=trace|debug|info|warn|error|fatal|silent
 * - LOG_FORMAT=pretty|json
 * - NEXT_PUBLIC_LOG_FORMAT=pretty|json
 * - LOG_SERVICE=your-service-name
 * - NEXT_PUBLIC_LOG_SERVICE=your-service-name
 */

// Basic types ----------------------------------------------------------------------------------------

const LOG_LEVELS = ["trace", "debug", "info", "warn", "error", "fatal", "silent"] as const;
type LogLevel = (typeof LOG_LEVELS)[number];
type LogLevelConfig = LogLevel | Set<LogLevel>;
const LogLevelSchema = z.enum(LOG_LEVELS);
const LEVEL_WEIGHT: Record<Exclude<LogLevel, "silent">, number> = {
	trace: 10,
	debug: 20,
	info: 30,
	warn: 40,
	error: 50,
	fatal: 60,
};

const LogFormatSchema = z.enum(["pretty", "json"] as const);
type LogFormat = z.infer<typeof LogFormatSchema>;

// Environment variables ------------------------------------------------------------------------------

const LogLevelValueSchema = z.union([LogLevelSchema, z.array(LogLevelSchema).min(1)]);

function parseLogLevelConfigInput(value: unknown): unknown {
	if (typeof value !== "string") return value;

	const trimmed = value.trim();
	if (!trimmed) return undefined;

	// "warn,error" => ["warn","error"] (allowlist mode)
	// "warn" => "warn" (threshold mode)
	if (trimmed.includes(",")) {
		return trimmed
			.split(",")
			.map((p) => p.trim().toLowerCase())
			.filter(Boolean);
	}

	return trimmed.toLowerCase();
}

const OptionalNonEmptyStringSchema = z.preprocess((value) => {
	if (typeof value !== "string") return value;
	const trimmed = value.trim();
	return trimmed === "" ? undefined : trimmed;
}, z.string().min(1).optional());

function getLoggerEnvSchema() {
	const LogLevelConfigSchema = z.preprocess(parseLogLevelConfigInput, LogLevelValueSchema);

	return z
		.object({
			LOG_LEVEL: LogLevelConfigSchema.optional(),
			NEXT_PUBLIC_LOG_LEVEL: LogLevelConfigSchema.optional(),
			LOG_FORMAT: LogFormatSchema.optional(),
			NEXT_PUBLIC_LOG_FORMAT: LogFormatSchema.optional(),
			LOG_SERVICE: OptionalNonEmptyStringSchema,
			NEXT_PUBLIC_LOG_SERVICE: OptionalNonEmptyStringSchema,
		})
		.loose();
}

const LoggerEnvSchema = getLoggerEnvSchema();
type LoggerEnv = z.infer<typeof LoggerEnvSchema>;

function readLoggerEnv(): LoggerEnv {
	try {
		return LoggerEnvSchema.parse(process.env);
	} catch (error) {
		if (error instanceof z.ZodError) {
			const message = error.issues
				.map((issue) => `${issue.path.join(".")}: ${issue.message}`)
				.join("; ");
			throw new Error(`[logger] Invalid environment variables: ${message}`);
		}
		throw error;
	}
}

// Types ----------------------------------------------------------------------------------------------

export interface LoggerBindings extends Record<string, unknown> {}
export interface CreateLoggerOptions {
	readonly level?: LogLevelConfig;
	readonly format?: LogFormat;
	readonly service?: string;
	readonly colors?: boolean;
	readonly bindings?: LoggerBindings;
}
export interface Logger {
	readonly level: LogLevelConfig;
	readonly service: string | undefined;
	trace: (...args: unknown[]) => void;
	debug: (...args: unknown[]) => void;
	info: (...args: unknown[]) => void;
	warn: (...args: unknown[]) => void;
	error: (...args: unknown[]) => void;
	fatal: (...args: unknown[]) => void;
	child: (bindings: LoggerBindings) => Logger;
	log: (...args: unknown[]) => void;
	verbose: (...args: unknown[]) => void;
}

// Utilities ------------------------------------------------------------------------------------------

function shouldColorize(): boolean {
	// Bun/Node: avoid crashing in edge runtimes; just disable colors if uncertain.
	try {
		return Boolean(process?.stdout?.isTTY);
	} catch {
		return false;
	}
}

function stableStringify(value: unknown): string {
	const seen = new WeakSet<object>();
	return JSON.stringify(value, (_key, v) => {
		if (typeof v === "bigint") return v.toString();
		if (typeof v === "object" && v !== null) {
			if (seen.has(v)) return "[Circular]";
			seen.add(v);
		}
		return v;
	});
}

function formatLevelPretty(level: Exclude<LogLevel, "silent">, useColors: boolean): string {
	if (!useColors) return level.toUpperCase();
	// ANSI colors (no dependency, works in Docker if TTY)
	const reset = "\u001b[0m";
	const gray = "\u001b[90m";
	const cyan = "\u001b[36m";
	const green = "\u001b[32m";
	const yellow = "\u001b[33m";
	const red = "\u001b[31m";
	const magenta = "\u001b[35m";

	const colored =
		level === "trace"
			? `${gray}${level.toUpperCase()}${reset}`
			: level === "debug"
				? `${cyan}${level.toUpperCase()}${reset}`
				: level === "info"
					? `${green}${level.toUpperCase()}${reset}`
					: level === "warn"
						? `${yellow}${level.toUpperCase()}${reset}`
						: level === "error"
							? `${red}${level.toUpperCase()}${reset}`
							: `${magenta}${level.toUpperCase()}${reset}`;

	return colored;
}

function createConsoleWriter(level: Exclude<LogLevel, "silent">): (...args: unknown[]) => void {
	if (level === "warn") return console.warn.bind(console);
	if (level === "error" || level === "fatal") return console.error.bind(console);
	if (level === "debug" || level === "trace") return console.log.bind(console);
	return console.info.bind(console);
}

function resolveLogLevelConfig(value: LoggerEnv["LOG_LEVEL"] | undefined): LogLevelConfig {
	if (!value) return "warn";
	if (typeof value === "string") return value;
	return new Set(value);
}

function shouldLog(config: LogLevelConfig, level: Exclude<LogLevel, "silent">): boolean {
	if (config instanceof Set) return config.has(level);
	if (config === "silent") return false;
	return LEVEL_WEIGHT[level] >= LEVEL_WEIGHT[config];
}

// Actual implementation ------------------------------------------------------------------------------

export function createLogger(options: CreateLoggerOptions = {}): Logger {
	const env = readLoggerEnv();

	const level =
		options.level ?? resolveLogLevelConfig(env.LOG_LEVEL ?? env.NEXT_PUBLIC_LOG_LEVEL ?? "info");
	const format = options.format ?? env.LOG_FORMAT ?? env.NEXT_PUBLIC_LOG_FORMAT ?? "pretty";
	const service = options.service ?? env.LOG_SERVICE ?? env.NEXT_PUBLIC_LOG_SERVICE ?? undefined;
	const colors = options.colors ?? shouldColorize();
	const bindings = options.bindings ?? {};

	const emit = (lvl: Exclude<LogLevel, "silent">, args: unknown[] = []): void => {
		if (!shouldLog(level, lvl)) return;

		const hasBindings = Object.keys(bindings).length > 0;

		if (format === "json") {
			const [first] = args;
			const payload: Record<string, unknown> = {
				level: lvl,
				service,
				...(hasBindings ? bindings : {}),
				msg: typeof first === "string" ? first : undefined,
				args,
			};
			const writer = createConsoleWriter(lvl);
			writer(stableStringify(payload));
			return;
		}

		const prefixParts: string[] = [];
		prefixParts.push(formatLevelPretty(lvl, colors));
		if (service) prefixParts.push(service);
		const prefix = prefixParts.join(" ");

		const writer = createConsoleWriter(lvl);
		const [first, ...rest] = args;

		// Preserve objects in console output (don't coerce to string).
		if (typeof first === "string") {
			if (hasBindings) writer(`${prefix} ${first}`, bindings, ...rest);
			else writer(`${prefix} ${first}`, ...rest);
			return;
		}

		if (hasBindings) writer(prefix, bindings, ...args);
		else writer(prefix, ...args);
	};

	return {
		level,
		service,
		fatal: (...args: unknown[]) => emit("fatal", args),
		error: (...args: unknown[]) => emit("error", args),
		warn: (...args: unknown[]) => emit("warn", args),
		debug: (...args: unknown[]) => emit("debug", args),
		info: (...args: unknown[]) => emit("info", args),
		log: (...args: unknown[]) => emit("info", args),
		trace: (...args: unknown[]) => emit("trace", args),
		verbose: (...args: unknown[]) => emit("trace", args),
		child: (childBindings: LoggerBindings) =>
			createLogger({ level, format, service, colors, bindings: { ...bindings, ...childBindings } }),
	};
}

export const logger: Logger = createLogger();
