/** Shapes shared across admin pages. Mirrors the backend API's JSON — no Prisma here. */

export interface Me {
  id: string;
  email: string;
  name: string;
  role: string;
}
