import {
	BadRequestException,
	type CanActivate,
	type ExecutionContext,
	Injectable,
} from "@nestjs/common";
import { Request } from "express";
import { validateClientTime } from "../validators";

@Injectable()
export class TimeValidationGuard implements CanActivate {
	canActivate(context: ExecutionContext): boolean {
		const request = context.switchToHttp().getRequest<Request>();
		const clientTimeHeader = request.headers["x-client-time"] as string | undefined;

		try {
			const clientTime = validateClientTime(clientTimeHeader);

			// Store client time in request for later use
			(request as Request & { clientTime: Date }).clientTime = clientTime;

			return true;
		} catch (error) {
			const serverTime = new Date();
			throw new BadRequestException({
				success: false,
				error: "TIME_VALIDATION_FAILED",
				message: error instanceof Error ? error.message : "Time validation failed",
				statusCode: 400,
				timestamp: serverTime.toISOString(),
				path: request.url,
			});
		}
	}
}
