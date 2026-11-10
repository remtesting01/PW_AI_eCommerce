Feature: Recruitment

  Scenario: Add a candidate from the Recruitment test data
    Given the user is logged in to OrangeHRM
    When the user adds a candidate using the Recruitment test data and saves
    Then the candidate should be saved successfully
