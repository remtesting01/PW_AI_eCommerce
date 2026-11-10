@dashboard
Feature: Dashboard

  Background:
    Given User navigates to the E-commerce application
    When User enters valid login credentials from Excel

  @smoke
  Scenario: Dashboard page loads after login
    Given the user is on the Dashboard page
    When the user checks the page URL against the "dashboardLoad" Excel record
    Then the visible heading matches expectedHeading from the "dashboardLoad" Excel record

  # @smoke
  # Scenario: Dashboard widgets are visible
  #   Given the user is on the Dashboard page
  #   When the user views the dashboard widgets
  #   Then every widget listed in expectedWidgets from the "widgets" Excel record is visible

  # @regression
  # Scenario: Left menu shows all main menu items
  #   Given the user is on the Dashboard page
  #   When the user views the left-side menu
  #   Then every item listed in expectedMenuItems from the "sideMenu" Excel record is visible
