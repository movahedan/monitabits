import { describe, expect, it } from "bun:test";
import { ErrorResponseSchema, SuccessResponseSchema } from "../common/models/response.model";

describe("Response Models", () => {
	describe("SuccessResponseSchema", () => {
		it("validates a valid success response", () => {
			const response = {
				success: true,
				data: { ok: true },
			};

			const result = SuccessResponseSchema.safeParse(response);

			expect(result.success).toBe(true);
		});

		it("validates success response with optional timestamp", () => {
			const response = {
				success: true,
				data: { id: 1 },
				timestamp: "2024-01-01T00:00:00.000Z",
			};

			const result = SuccessResponseSchema.safeParse(response);

			expect(result.success).toBe(true);
		});
	});

	describe("ErrorResponseSchema", () => {
		it("validates a valid error response", () => {
			const response = {
				success: false,
				error: "BadRequest",
				message: "Invalid input",
				statusCode: 400,
				timestamp: "2024-01-01T00:00:00.000Z",
				path: "/api/test",
			};

			const result = ErrorResponseSchema.safeParse(response);

			expect(result.success).toBe(true);
		});

		it("rejects invalid error response", () => {
			const response = {
				success: false,
				error: "BadRequest",
				// missing required fields
			};

			const result = ErrorResponseSchema.safeParse(response);

			expect(result.success).toBe(false);
		});
	});
});
