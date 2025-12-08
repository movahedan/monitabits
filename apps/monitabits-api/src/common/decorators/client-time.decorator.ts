import { createParamDecorator, type ExecutionContext } from "@nestjs/common";
import { Request } from "express";

export const ClientTime = createParamDecorator((_data: unknown, ctx: ExecutionContext): Date => {
	const request = ctx.switchToHttp().getRequest<Request & { clientTime: Date }>();
	return request.clientTime;
});
