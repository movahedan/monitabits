import { Controller, Get, Param } from "@nestjs/common";

@Controller()
export class AppController {
	@Get("status")
	getStatus(): { readonly ok: boolean } {
		return { ok: true };
	}

	@Get("message/:name")
	getMessage(@Param("name") name: string): { readonly message: string } {
		return { message: `hello ${name}` };
	}
}
