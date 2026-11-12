Feature: Recruitment

  @recruitment
  Scenario: Add a candidate to a vacancy with a hiring manager
    Given the user is logged in to OrangeHRM
    When the user creates a candidate with a vacancy that has a hiring manager
    Then the candidate should be saved with the selected vacancy and hiring manager
