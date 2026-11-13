# Recruitment: Add Candidate Test Plan

## Test data and setup

- **Authentication:** Reuse the existing OrangeHRM login step and its `login` sheet / `validCredentials` key; do not put credentials in this plan or candidate data.
- **Seed:** Use the existing seed setup if it prepares eligible vacancies. `tests/seed.spec.ts` is currently a placeholder, so do not assume it creates one; inspect the available vacancies at runtime.
- **Candidate data:** Keep it in a dedicated `test-data/recruitment_testData.xlsx`, separate from `eCom_testData.xlsx`. Use sheet **`Recruitment`**, key **`addCandidate`** (`testCase` lookup column), and columns **`testCase`, `FirstName`, `LastName`, `Email`, `Vacancy`, `HiringManager`, `ResumePath`**. Generate the candidate name and unique email at runtime for every execution; resolve the vacancy, hiring manager, and PDF path at runtime. Do not store fixed candidate values in Excel.
- Generate a dummy PDF resume for the run, upload it, and keep it within the application's 1 MB PDF limit. Remove the generated file after the run.
- The live dropdown showed 12 vacancy entries; some vacancy records had a deleted hiring manager. Treat current options and manager assignments as dynamic, not fixed test data.

## Scenario: Add a candidate to a vacancy with a hiring manager

**Tag:** `@recruitment`
**Excel:** `Recruitment` / `addCandidate`  
**Required columns:** `testCase`, `FirstName`, `LastName`, `Email`, `Vacancy`, `HiringManager`, `ResumePath`

**Given** the user is logged in through the existing authentication setup and the Add Candidate form is open  
**When**
1. Generate unique first name, last name, and email values for this execution.
2. Open the Vacancy dropdown and inspect its current options.
3. For each eligible option, verify its corresponding vacancy record has a non-empty, non-deleted Hiring Manager. Select a vacancy only after this check; if none qualify, fail with a clear reason and do not save.
4. Verify the form shows the selected vacancy. Verify the vacancy record maps that same vacancy to the Hiring Manager selected for the run.
5. Generate a dummy PDF resume, upload it, and confirm the filename is shown.
6. Fill First Name, Last Name, and Email with the generated values, then save.

**Then** verify the success notification and find the newly created candidate using the unique email; confirm the candidate record has the selected vacancy. Recheck that vacancy's record to confirm its Hiring Manager association still matches the verified pair.

**Pass criteria:** Candidate creation succeeds with unique generated data and an uploaded PDF; the selected vacancy and its non-deleted Hiring Manager are verified as the same vacancy-manager pair. **Failure criteria:** Required fields or upload fail, save is unsuccessful, the candidate cannot be found, or the selected vacancy has no valid Hiring Manager.

## Candidate application lifecycle extension

Extend this plan with the six application stages below, in order. Preserve the Add Candidate scenario, its test data, authentication, setup, and validations exactly as defined above.

### Design and data requirements

- Before adding lifecycle coverage, inspect the live OrangeHRM workflows and review the current Recruitment feature, step definitions, page objects, fixtures, and test-data utilities. Confirm the available actions, required fields, status choices, and allowed transitions at runtime; do not infer them.
- Follow the existing Playwright BDD and Page Object Model conventions. Reuse the current login flow, fixtures, locators, and helpers where appropriate, and avoid duplicate implementations or unrelated changes to eCommerce and Recruitment automation.
- Track the candidate by its generated unique email rather than a fixed name. In a sequential end-to-end run, carry the candidate created through the Add Candidate workflow across all six stages.
- Keep each stage test independently runnable where practical. Use reusable setup to create a unique candidate and prepare any required preceding state; do not depend solely on scenario order or shared state between tests.
- Resolve vacancies, interviewers, dropdown options, and other environment-dependent values from the live application. Generate candidate and application data, including valid interview dates and times, at runtime. Do not hardcode credentials or environment-specific values.
- Continue using `test-data/recruitment_testData.xlsx` and its `Recruitment` sheet. Keep the existing `addCandidate` key and columns unchanged; extend the workbook only if a required input cannot be generated or selected at runtime.
- Use readable business-focused Gherkin, meaningful tags such as `@regression` and stage-specific tags, and stable locators. Keep feature files, step definitions, page objects, fixtures, and test data in their existing roles.

### Stage scenarios and expected checks

| Order | Scenario | Expected coverage |
| --- | --- | --- |
| 1 | **Edit Application** | Find the candidate by email, update an editable application detail, save, and verify the persisted value. Check that invalid or missing required input is rejected where applicable. |
| 2 | **Shortlist Candidate** | Prepare an eligible candidate, perform the available Shortlist action, and verify the status transition and success notification. Cover an ineligible or invalid action where the UI supports it. |
| 3 | **Schedule Interview** | Select a valid interviewer at runtime, generate a valid date and time, schedule the interview, and verify its saved record (including date and time), candidate-history entry, and status. Check required-field validation. |
| 4 | **Interview Status** | Choose a status offered by the live UI, save the change, and verify it on the interview or candidate record. Cover invalid updates where applicable. |
| 5 | **Offer Job** | Prepare an offer-eligible candidate, use the runtime-generated Notes field exposed by the live Offer Job form, and verify the Job Offered status and candidate-history entry. The inspected form has no other required offer fields; validate any additional required fields only if they are exposed by the live UI. |
| 6 | **Hire** | Prepare a candidate eligible for hiring, complete the available Hire action, and verify the final status is **Hired**. Check that an ineligible or invalid transition is not reported as successful where applicable. |

**Live inspection note:** An earlier Schedule Interview record returned `interview.time: null`; it was not confirmed whether a time was entered during that inspection. The lifecycle test enters a generated time and verifies the saved record rather than inferring persistence from the history text alone.

### Execution and acceptance

- Preserve the lifecycle order and required preceding state. Verify the application status after every major action.
- Assert success notifications where the UI exposes them, plus saved UI records; verify through backend records as well if the existing test setup supports it.
- Include useful failure messages and logs identifying the candidate email, attempted stage, and relevant UI validation details.
- Deliver Gherkin coverage for all six stages, reusable step definitions and page-object methods, any necessary workbook updates, an independent setup/data-sharing approach, applicable positive and negative checks, and execution results with a summary.

**Lifecycle acceptance:** The same uniquely identified candidate completes the ordered stages in an end-to-end run, while stage-focused tests can establish their own prerequisites. Every transition and saved detail is verified against the live application's available workflow.
