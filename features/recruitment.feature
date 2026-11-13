Feature: Recruitment

  @recruitment
  Scenario: Add a candidate to a vacancy with a hiring manager
    Given the user is logged in to OrangeHRM
    When the user creates a candidate with a vacancy that has a hiring manager
    Then the candidate should be saved with the selected vacancy and hiring manager

  @regression @edit-application
  Scenario: Edit a candidate application
    Given the user is logged in to OrangeHRM
    When the user creates a candidate with a vacancy that has a hiring manager
    Then the candidate should be saved with the selected vacancy and hiring manager
    When the candidate is located by the generated email and prepared for application editing
    When the user updates permitted application details with runtime-generated data
    Then the updated application details should be persisted and visible on the candidate record
    Then invalid or incomplete required details should be rejected without overwriting the saved values where applicable

  @regression @shortlist
  Scenario: Shortlist an eligible candidate
    Given the user is logged in to OrangeHRM
    When the user creates a candidate with a vacancy that has a hiring manager
    Then the candidate should be saved with the selected vacancy and hiring manager
    When the candidate is located by the generated email and prepared for the available Shortlist action
    When the user performs the available Shortlist action
    Then the updated application status and candidate history should confirm the Shortlisted transition
    Then the Shortlist action should no longer be available for the shortlisted candidate

  @regression @schedule-interview
  Scenario: Schedule an interview for a shortlisted candidate
    Given the user is logged in to OrangeHRM
    When the user creates a candidate with a vacancy that has a hiring manager
    Then the candidate should be saved with the selected vacancy and hiring manager
    When the candidate is located by the generated email and prepared for interview scheduling
    When the user schedules an interview with a runtime-selected interviewer and valid future date and time
    Then the saved interview record should contain the interviewer, date, and time, with status Interview Scheduled
    Then incomplete or invalid interview details should be rejected without advancing the application where applicable

  @regression @interview-status
  Scenario: Update the status of a candidate interview
    Given the user is logged in to OrangeHRM
    When the user creates a candidate with a vacancy that has a hiring manager
    Then the candidate should be saved with the selected vacancy and hiring manager
    When the candidate is located by the generated email and prepared with a scheduled interview
    When the user updates the interview to a status available in the application
    Then the saved interview status and application history should reflect the update
    Then the Mark Interview Passed action should no longer be available after the status update

  @regression @offer-job
  Scenario: Make a job offer to an eligible candidate
    Given the user is logged in to OrangeHRM
    When the user creates a candidate with a vacancy that has a hiring manager
    Then the candidate should be saved with the selected vacancy and hiring manager
    When the candidate is located by the generated email and prepared for the available Offer Job action
    When the user submits a runtime-generated offer note through the available Offer Job action
    Then the offer history entry and Job Offered status should be verified
    Then the Offer Job action should no longer be available after the offer is recorded

  # @regression @hire
  # Scenario: Hire an eligible candidate
  #   Given the user is logged in to OrangeHRM
  #   When the user creates a candidate with a vacancy that has a hiring manager
  #   Then the candidate should be saved with the selected vacancy and hiring manager
  #   When the candidate is located by the generated email and prepared for the available Hire action
  #   When the user completes the hiring action
  #   Then the candidate history and final Hired application status should be verified
  #   Then the Hire action should no longer be available after the Hired status is saved

  # @smoke @application-lifecycle
  # Scenario: Complete the candidate application lifecycle
  #   Given the user is logged in to OrangeHRM
  #   When the user creates a candidate with a vacancy that has a hiring manager
  #   Then the candidate should be saved with the selected vacancy and hiring manager
  #   When the candidate is located by the generated email and prepared for application editing
  #   When the user updates permitted application details with runtime-generated data
  #   Then the updated application details should be persisted and visible on the candidate record
  #   Then invalid or incomplete required details should be rejected without overwriting the saved values where applicable
  #   When the candidate is located by the generated email and prepared for the available Shortlist action
  #   When the user performs the available Shortlist action
  #   Then the updated application status and candidate history should confirm the Shortlisted transition
  #   Then the Shortlist action should no longer be available for the shortlisted candidate
  #   When the candidate is located by the generated email and prepared for interview scheduling
  #   When the user schedules an interview with a runtime-selected interviewer and valid future date and time
  #   Then the saved interview record should contain the interviewer, date, and time, with status Interview Scheduled
  #   Then incomplete or invalid interview details should be rejected without advancing the application where applicable
  #   When the candidate is located by the generated email and prepared with a scheduled interview
  #   When the user updates the interview to a status available in the application
  #   Then the saved interview status and application history should reflect the update
  #   Then the Mark Interview Passed action should no longer be available after the status update
  #   When the candidate is located by the generated email and prepared for the available Offer Job action
  #   When the user submits a runtime-generated offer note through the available Offer Job action
  #   Then the offer history entry and Job Offered status should be verified
  #   Then the Offer Job action should no longer be available after the offer is recorded
  #   When the candidate is located by the generated email and prepared for the available Hire action
  #   When the user completes the hiring action
  #   Then the candidate history and final Hired application status should be verified
  #   Then the Hire action should no longer be available after the Hired status is saved
