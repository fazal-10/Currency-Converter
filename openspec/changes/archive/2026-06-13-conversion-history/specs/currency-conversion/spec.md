## MODIFIED Requirements

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
