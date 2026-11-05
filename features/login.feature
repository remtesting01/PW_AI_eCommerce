Feature: E-commerce Login

  Background:
    Given User navigates to the E-commerce application

  Scenario: Verify successful login
    When User enters valid login credentials from Excel
    Then User should navigate to the product page

  # @login @negative
  # Scenario Outline: Verify invalid login
  #   When User enters invalid login credentials from Excel for "<testCase>" and click login
  #   Then User should see an error message

  #   Examples:
  #     | testCase        |
  #     | InvalidUsername |
  #     | InvalidPassword |
  #    Scenario: Verify logout
  #   When User logs in successfully and logs out
  #   Then User should return to the login page
