# Recruitment: Add Candidate Test Plan

## Test data and setup

- **Authentication:** Reuse the existing OrangeHRM login step and its `login` sheet / `validCredentials` key; do not put credentials in this plan or candidate data.
- **Seed:** Use the existing seed setup if it prepares eligible vacancies. `tests/seed.spec.ts` is currently a placeholder, so do not assume it creates one; inspect the available vacancies at runtime.
- **Candidate data:** Keep it in a dedicated `test-data/recruitment_testData.xlsx`, separate from `eCom_testData.xlsx`. Use sheet **`Recruitment`**, key **`addCandidate`** (`testCase` lookup column), and columns **`testCase`, `FirstName`, `LastName`, `Email`, `Vacancy`, `HiringManager`, `ResumePath`**. Generate the candidate name and unique email at runtime for every execution; resolve the vacancy, hiring manager, and PDF path at runtime. Do not store fixed candidate values in Excel.
- Generate a dummy PDF resume for the run, upload it, and keep it within the application's 1 MB PDF limit. Remove the generated file after the run.
- The live dropdown showed 12 vacancy entries; some vacancy records had a deleted hiring manager. Treat current options and manager assignments as dynamic, not fixed test data.

## Scenario: Add a candidate to a vacancy with a hiring manager

**Tag:** `@smoke`  
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
