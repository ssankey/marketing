import { parse } from 'cookie';

/**
 * Parses the cookies from the request headers.
 * @param {Object} req - The incoming request object.
 * @returns {Object} - An object containing parsed cookies.
 */
export function parseCookies(req) {
  return parse(req ? req.headers.cookie || '' : '');
}
