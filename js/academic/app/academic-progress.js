// @ts-check
/** @typedef {import("../views/student-progress.js").ScenarioId} ScenarioId */
/** @typedef {import("../views/student-progress.js").StudentCourse} StudentCourse */
/** @typedef {import("../views/student-progress.js").StudentPlanCourse} StudentPlanCourse */
/** @typedef {import("../views/student-progress.js").ProvisionalScenario} ProvisionalScenario */
import {
    compareProvisionalScenario, creditsText, explainProvisionalExclusions, MAX_COURSES,
    normalizePlanCourse, normalizeStudentCourse, provisionalTermBreakdown, SCENARIO_TERMS, upcomingTerms,
} from '../views/student-progress.js';
/** @type {StudentCourse[]} */
const records = [];
/** @type {Record<ScenarioId,StudentPlanCourse[]>} */
const plans = { A: [], B: [], C: [] };
const SCENARIOS = /** @type {const} */ (['A', 'B', 'C']);
/** @param {string} id @returns {HTMLElement} */
const get = (id) => {
    const element = document.getElementById(id);
    if (!element)
        throw new Error('학생용 입력 화면이 누락되었습니다: ' + id);
    return element;
};
/**
 * @template {HTMLElement} T
 * @param {string} id
 * @param {{new(): T}} kind
 * @returns {T}
 */
function control(id, kind) {
    const node = get(id);
    if (!(node instanceof kind))
        throw new Error('학생용 입력 요소 유형이 올바르지 않습니다: ' + id);
    return node;
}
/** @param {string} id @param {string} message @returns {void} */
const write = (id, message) => { get(id).textContent = message; };
/** @param {keyof HTMLElementTagNameMap} tag @param {string} value @returns {HTMLElement} */
const text = (tag, value) => {
    const node = document.createElement(tag);
    node.textContent = value;
    return node;
};
/**
 * @returns {ScenarioId}
 */
function selected() {
    const input = document.querySelector('input[name="scenario"]:checked');
    const active = input instanceof HTMLInputElement ? input.value : undefined;
    return SCENARIOS.find(scenario => scenario === active) ?? 'A';
}
/** @param {ScenarioId} scenario */
const planLabel = scenario => SCENARIO_TERMS[scenario] + '학기';
/**
 * @returns {string}
 */
function today() { return new Date().toISOString(); }
/** @param {string} asOf @param {readonly StudentCourse[]} courseRecords */
function comparePlans(asOf, courseRecords) {
    return SCENARIOS.map(scenario => compareProvisionalScenario({
        asOf, scenario, records: courseRecords, plans: plans[scenario],
    }));
}
/** @returns {void} */
function renderRecords() {
    const tbody = get('record-rows');
    tbody.replaceChildren();
    if (!records.length) {
        const row = document.createElement('tr'), cell = document.createElement('td');
        cell.colSpan = 5;
        cell.textContent = '입력한 과목 없음';
        row.append(cell);
        tbody.append(row);
        return;
    }
    for (const [index, record] of records.entries()) {
        const tr = document.createElement('tr');
        tr.append(text('td', record.courseId));
        tr.append(text('td', record.term));
        tr.append(text('td', creditsText(record.credits * 2)));
        tr.append(text('td', record.slot === 'EARNED' ? '취득 완료' : '수강 중'));
        const cell = document.createElement('td'), button = document.createElement('button');
        button.type = 'button';
        button.textContent = '삭제';
        button.setAttribute('aria-label', record.courseId + ' 입력 기록 삭제');
        button.addEventListener('click', () => {
            records.splice(index, 1);
            renderAll();
            write('record-message', '기록을 삭제했습니다.');
        });
        cell.append(button);
        tr.append(cell);
        tbody.append(tr);
    }
}
/**
 * @param {string} asOf
 */
function renderTermChoices(asOf) {
    const select = control('plan-term', HTMLSelectElement);
    const previous = select.value;
    const terms = upcomingTerms(asOf, SCENARIO_TERMS[selected()]);
    select.replaceChildren();
    for (const term of terms) {
        const option = document.createElement('option');
        option.value = term;
        option.textContent = term.slice(0, 4) + '년 ' + (term.endsWith('-1') ? '1학기' : '2학기');
        select.append(option);
    }
    if (terms.includes(previous))
        select.value = previous;
}
/** @returns {void} */
function renderPlanRows() {
    const root = get('plan-rows');
    root.replaceChildren();
    const id = selected(), items = plans[id];
    if (!items.length) {
        root.append(text('p', '추가한 과목 없음'));
        return;
    }
    for (const [index, item] of items.entries()) {
        const row = document.createElement('div');
        row.className = 'plan-row';
        row.append(text('span', item.term + ' · ' + item.courseId + ' · ' + creditsText(item.credits * 2)));
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = '삭제';
        button.setAttribute('aria-label', planLabel(id) + ' 계획 ' + item.term + ' ' + item.courseId + ' 삭제');
        button.addEventListener('click', () => {
            plans[id].splice(index, 1);
            renderAll();
            write('plan-message', '과목을 삭제했습니다.');
        });
        row.append(button);
        root.append(row);
    }
}
/**
 * @param {HTMLElement} root
 * @param {string} label
 * @param {number} units
 */
