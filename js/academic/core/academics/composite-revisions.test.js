// @ts-check
import {describe,it,expect} from 'vitest';
import {AcademicRulePackVNextSchema} from '../../contracts/index.js';
import {compareRulePackRevisions} from './rule-diff.js';

const SYNTHETIC_AS_OF='2026-11-05T00:00:00.000Z';
const date='2026-01-01T00:00:00.000Z';
/** 합성 식별자와 가상 학칙만 사용한다. 학교의 공식 승인 근거가 아니다. */
function syntheticAcademicPack(){
  return AcademicRulePackVNextSchema.parse({
    version:'SYN-PACK-1',sourceDocumentVersion:'SYN-DOC-V1',
    sourceDocumentUrl:'https://synthetic.invalid/rules/primary',
    sourceDocumentSha256:'a'.repeat(64),sourcePublishedAt:date,effectiveFrom:date,
    scope:{campus:'SYN-CAMPUS',primaryMajor:'SYN-MAJOR',majorRole:'PRIMARY_MAJOR',
      admissionType:'REGULAR',curriculumVersion:'SYN-CUR-2024',cohortFrom:2024,cohortTo:2024},
    state:'APPROVED',requirements:[{id:'SYN-TOTAL',semanticKey:'total',kind:'CREDIT_TOTAL',
      requiredCreditUnits:84,sourceClauseIds:['SYN-C1'],exceptionClauseIds:[],evidenceRefs:['SYN-E1']}],
    clauseInventory:[{clauseId:'SYN-C1',kind:'RULE',sourceSpanRef:'SYN-SPAN-1',
      coverage:{state:'LINKED',requirementIds:['SYN-TOTAL']}}],
    validationReport:{checkedAt:date,sourceDocumentSha256:'a'.repeat(64),blockingIssues:[]},
    inventoryReviewedBy:'SYN-INVENTORY',approvedBy:'SYN-APPROVER',
    independentlyCheckedBy:'SYN-CHECKER',approvedAt:date,
  });
}
function syntheticMultiDocumentPack(){
  const pack=syntheticAcademicPack();
  return {...pack,sourceDocuments:[
    {documentId:'SYN-DOC-A',url:pack.sourceDocumentUrl,version:pack.sourceDocumentVersion,
      sha256:pack.sourceDocumentSha256,publishedAt:date},
    {documentId:'SYN-DOC-B',url:'https://synthetic.invalid/rules/exception',version:'SYN-DOC-V2',
      sha256:'b'.repeat(64),publishedAt:date},
  ],requirements:pack.requirements.map(r=>({...r,exceptionClauseIds:['SYN-C2']})),
  clauseInventory:[{...pack.clauseInventory[0],sourceDocumentId:'SYN-DOC-A'},
    {clauseId:'SYN-C2',sourceDocumentId:'SYN-DOC-B',kind:/** @type {const} */ ('EXCEPTION'),sourceSpanRef:'SYN-SPAN-2',
      coverage:{state:/** @type {const} */ ('LINKED'),requirementIds:['SYN-TOTAL']}}],
  validationReport:{...pack.validationReport,sourceDocumentHashes:[
    {documentId:'SYN-DOC-A',sha256:'a'.repeat(64)},{documentId:'SYN-DOC-B',sha256:'b'.repeat(64)}]}};
}

describe('합성 규칙 판본의 변경 비교',()=>{
  it('recomputes area-spread and completed-group changes instead of comparing generic course counts',()=>{
    const base=syntheticAcademicPack(),common=base.requirements[0];
    for(const [first,last,field] of /** @type {const} */ ([
      [{kind:'AREA_SPREAD',areaIds:['A','B'],minAreas:1,requiredCreditUnits:6},
        {kind:'AREA_SPREAD',areaIds:['A','B'],minAreas:2,requiredCreditUnits:6},'minAreas'],
      [{kind:'GROUP_CHOICE',groups:[['G1'],['G2']],k:1},
        {kind:'GROUP_CHOICE',groups:[['G1','G2'],['G3']],k:1},'groups'],
    ])){
      const {kind:_,requiredCreditUnits:__,...refs}=/** @type {typeof common&{requiredCreditUnits:number}} */ (common);
      const previous=AcademicRulePackVNextSchema.parse({...base,requirements:[{...refs,...first}]});
      const next=AcademicRulePackVNextSchema.parse({...base,version:'SYN-PACK-2',supersedesVersion:base.version,
        requirements:[{...refs,...last}]});
      const rows=[{attemptToken:'G1',canonicalCourseId:'G1',creditUnits:6,areaIds:['A'],ledger:/** @type {const} */ ('EARNED'),
        recognition:/** @type {const} */ ('RECOGNIZED'),term:'2025-2'}];
      // 두 판본에 같은 행을 사용해 영역 배정이 바뀌지 않았음을 명시한다.
      const result=compareRulePackRevisions({asOf:SYNTHETIC_AS_OF,previous,next,attempts:rows,nextAttempts:rows});
      expect(result).toMatchObject({state:'READY',requirements:[{definition:'CHANGED',stateChange:'LOST'}]});
      expect(result.requirements[0]?.changedFields).toContain(field);
    }
  });
  it('does not compare a revision belonging to a different degree path or track',()=>{
    const base=syntheticAcademicPack();
    const previous={...base,scope:{...base.scope,degreePath:'DOUBLE_MAJOR',track:'TRACK-A'}};
    for(const change of [{degreePath:'ADVANCED_SINGLE'},{track:'TRACK-B'}]){
      const next={...previous,version:'SYN-PACK-2',supersedesVersion:base.version,scope:{...previous.scope,...change}};
      const result=compareRulePackRevisions({asOf:SYNTHETIC_AS_OF,previous,next,attempts:[]});
      expect(result.requirements).toEqual([]);
      expect(result.blockers).toContainEqual({code:'SCOPE_MISMATCH'});
    }
  });
  it('reports a changed supporting original even if its clause ID and span ID were reused',()=>{
    const previous=AcademicRulePackVNextSchema.parse(syntheticMultiDocumentPack());
    const next=AcademicRulePackVNextSchema.parse({...previous,version:'SYN-PACK-2',supersedesVersion:previous.version,
      sourceDocuments:(/** @type {NonNullable<typeof previous.sourceDocuments>} */ (previous.sourceDocuments)).map(d=>d.documentId==='SYN-DOC-B'?{...d,sha256:'c'.repeat(64)}:d),
      validationReport:{...previous.validationReport,sourceDocumentHashes:(/** @type {NonNullable<NonNullable<typeof previous.validationReport>['sourceDocumentHashes']>} */ (previous.validationReport?.sourceDocumentHashes)).map(
        h=>h.documentId==='SYN-DOC-B'?{...h,sha256:'c'.repeat(64)}:h)}});
    const result=compareRulePackRevisions({asOf:SYNTHETIC_AS_OF,previous,next,attempts:[]});
    expect(result.requirements[0]).toMatchObject({definition:'CHANGED',changedFields:['clauses']});
  });
});
