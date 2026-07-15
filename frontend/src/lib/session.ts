/**
 * Session cookie constants for the admin frontend. The cookie holds the JWT
 * issued by the backend (`POST /api/auth/login`); the frontend never signs or
 * verifies it — validity is always checked by the backend (`GET /api/auth/me`).
 */
export const SESSION_COOKIE = "goldway_session";
export const SESSION_MAX_AGE = 8 * 60 * 60; // seconds — matches the backend JWT lifetime
