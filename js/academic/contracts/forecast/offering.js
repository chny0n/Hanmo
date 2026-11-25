// @ts-check
// 학생용 개설 전망이 다른 학사 규정 계약을 불러오지 않도록 별도로 둔다.
/** @typedef {z.infer<typeof OfferingOutlookVNextSchema>} OfferingOutlookVNext */
import { z } from 'zod';
const Id = z.string().trim().min(1).max(128).regex(/^[A-Za-z0-9_.:-]+$/);
const DateTime = z.iso.datetime({ offset: true });
export const AcademicTermVNextSchema = z.string().regex(/^(19|20|21)\d{2}-[12]$/, { message: 'Regular semester must be YYYY-1 or YYYY-2' });
export const AcademicOfferingObservationVNextSchema = z.strictObject({
    term: AcademicTermVNextSchema,
    state: z.enum(['OFFERED', 'CONFIRMED_NOT_OFFERED', 'UNKNOWN']),
    coverage: z.enum(['COMPLETE_TERM_CATALOG', 'PARTIAL', 'NOTICE_ONLY']),
    sourceRef: Id,
    publishedAt: DateTime,
    verifiedAt: DateTime,
}).refine(v => Date.parse(v.verifiedAt) >= Date.parse(v.publishedAt), {
    path: ['verifiedAt'], message: 'Evidence cannot be verified before publication',
});
export const AcademicOfficialEventVNextSchema = z.strictObject({
    eventId: Id,
    kind: z.enum(['RESEARCH_LEAVE', 'RETIREMENT', 'STAFF_CHANGE', 'CURRICULUM_CHANGE',
        'COURSE_CANCELLED', 'REPLACEMENT_CONFIRMED']),
    sourceRef: Id,
    publishedAt: DateTime,
    verifiedAt: DateTime,
    effectiveFrom: DateTime,
    impact: z.enum(['POTENTIAL_ASSIGNMENT_CHANGE', 'EXPLICIT_COURSE_STATUS']),
    affectedCourseIds: z.array(Id).min(1).max(30),
    effectiveUntil: DateTime.optional(),
}).superRefine((v, ctx) => {
    if (Date.parse(v.verifiedAt) < Date.parse(v.publishedAt))
        ctx.addIssue({ code: 'custom', path: ['verifiedAt'],
            message: 'Cannot verify event before publication' });
    if (v.effectiveUntil && Date.parse(v.effectiveUntil) <= Date.parse(v.effectiveFrom))
        ctx.addIssue({ code: 'custom', path: ['effectiveUntil'],
            message: 'Reversed official-event effective period' });
});
export const OfferingOutlookVNextSchema = z.strictObject({
    courseId: Id,
    targetTerm: AcademicTermVNextSchema,
    asOf: DateTime,
    modelVersion: Id,
    signal: z.enum([
        'CONFIRMED_OFFERED', 'CONFIRMED_NOT_OFFERED', 'HISTORICAL_PATTERN',
        'EVENT_REVIEW', 'INSUFFICIENT_DATA', 'UNKNOWN',
    ]),
    sourcePublishedAt: DateTime.optional(),
    evidenceRefs: z.array(Id).max(50),
    observations: z.array(AcademicOfferingObservationVNextSchema).max(20),
    officialEvents: z.array(AcademicOfficialEventVNextSchema).max(30),
    sameSeasonObservedTerms: z.number().int().nonnegative(),
    sameSeasonOfferedTerms: z.number().int().nonnegative(),
    alternatives: z.array(z.strictObject({
        courseId: Id,
        status: z.enum(['OFFICIALLY_APPROVED', 'NEEDS_REVIEW']),
        evidenceRef: Id.optional(),
    })).max(20),
    caveat: z.string().trim().min(1).max(300),
}).superRefine((v, ctx) => {
    /** @param {(string|number)[]} path @param {string} message */
    const issue = (path, message) => ctx.addIssue({
        code: 'custom', path, message,
    });
    const asOf = Date.parse(v.asOf), term = parseTerm(v.targetTerm);
    if (v.sourcePublishedAt && Date.parse(v.sourcePublishedAt) > asOf)
        issue(['sourcePublishedAt'], 'Published after historical asOf');
    if (new Set(v.observations.map(o => o.term)).size !== v.observations.length)
        issue(['observations'], 'Duplicate term observation');
    const complete = v.observations.filter(o => o.coverage === 'COMPLETE_TERM_CATALOG'
        && o.state !== 'UNKNOWN' && o.term.endsWith('-' + term.season));
    const count = complete.length, offered = complete.filter(o => o.state === 'OFFERED').length;
    if (v.sameSeasonObservedTerms !== count || v.sameSeasonOfferedTerms !== offered)
        issue(['sameSeasonObservedTerms'], 'Counts must equal independently verified observations');
    for (const [i, o] of v.observations.entries()) {
        if (o.term >= v.targetTerm || Date.parse(o.publishedAt) > asOf
            || Date.parse(o.verifiedAt) > asOf)
            issue(['observations', i], 'No future offering history in asOf replay');
    }
    for (const [i, e] of v.officialEvents.entries()) {
        if (Date.parse(e.publishedAt) > asOf || Date.parse(e.verifiedAt) > asOf)
            issue(['officialEvents', i], 'Future official event leakage');
        if (!e.affectedCourseIds.includes(v.courseId))
            issue(['officialEvents', i, 'affectedCourseIds'], 'Unrelated official event');
    }
    if (v.signal === 'HISTORICAL_PATTERN' && count < 3)
        issue(['signal'], 'Pattern requires at least 3 complete same-season terms');
    if (v.signal === 'EVENT_REVIEW' && !v.officialEvents.some(e => e.impact === 'POTENTIAL_ASSIGNMENT_CHANGE'))
        issue(['signal'], 'EVENT_REVIEW needs a reviewed official event');
    if (v.signal === 'CONFIRMED_NOT_OFFERED' && v.officialEvents.some(e => e.impact === 'POTENTIAL_ASSIGNMENT_CHANGE')
        && !v.officialEvents.some(e => e.kind === 'COURSE_CANCELLED'
            && e.impact === 'EXPLICIT_COURSE_STATUS'))
        issue(['signal'], 'Research leave or staff changes do not prove non-offering');
    if (v.signal.startsWith('CONFIRMED_')
        && (!v.sourcePublishedAt || !v.evidenceRefs.length))
        issue(['sourcePublishedAt'], 'Confirmed status needs official published evidence');
    for (const [i, a] of v.alternatives.entries()) {
        if (a.courseId === v.courseId)
            issue(['alternatives', i], 'Not an alternative');
        if (a.status === 'OFFICIALLY_APPROVED' && !a.evidenceRef)
            issue(['alternatives', i, 'evidenceRef'], 'Official substitute needs evidence');
    }
});
/**
 * @param {string} term
 * @returns {{year:number;season:string}}
 */
function parseTerm(term) {
    return { year: Number(term.slice(0, 4)), season: term.slice(-1) };
}
