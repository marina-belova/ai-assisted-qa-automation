# Reliability evaluation

Generated: 2026-11-10. This file is a reading of existing evidence. It is not produced by `.github/workflows/test-generation.yml`. Cursor has no telemetry for these four rates.

A documented event is one run or report that was inspected. A rate needs every item in its denominator classified the same way. One successful self-heal does not establish a self-heal success rate.

## 1. Flake rate

**Definition.** Among executed tests in the last 10 E2E runs, the tests that failed and then passed on a Playwright retry. This is a per-execution rate, not a rate of unique test definitions. `playwright.config.ts` sets `retries` to 2 when `CI` is set, and the CI reporter is `github` plus HTML. Two runs in this cohort overrode that with `--retries=0`.

**Evidence.** `gh run list --workflow "E2E Tests" --limit 10` on 2026-11-10. The ten runs are 42892220004, 42891841355, 42888881070, 42885845702, 42884159973, 42883677176, 42796225157, 42795820862, 42794409778, and 42789175085. Counts come from the check-run annotation titled `🎭 Playwright Run Summary`. Playwright 1.63 prints `N flaky` only when a test has a failed attempt and a later attempt that passed. A finished summary omits an empty flaky line. Workflow success or failure is not that count.

Eight runs finished with a summary. Skipped tests are not executed, so they are not in the denominator.

