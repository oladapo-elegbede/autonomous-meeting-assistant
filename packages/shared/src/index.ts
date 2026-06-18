/**
 * Shared types and constants used across the entire application.
 * Everything exported here is available to both the web and api apps.
 */

export const APP_NAME = 'Autonomous AI Meeting Assistant';
export const APP_VERSION = '0.0.1';

/**
 * Standard API response envelope.
 * Every API endpoint returns data in this shape.
 */
export type ApiResponse<T> =
  | {
      success: true;
      data: T;
    }
  | {
      success: false;
      error: {
        code: string;
        message: string;
      };
    };