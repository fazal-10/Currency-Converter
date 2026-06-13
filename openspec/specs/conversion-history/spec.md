# conversion-history Specification

## Purpose
TBD - created by archiving change conversion-history. Update Purpose after archive.
## Requirements
### Requirement: Display Recent Conversions
The system SHALL show recent successful conversions below the main calculator.

#### Scenario: History appears after a successful conversion
- **WHEN** the user completes a successful conversion
- **THEN** the system displays a conversion history section below the calculator
- **AND** the newest conversion appears first
- **AND** the entry includes the source amount, source currency, converted amount, target currency, unit rate, and rate date

#### Scenario: No conversions have been recorded
- **WHEN** no successful conversions are available in history
- **THEN** the system displays a compact empty history state

### Requirement: Limit History Size
The system SHALL keep at most 5 recent successful conversions.

#### Scenario: More than five conversions are completed
- **WHEN** the user completes a sixth successful conversion
- **THEN** the system keeps the five newest conversions
- **AND** removes older conversions from the displayed history
- **AND** removes older conversions from persisted history

### Requirement: Persist Conversion History
The system SHALL persist conversion history in browser localStorage.

#### Scenario: History reloads from storage
- **GIVEN** valid conversion history exists in localStorage
- **WHEN** the converter opens
- **THEN** the system loads and displays the saved conversion history

#### Scenario: Storage is unavailable or invalid
- **WHEN** localStorage cannot be read or contains invalid history data
- **THEN** the converter remains usable
- **AND** the system starts with an empty history

### Requirement: Match Existing Theme
The system SHALL render conversion history using visual styles consistent with the existing calculator card.

#### Scenario: History section is rendered
- **WHEN** the conversion history section is visible
- **THEN** it uses the existing card typography, muted text colors, borders, and spacing patterns
- **AND** it remains readable on small screens

