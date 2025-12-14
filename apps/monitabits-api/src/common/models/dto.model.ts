/**
 * Marker base class for OpenAPI DTO discovery.
 *
 * Swagger setup uses `FooDto.prototype instanceof BaseDto` to reliably collect
 * DTO classes without relying on export names.
 */
export abstract class BaseDto {}
