// @ts-check
/** @typedef {import("../../contracts/campus-assist/index.js").EvidenceConditions} EvidenceConditions */
/** @typedef {import("../../contracts/campus-assist/index.js").EvidenceKind} EvidenceKind */
/** @typedef {import("../../contracts/campus-assist/index.js").EvidenceManifest} EvidenceManifest */
/** @typedef {import("../../contracts/campus-assist/index.js").EvidenceRef} EvidenceRef */
/** @typedef {import("../../contracts/campus-assist/index.js").EvidenceRevision} EvidenceRevision */
/** @typedef {import("../../contracts/campus-assist/index.js").FaqDocument} FaqDocument */
/** @typedef {|'INDEXED'
  |'AFTER_AS_OF'        // 기준 시각 이후에 게시·검수된 판본만 있음
  |'REVISION_CONFLICT'  // 최신 판본 위치의 복사본 내용이 서로 다름
  |'RIGHTS_REVOKED'     // 최신 판본의 권리가 철회·차단됨
  |'CANCELLED'          // 최신 판본이 취소 공지임
  |'NOT_IN_EFFECT'      // 효력 기간 밖
  |'NOT_IN_MANIFEST'    // 스냅샷에 등재되지 않은 미검수 후보
  |'MANIFEST_MISMATCH'} EvidenceDisposition */
/** @typedef {'REF_NOT_INDEXED'|'REF_REVISION_MISMATCH'} EvidenceHoldReason */
/** @typedef {{ citationId:string;; snapshotId:string;; indexRevision:string;; kind:EvidenceKind;; documentId:string;; revisionId:string;; paragraphId:string;; title:string;; text:string;; sourceUrl:string;; publishedAt:string;; verifiedAt:string;; revisionState:'PUBLISHED'|'CORRECTED';; conditions:EvidenceConditions|null;; provenance:EvidenceRevision['provenance'];; publicContacts?:string[];; refs:EvidenceRef[];; status:'READY'|'HOLD';; holdReasons:EvidenceHoldReason[]; }} EvidenceIndexEntry */
/** @typedef {{ kind:EvidenceKind;; documentId:string;; revisionId:string|null;; disposition:EvidenceDisposition;; supersededRevisionIds:string[];; futureRevisionIds:string[]; }} EvidenceDocumentResult */
/** @typedef {{ snapshotId:string;; indexRevision:string;; asOf:string;; provenance:EvidenceManifest['provenance'];; status:'READY'|'PARTIAL';; entries:EvidenceIndexEntry[];; documents:EvidenceDocumentResult[]; }} EvidenceIndex */
/** @typedef {{ manifest:unknown;; revisions:readonly unknown[];; asOf:string; }} EvidenceIndexInput */
import { EvidenceManifestSchema, EvidenceRevisionSchema, } from '../../contracts/campus-assist/index.js';
import { exchangePolicyInEffect } from './exchange.js';
import { canonicalJson, sha256Hex } from './content-hash.js';
/** 매니페스트 빌더(#42)가 같은 값을 계산할 수 있도록 공개하는 판본 내용 해시. */
/**
 * @param {EvidenceRevision} revision
 * @returns {string} 실행 결과
 */
export function evidenceContentSha256(revision) {
    return sha256Hex(canonicalJson(revision));
}
/** 기존 FAQ 문서를 근거 판본으로 옮긴다. FAQ 문서에는 정정·취소 상태가 없으므로 PUBLISHED로 둔다. */
/**
 * @param {FaqDocument} doc
 * @returns {EvidenceRevision} 실행 결과
 */
export function evidenceRevisionFromFaq(doc) {
    return EvidenceRevisionSchema.parse({
        kind: 'FAQ', documentId: doc.documentId, revisionId: doc.revisionId, title: doc.title, sourceUrl: doc.sourceUrl,
        publishedAt: doc.publishedAt, verifiedAt: doc.verifiedAt, state: 'PUBLISHED',
        effectiveFrom: doc.effectiveFrom, effectiveUntil: doc.effectiveUntil,
        rights: doc.rights, provenance: doc.provenance,
        paragraphs: doc.paragraphs.map(p => ({ id: p.id, text: p.text, ...(p.publicContacts ? { publicContacts: p.publicContacts } : {}) })),
    });
}
/** 게시 시각 다음 판본 ID(숫자 인식: r9 < r10) 순. 0은 같은 판본 위치다. */
/**
 * @param {EvidenceRevision} a
 * @param {EvidenceRevision} b
 * @returns {number} 실행 결과
 */
function revisionOrder(a, b) {
    const ta = Date.parse(a.publishedAt), tb = Date.parse(b.publishedAt);
    return ta !== tb ? Math.sign(ta - tb) : Math.sign(a.revisionId.localeCompare(b.revisionId, 'en', { numeric: true }));
}
const docKey = (kind, documentId) => kind + '\u0000' + documentId;
const byText = (a, b) => a < b ? -1 : a > b ? 1 : 0;
/**
 * @param {EvidenceIndexInput} input
 * @returns {EvidenceIndex} 실행 결과
 */