| Run | Summary | Executed | Flaky |
| --- | --- | --- | --- |
| [42888881070](https://github.com/marina-belova/ai-assisted-qa-automation/actions/runs/42888881070) | 92 passed, 2 skipped | 92 | 0 |
| [42885845702](https://github.com/marina-belova/ai-assisted-qa-automation/actions/runs/42885845702) | 92 passed, 2 skipped | 92 | 0 |
| [42884159973](https://github.com/marina-belova/ai-assisted-qa-automation/actions/runs/42884159973) | 92 passed, 2 skipped | 92 | 0 |
| [42795820862](https://github.com/marina-belova/ai-assisted-qa-automation/actions/runs/42795820862) | 1 failed, 91 passed, 2 skipped | 92 | 0 |
| [42794409778](https://github.com/marina-belova/ai-assisted-qa-automation/actions/runs/42794409778) | 1 flaky, 91 passed, 2 skipped | 92 | 1 |
| [42789175085](https://github.com/marina-belova/ai-assisted-qa-automation/actions/runs/42789175085) | 2 failed, 2 flaky, 88 passed, 2 skipped | 92 | 2 |
| [42891841355](https://github.com/marina-belova/ai-assisted-qa-automation/actions/runs/42891841355) | 1 failed, 1 passed | 2 | 0 |
| [42883677176](https://github.com/marina-belova/ai-assisted-qa-automation/actions/runs/42883677176) | 1 failed, 1 passed | 2 | 0 |

The three flaky executions are the DS-296 test `Create Semester stays disabled when the end date is empty` in run 42794409778, and DS-1 TC-010 and TC-014 in run 42789175085. Run 42794409778 completed successfully, so a green workflow is not a zero-flake result.

Runs 42891841355 and 42883677176 used the controlled-drift command with `--retries=0`. They add four executions and no flakes.

Run 42892220004 failed before any test ran. Run 42796225157 was cancelled at the 30-minute limit, with failed attempts in the log and no completed Playwright summary. Those two runs are outside the 556.

**Calculation.** 3 flaky executions divided by 556 executed tests in the eight finished summaries. 3 / 556 = 0.54%. This is not a rate for all 10 runs.

**Value.** 0.54% (3 / 556).

**Meaning.** In the eight finished runs, 0.54% of executed tests failed and then passed on retry. A green E2E workflow can still contain one of those tests. Run 42794409778 did.

## 2. Self-heal success rate and masked regressions

**Definition.** Healed cleanly means a locator-drift run whose repair rerun passed and `tests/` assertions were unchanged. The rate is those heals divided by drift runs that reached a repair. A job that stops before repair is not a failed repair. A masked regression is a heal that made the rerun pass by weakening or removing an assertion. The target for that count is 0. Repair success is not the workflow job's success.

**Evidence.** The eight Test generation runs listed on 2026-11-10. Counts come from job steps, the verify logs, and the repair commit diffs. Both repairs change one line in `pages/ProgramsPage.ts`, from `'+ New Program drifted'` to `'+ New Program'`. Neither commit touches `tests/`. Both are the controlled Block 14 drift on parent `c00c33f`, not two production incidents.

| Run | Repair outcome |
| --- | --- |
| [42887534846](https://github.com/marina-belova/ai-assisted-qa-automation/actions/runs/42887534846) | Eligible. Rerun reported 2 passed. The commit is `949f849`. The job then failed because GitHub Actions could not create the pull request. [PR #12](https://github.com/marina-belova/ai-assisted-qa-automation/pull/12) was opened later by marina-belova and closed unmerged. |
| [42892004852](https://github.com/marina-belova/ai-assisted-qa-automation/actions/runs/42892004852) | Eligible. Rerun reported 2 passed. The commit is `0c8d31f`. The workflow opened [PR #13](https://github.com/marina-belova/ai-assisted-qa-automation/pull/13), merged into `feature/block14-controlled-locator-drift`, not `main`. |
| [42883831710](https://github.com/marina-belova/ai-assisted-qa-automation/actions/runs/42883831710) | Excluded. `git fetch` failed before triage. No repair started. |
| [42797905495](https://github.com/marina-belova/ai-assisted-qa-automation/actions/runs/42797905495) | Excluded. Same fetch failure, before triage. No repair started. |

Runs [42890770756](https://github.com/marina-belova/ai-assisted-qa-automation/actions/runs/42890770756), [42887734504](https://github.com/marina-belova/ai-assisted-qa-automation/actions/runs/42887734504), [42885737256](https://github.com/marina-belova/ai-assisted-qa-automation/actions/runs/42885737256), and [42800556507](https://github.com/marina-belova/ai-assisted-qa-automation/actions/runs/42800556507) have a self-heal job whose conclusion is `skipped`. Those jobs have no triage or repair step, so they are not repair attempts.

**Calculation.** Clean heals divided by repairs that started: 2 / 2 = 100%. Workflow jobs that recorded a completed heal and opened their own pull request: 1 / 2 = 50%. Masked regressions among the two inspected patches: 0. The two blocked jobs and the four skipped jobs are outside both denominators.

**Value.** Repair success 100% (2 / 2). End-to-end workflow success 50% (1 / 2). Masked-regression count: 0 among the two inspected repairs. The target remains 0.

**Meaning.** Both attempts repaired the same controlled locator. This is not a production reliability rate. A failed workflow can still be a clean repair: run 42887534846 passed the rerun and left `tests/` unchanged, then failed while creating the pull request. The zero masked-regression count covers only those two patches.

## 3. Generation-gate first-PR pass rate

**Definition.** A generated spec passes on its first pull request only when the original revision meets all three conditions: the spec is green, it conforms to the project testing rules, and it maps to the ticket's acceptance criteria. The rate is those pull requests divided by generated pull requests. `.cursor/hooks/generation-gate.sh` checks that a `tests/` edit has `expect()` and does not use `page.locator()`. It does not check Jira acceptance criteria. A hook result is not this rate.

**Evidence.** All eight Test generation runs were `workflow_run` events. The backlog job runs only on a manual dispatch, and that dispatch has not been run. The backlog job has never opened a pull request. Self-heal pull requests #12 and #13 are excluded. Pull requests opened by hand, including #1, #2, and #3, are excluded. Eligible generated pull requests: 0.

**Calculation.** First pull requests that meet all three conditions, divided by generated pull requests. The denominator is 0. That is not 0% and not 100%.

**Value.** NOT MEASURED (N/A).

**Meaning.** There is no generated first pull request to score. A later green commit, a merged pull request, or the generation hook's locator and assertion check is not a first-PR pass.

## 4. Ask-versus-guess

**Definition.** Decisions where the agent asked for a missing value, divided by decisions where it asked or invented one. Invented paths, enums, environment variables, credentials, and messages count as guesses.

**Evidence.** Twenty-one local transcript files, about 2.9 MB, record `role`, `message`, `status`, and `type`. They do not classify a decision as an ask or a guess. No scored agent evaluation log exists. The backlog generation agent has not run. This session was not scored when the decisions were made.

**Calculation.** Asks / (Asks + Guesses). No reliable numerator or denominator was collected. A missing classification is not zero guesses.

**Value.** NOT MEASURED.

**Meaning.** The constitution tells the agent to ask instead of inventing a path, enum, environment variable, credential, or message. These transcripts cannot show whether that happened. A future agent session needs each such decision classified when it is made, or a later manual review of a defined cohort. Do not fill this value in from an unscored chat.

## Top reliability risk

CI retries a failed test twice. In the eight finished E2E runs, 3 of 556 executions passed only on a retry (0.54%). Run 42794409778 was green and still contained one flaky test. The cancelled run 42796225157 is not part of that rate.

## Next action

On the next agent or orchestrator session, classify each decision that lacks a path, enum, environment variable, credential, or message as an ask or a guess when it happens. The rate is Asks / (Asks + Guesses). Do not score a session that has no such record, and do not treat a missing record as zero guesses.

## Limitations

- Workflow conclusions are not flake counts, heal rates, or generation-gate scores.
- The self-heal log lines that print `Status: HEALED` are mostly the shell script, not the result of a run. They were not used as measurements.
- `BLOCK14_SELF_HEAL_REPORT.md` is a narrative of one demonstration. The demonstration branch was not merged into `main`.
- N is 10 for the E2E list that was inspected. The flake rate 0.54% is 3 / 556 from the eight runs with a finished Playwright summary. It does not include the run that failed before any test or the cancelled run.
- No agent session was coded into asks and guesses.

## When to regenerate

Rewrite this file after `.github/workflows/test-generation.yml` finishes, and after a local agent or orchestrator run. The workflow does not update the file. The person or agent doing the rewrite reads the CI logs, pull-request history, and session notes, then replaces a NOT MEASURED value only with a count taken from those sources. Do not carry a previous number forward when the new evidence was not read.
