import {
	type CallHandler,
	type ExecutionContext,
	Injectable,
	type NestInterceptor,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";

export interface SuccessResponse<T> {
	readonly success: true;
	readonly data: T;
	readonly timestamp?: string;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, SuccessResponse<T>> {
	intercept(_context: ExecutionContext, next: CallHandler): Observable<SuccessResponse<T>> {
		return next.handle().pipe(
			map((data) => ({
				success: true as const,
				data,
				timestamp: new Date().toISOString(),
			})),
		);
	}
}
