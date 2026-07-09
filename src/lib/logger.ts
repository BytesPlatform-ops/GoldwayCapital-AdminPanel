/** Minimal drop-in for the NestJS Logger so ported services keep their calls. */
export class Logger {
  constructor(private readonly context = "App") {}
  log(message: unknown) {
    console.log(`[${this.context}]`, message);
  }
  warn(message: unknown) {
    console.warn(`[${this.context}]`, message);
  }
  error(message: unknown) {
    console.error(`[${this.context}]`, message);
  }
}
