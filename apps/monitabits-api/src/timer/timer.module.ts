import { Module } from "@nestjs/common";
import { PrismaModule } from "../common/services/prisma.module";
import { TimerController } from "./timer.controller";
import { TimerService } from "./timer.service";

@Module({
	imports: [PrismaModule],
	controllers: [TimerController],
	providers: [TimerService],
	exports: [TimerService],
})
export class TimerModule {}