export function buildEvidenceIndex(input) {
    const time = Date.parse(input.asOf);
    if (!Number.isFinite(time))
        throw new RangeError('Invalid asOf');
    const manifest = EvidenceManifestSchema.parse(input.manifest);
    const revisions = EvidenceRevisionSchema.array().max(10000).parse(input.revisions);
    if (revisions.some(r => r.provenance !== manifest.provenance))
        throw new RangeError('Mixed synthetic and real evidence');
    const manifestByDoc = new Map(manifest.entries.map(e => [docKey(e.kind, e.documentId), e]));
    const revisionsByDoc = new Map();
    for (const r of revisions) {
        const key = docKey(r.kind, r.documentId);
        const rows = revisionsByDoc.get(key) ?? [];
        rows.push(r);
        revisionsByDoc.set(key, rows);
    }
    const allKeys = new Set([...revisionsByDoc.keys(), ...manifestByDoc.keys()]);
    const documents = [];
    const heads = new Map();
    for (const key of allKeys) {
        const [kind, documentId] = key.split('\u0000');
        const rows = revisionsByDoc.get(key) ?? [];
        const visible = rows.filter(r => Date.parse(r.publishedAt) <= time && Date.parse(r.verifiedAt) <= time);
        const futureRevisionIds = [...new Set(rows.filter(r => !visible.includes(r)).map(r => r.revisionId))].sort(byText);
        const result = (revisionId, disposition, superseded = []) => documents.push({ kind, documentId, revisionId, disposition, supersededRevisionIds: superseded, futureRevisionIds });
        if (!visible.length) {
            // 판본이 아예 없는데 매니페스트만 있으면 스냅샷과 입력이 어긋난 것이다.
            result(null, rows.length ? 'AFTER_AS_OF' : 'MANIFEST_MISMATCH');
            continue;
        }
        let head = visible[0];
        for (const r of visible)
            if (revisionOrder(r, head) > 0)
                head = r;
        // 같은 판본 ID 또는 같은 판본 위치(r1/r01 등)의 복사본은 내용이 완전히 같아야 한다.
        const copies = visible.filter(r => r.revisionId === head.revisionId || revisionOrder(r, head) === 0);
        const superseded = [...new Set(visible.filter(r => !copies.includes(r)).sort(revisionOrder).map(r => r.revisionId))];
        if (new Set(copies.map(canonicalJson)).size > 1) {
            result(head.revisionId, 'REVISION_CONFLICT', superseded);
            continue;
        }
        if (head.rights !== 'APPROVED') {
            result(head.revisionId, 'RIGHTS_REVOKED', superseded);
            continue;
        }
        if (head.state === 'CANCELLED') {
            result(head.revisionId, 'CANCELLED', superseded);
            continue;
        }
        if (head.effectiveFrom && !exchangePolicyInEffect({ effectiveFrom: head.effectiveFrom, effectiveUntil: head.effectiveUntil }, input.asOf)) {
            result(head.revisionId, 'NOT_IN_EFFECT', superseded);
            continue;
        }
        if (!head.effectiveFrom && head.effectiveUntil
            && time >= Date.parse(head.effectiveUntil + 'T00:00:00+09:00') + 86400000) {
            result(head.revisionId, 'NOT_IN_EFFECT', superseded);
            continue;
        }
        const listed = manifestByDoc.get(key);
        if (!listed) {
            result(head.revisionId, 'NOT_IN_MANIFEST', superseded);
            continue;
        }
        if (listed.revisionId !== head.revisionId || listed.contentSha256 !== evidenceContentSha256(head)) {
            result(head.revisionId, 'MANIFEST_MISMATCH', superseded);
            continue;
        }
        heads.set(key, head);
        result(head.revisionId, 'INDEXED', superseded);
    }
    const entries = [];
    const seen = new Set();
    for (const head of heads.values()) {
        for (const p of head.paragraphs) {
            const citationId = [head.kind, head.documentId, head.revisionId, p.id].join(':');
            if (seen.has(citationId))
                throw new RangeError('Ambiguous evidence citation ID: ' + citationId);
            seen.add(citationId);
            const refs = p.refs ?? [];
            const holdReasons = new Set();
            for (const ref of refs) {
                const target = heads.get(docKey(ref.kind, ref.documentId));
                if (!target)
                    holdReasons.add('REF_NOT_INDEXED');
                else if (target.revisionId !== ref.revisionId)
                    holdReasons.add('REF_REVISION_MISMATCH');
            }
            entries.push({
                citationId, snapshotId: manifest.snapshotId, indexRevision: manifest.indexRevision,
                kind: head.kind, documentId: head.documentId, revisionId: head.revisionId, paragraphId: p.id,
                title: head.title, text: p.text, sourceUrl: head.sourceUrl, publishedAt: head.publishedAt, verifiedAt: head.verifiedAt,
                revisionState: head.state === 'CORRECTED' ? 'CORRECTED' : 'PUBLISHED',
                conditions: head.conditions ?? null, provenance: head.provenance,
                ...(p.publicContacts ? { publicContacts: [...p.publicContacts] } : {}),
                refs: refs.map(r => ({ ...r })),
                status: holdReasons.size ? 'HOLD' : 'READY',
                holdReasons: [...holdReasons].sort(byText),
            });
        }
    }
    entries.sort((a, b) => byText(a.citationId, b.citationId));
    documents.sort((a, b) => byText(a.kind, b.kind) || byText(a.documentId, b.documentId));
    const complete = [...manifestByDoc.keys()].every(k => heads.has(k)) && entries.every(e => e.status === 'READY');
    return {
        snapshotId: manifest.snapshotId, indexRevision: manifest.indexRevision, asOf: input.asOf,
        provenance: manifest.provenance, status: complete ? 'READY' : 'PARTIAL', entries, documents,
    };
}
