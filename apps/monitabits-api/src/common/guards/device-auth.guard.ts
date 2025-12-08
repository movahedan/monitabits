import {
	type CanActivate,
	type ExecutionContext,
	Injectable,
	UnauthorizedException,
} from "@nestjs/common";
import { Request } from "express";
import { validateDeviceId } from "../validators";

@Injectable()
export class DeviceAuthGuard implements CanActivate {
	canActivate(context: ExecutionContext): boolean {
		const request = context.switchToHttp().getRequest<Request>();
		const deviceIdHeader = request.headers["x-device-id"] as string | undefined;

		try {
			const deviceId = validateDeviceId(deviceIdHeader);

			// Store device ID in request for later use
			(request as Request & { deviceId: string }).deviceId = deviceId;

			return true;
		} catch (error) {
			throw new UnauthorizedException(
				error instanceof Error ? error.message : "Device ID is required",
			);
		}
	}
}
