import { supabase } from '@/lib/supabase';

/**
 * Represents the current status of a student's digital ID.
 */
export interface IDStatus {
  is_valid: boolean;
  expires_at: string;
  days_remaining: number;
  status_label: 'active' | 'expiring_soon' | 'expired' | 'revoked' | 'pending' | 'waitlisted' | 'not_found';
  verification_status: 'pending' | 'verified' | 'waitlisted' | null;
  waitlist_reason: string | null;
  verified_at: string | null;
}

/**
 * Custom error thrown when an ID status operation fails.
 */
export class IDStatusError extends Error {
  cause?: unknown;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = 'IDStatusError';
    this.cause = cause;
  }
}

/**
 * Fetch and compute the ID expiry status for a given matric number.
 *
 * Queries the `id_replacements` table directly. If no record exists,
 * returns a `not_found` status.
 *
 * @param matricNumber - The student's matriculation number.
 * @returns An IDStatus object with computed status_label and days_remaining.
 * @throws {IDStatusError} If the database query fails.
 */
export async function getIDStatus(matricNumber: string): Promise<IDStatus> {
  const { data, error } = await supabase
    .from('id_replacements')
    .select('is_valid, expires_at, verification_status, waitlist_reason, verified_at')
    .eq('matric_number', matricNumber)
    .maybeSingle();

  if (error) {
    throw new IDStatusError('Failed to query ID status', error);
  }

  if (!data) {
    return {
      is_valid: false,
      expires_at: '',
      days_remaining: 0,
      status_label: 'not_found',
      verification_status: null,
      waitlist_reason: null,
      verified_at: null,
    };
  }

  const vs = data.verification_status;

  if (vs === 'pending') {
    return {
      is_valid: data.is_valid,
      expires_at: data.expires_at,
      days_remaining: 0,
      status_label: 'pending',
      verification_status: 'pending',
      waitlist_reason: null,
      verified_at: null,
    };
  }

  if (vs === 'waitlisted') {
    return {
      is_valid: data.is_valid,
      expires_at: data.expires_at,
      days_remaining: 0,
      status_label: 'waitlisted',
      verification_status: 'waitlisted',
      waitlist_reason: data.waitlist_reason,
      verified_at: data.verified_at,
    };
  }

  const expiresAt = data.expires_at;
  const msRemaining = new Date(expiresAt).getTime() - Date.now();
  const days_remaining = Math.floor(msRemaining / 86_400_000);

  let status_label: IDStatus['status_label'];

  if (!data.is_valid && days_remaining >= 0) {
    status_label = 'revoked';
  } else if (!data.is_valid || days_remaining < 0) {
    status_label = 'expired';
  } else if (days_remaining <= 30) {
    status_label = 'expiring_soon';
  } else {
    status_label = 'active';
  }

  return {
    is_valid: data.is_valid,
    expires_at: expiresAt,
    days_remaining,
    status_label,
    verification_status: vs ?? 'verified',
    waitlist_reason: data.waitlist_reason,
    verified_at: data.verified_at,
  };
}

/**
 * Revoke a student's ID access by setting is_valid to false.
 *
 * @param matricNumber - The student's matriculation number.
 * @throws {IDStatusError} If the update fails.
 */
export async function revokeIDAccess(matricNumber: string): Promise<void> {
  const { error } = await supabase
    .from('id_replacements')
    .update({ is_valid: false })
    .eq('matric_number', matricNumber);

  if (error) {
    throw new IDStatusError('Failed to revoke ID access', error);
  }
}
