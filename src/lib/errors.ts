/**
 * Framework-neutral HTTP errors. Same class names as the old NestJS exceptions
 * so ported service bodies (`throw new NotFoundException(...)`) need no changes.
 */
export class HttpError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
    this.name = new.target.name;
  }
}

export class BadRequestException extends HttpError {
  constructor(message = "Bad Request") {
    super(400, message);
  }
}
export class UnauthorizedException extends HttpError {
  constructor(message = "Unauthorized") {
    super(401, message);
  }
}
export class ForbiddenException extends HttpError {
  constructor(message = "Forbidden") {
    super(403, message);
  }
}
export class NotFoundException extends HttpError {
  constructor(message = "Not Found") {
    super(404, message);
  }
}
