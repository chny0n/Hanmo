// @ts-check
import { describe, expect, it } from 'vitest';
import { exchangePolicyInEffect } from './exchange.js';

describe('#365 policy dates are Asia/Seoul calendar days', () => {
    const window = { effectiveFrom: '2026-11-08', effectiveUntil: '2026-11-30' };
    it.each([
        ['2026-11-07T23:59:59.999+09:00', false, 'one ms before KST start'],
        ['2026-11-08T00:00:00+09:00', true, 'KST start'],
        ['2026-11-08T00:30:00+09:00', true, 'issue example: KST 00:30 on the start day'],
        ['2026-11-07T15:00:00Z', true, 'same instant as KST start, written in UTC'],
        ['2026-11-07T14:59:59Z', false, 'UTC instant just before KST start'],
        ['2026-11-30T23:59:59.999+09:00', true, 'last ms of the inclusive end day'],
        ['2026-12-01T00:00:00+09:00', false, 'KST start of the next day'],
        ['2026-12-01T00:30:00+09:00', false, 'issue example: KST 00:30 after the end day'],
        ['2026-11-30T15:00:00Z', false, 'UTC form of KST 12-01 00:00'],
        ['2026-11-30T09:00:00-05:00', true, 'another offset, still 11-30 23:00 KST'],
    ])('%s -> %s (%s)', (asOf, expected) => {
        expect(exchangePolicyInEffect(window, asOf)).toBe(expected);
    });
    it('open-ended policies have no end', () => {
        expect(exchangePolicyInEffect({ effectiveFrom: '2026-11-08' }, '2099-01-01T00:00:00+09:00')).toBe(true);
    });
    it('rejects an invalid asOf', () => {
        expect(() => exchangePolicyInEffect(window, 'not-a-date')).toThrow(RangeError);
    });
});