function addMetric(root, label, units) {
    const card = document.createElement('div');
    card.className = 'credit-card';
    card.append(text('span', label));
    card.append(text('strong', creditsText(units)));
    root.append(card);
}
/**
 * @param {HTMLTableRowElement} row
 * @param {string} label
 * @param {'row'|'col'} scope
 */
function appendHeader(row, label, scope) {
    const header = document.createElement('th');
    header.scope = scope;
    header.textContent = label;
    row.append(header);
}
/** @param {string} [asOf] @param {ProvisionalScenario[]} [comparisons] */
function renderAll(asOf = today(), comparisons) {
    renderRecords();
    renderPlanRows();
    renderTermChoices(asOf);
    const root = get('scenario-comparison'), creditRoot = get('credit-overview');
    root.replaceChildren();
    creditRoot.replaceChildren();
    try {
        const results = comparisons ?? comparePlans(asOf, records);
        const first = results[0].audit;
        addMetric(creditRoot, '취득', first.earnedCreditUnits);
        addMetric(creditRoot, '수강 중', first.inProgressCreditUnits);
        if (first.excludedAttempts.length > 0) {
            const warning = text('p', '합산 제외·보류 ' + first.excludedAttempts.length + '건');
            warning.className = 'small-note';
            creditRoot.append(warning);
        }
        const table = document.createElement('table');
        table.setAttribute('aria-labelledby', 'compare-heading');
        const columns = table.createTHead().insertRow();
        appendHeader(columns, '학기', 'col');
        for (const result of results) {
            appendHeader(columns, planLabel(result.scenario), 'col');
        }
        const body = table.createTBody();
        const breakdowns = results.map(result => new Map(provisionalTermBreakdown(result).map(term => [term.term, term])));
        for (const term of new Set(results.flatMap(result => result.terms))) {
            const row = body.insertRow();
            appendHeader(row, term, 'row');
            for (const breakdown of breakdowns) {
                const entry = breakdown.get(term);
                const cell = row.insertCell();
                if (entry) {
                    cell.textContent = creditsText(entry.countedCreditUnits) + ' · ' + entry.countedCourses + '과목';
                    if (entry.excludedCourses) cell.append(text('small', '제외·보류 ' + entry.excludedCourses + '건'));
                } else {
                    cell.textContent = '—';
                    cell.setAttribute('aria-label', '대상 학기 아님');
                }
            }
        }
        const totals = table.createTFoot().insertRow();
        appendHeader(totals, '계획 학점 합계', 'row');
        for (const result of results) totals.insertCell().textContent = creditsText(result.audit.plannedCreditUnits);
        root.append(table);

        const details = document.createElement('details');
        details.className = 'exclusion-details';
        details.append(text('summary', '합산 제외·보류 내역'));
        for (const result of results) {
            const exclusions = explainProvisionalExclusions(result, records);
            if (!exclusions.length) continue;
            details.append(text('h3', planLabel(result.scenario) + ' · ' + exclusions.length + '건'));
            const list = document.createElement('ul');
            for (const excluded of exclusions) {
                const item = document.createElement('li');
                item.append(text('strong', excluded.courseId + ' · ' + excluded.term
                    + ' (' + (excluded.origin === 'record' ? '과목 기록' : '계획 과목') + ')'));
                item.append(text('p', excluded.explanation + ' ' + excluded.nextAction));
                list.append(item);
            }
            details.append(list);
        }
        if (details.childElementCount > 1) root.append(details);
    }
    catch (error) {
        const message = '입력 자료를 계산할 수 없습니다: ' + (error instanceof Error ? error.message : String(error));
        root.append(text('p', message));
        creditRoot.append(text('p', message));
    }
}
get('record-form').addEventListener('submit', event => {
    event.preventDefault();
    try {
        if (records.length >= MAX_COURSES)
            throw new RangeError('최대 60과목까지만 입력할 수 있습니다.');
        const row = normalizeStudentCourse({
            courseId: control('record-course', HTMLInputElement).value,
            credits: Number(control('record-credits', HTMLInputElement).value),
            term: control('record-term', HTMLInputElement).value.trim(),
            slot: control('record-slot', HTMLSelectElement).value,
        });
        const asOf = today();
        const comparisons = comparePlans(asOf, [...records, row]);
        records.push(row);
        control('record-course', HTMLInputElement).value = '';
        renderAll(asOf, comparisons);
        write('record-message', '기록을 추가했습니다.');
    }
    catch (error) {
        write('record-message', error instanceof Error ? error.message : String(error));
    }
});
get('plan-form').addEventListener('submit', event => {
    event.preventDefault();
    const id = selected();
    try {
        if (plans[id].length >= MAX_COURSES)
            throw new RangeError('한 계획에는 최대 60과목까지 입력할 수 있습니다.');
        const row = normalizePlanCourse({
            courseId: control('plan-course', HTMLInputElement).value,
            term: control('plan-term', HTMLSelectElement).value,
            credits: Number(control('plan-credits', HTMLInputElement).value),
        });
        compareProvisionalScenario({ asOf: today(), scenario: id, records, plans: [...plans[id], row] });
        plans[id].push(row);
        control('plan-course', HTMLInputElement).value = '';
        renderAll();
        write('plan-message', '과목을 추가했습니다.');
    }
    catch (error) {
        write('plan-message', error instanceof Error ? error.message : String(error));
    }
});
get('scenario-choice').addEventListener('change', () => {
    renderAll();
    write('plan-message', '');
});
renderAll();
