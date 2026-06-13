# Currency Conversion Specification

## Purpose

Define the expected behavior for the currency converter UI, including live currency loading, amount validation, exchange-rate conversion, currency selection, and user-facing result states.
## Requirements
### Requirement: Load Supported Currencies
The system SHALL load supported currencies from the Frankfurter `/currencies` endpoint and expose them as sorted selectable options.

#### Scenario: Currency list loads successfully
- **WHEN** the converter opens
- **THEN** the system fetches supported currencies
- **AND** displays each currency by code with a generated flag when available
- **AND** sorts the currency options by code

#### Scenario: Currency list fails to load
- **WHEN** the currency request fails
- **THEN** the system shows a user-facing currency loading error
- **AND** prevents currency selection while no options are available

### Requirement: Validate Amount Input
The system SHALL only accept empty input or numeric decimal input with at most 12 digits before the decimal point.

#### Scenario: Empty amount
- **WHEN** the user clears the amount field
- **THEN** the system clears any prior conversion result

#### Scenario: Missing amount on submit
- **WHEN** the user submits without an amount
- **THEN** the system shows an error asking for an amount
- **AND** does not request a conversion

#### Scenario: Non-positive amount on submit
- **WHEN** the user submits an amount that is not greater than zero
- **THEN** the system shows an error asking for a valid positive amount
- **AND** does not request a conversion

### Requirement: Convert Amounts
The system SHALL request a live conversion from Frankfurter for valid submissions, show the converted amount, unit rate, and rate date, and capture successful conversions in history.

#### Scenario: Successful conversion
- **WHEN** the user submits a valid amount with different source and target currencies
- **THEN** the system requests `/latest` with the amount, source currency, and target currency
- **AND** displays the formatted conversion result
- **AND** displays the per-unit exchange rate and returned date
- **AND** records the successful conversion in history

#### Scenario: Conversion fails
- **WHEN** the conversion request fails or the requested target rate is missing
- **THEN** the system clears the conversion result
- **AND** shows a user-facing conversion error
- **AND** does not record a history entry

### Requirement: Keep Source and Target Currencies Distinct
The system SHALL prevent the source and target currency selections from being the same.

#### Scenario: User chooses the current target as source
- **WHEN** the user changes the source currency to the current target currency
- **THEN** the system chooses a different target currency
- **AND** clears any prior conversion result

#### Scenario: User chooses the current source as target
- **WHEN** the user changes the target currency to the current source currency
- **THEN** the system chooses a different source currency
- **AND** clears any prior conversion result

### Requirement: Swap Currencies
The system SHALL allow the user to swap the source and target currencies.

#### Scenario: Swap action
- **WHEN** the user activates swap
- **THEN** the source currency becomes the previous target currency
- **AND** the target currency becomes the previous source currency
- **AND** any prior conversion result or error is cleared

### Requirement: Clear Stale Results
The system SHALL clear previous conversion output whenever user input changes in a way that invalidates the displayed result.

#### Scenario: Amount or currency changes after conversion
- **GIVEN** a conversion result is displayed
- **WHEN** the user changes the amount, source currency, target currency, or swaps currencies
- **THEN** the system removes the stale result until a new conversion succeeds

