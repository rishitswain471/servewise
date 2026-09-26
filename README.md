# ServeWise

## Food-Service Demand & Surplus Management Platform

ServeWise is a full-stack food-service operations platform designed to help kitchens plan demand, manage daily food preparation, identify potential surplus, verify surplus through a structured safety workflow, coordinate redistribution with recipient organizations, and measure the resulting impact.

The platform connects operational history with demand planning and post-service outcomes to create a continuous operational workflow:

**Operational Data → Demand Planning → Service Day → Surplus Detection → Safety Verification → Recipient Coordination → Redistribution → Impact → ServeWise Copilot**

ServeWise is designed as an operational decision-support platform. Deterministic application logic remains responsible for calculations and workflow decisions, while AI is used to interpret and explain verified information.

---

## 🚀 Live Demo

👉 [**Launch ServeWise**](https://servewisee.lovable.app)

---

## The Problem

Food-service organizations often have to make daily preparation decisions with incomplete or fragmented information.

This can make it difficult to:

- Estimate how much food will actually be required.
- Account for changing attendance.
- Understand historical consumption patterns.
- Avoid unnecessary over-preparation.
- Avoid under-preparation.
- Compare planned quantities with actual consumption.
- Identify potential surplus after service.
- Determine whether surplus can proceed through an internal safety workflow.
- Find suitable recipient organizations for eligible surplus.
- Coordinate pickup and receipt.
- Measure how much food was actually redistributed.

Operational information is often separated across spreadsheets, manual records, and day-to-day processes.

As a result, the organization may know that surplus occurred but lack a structured workflow for understanding **why it happened, whether it can proceed through the configured safety process, where it can go, and what impact the redistribution created.**

---

## Our Solution

ServeWise connects the complete food-service operational lifecycle into one platform.

The system follows:

**Operational Data → Demand Forecast → Preparation Recommendation → Service Day → Potential Surplus → Safety Gate → Recipient Matching → Redistribution → Impact → Copilot**

Instead of treating forecasting, service operations, surplus management and redistribution as separate systems, ServeWise connects them through persisted operational data.

The objective is to help food-service operators move from:

**Reactive Operations → Data-Informed Planning → Structured Surplus Management → Measurable Impact**

---

# Key Features

## 1. Operational Data Foundation

ServeWise provides a structured operational record for each food-service event.

The system captures information such as:

- Service date
- Meal
- Menu
- Expected attendance
- Actual attendance
- Prepared quantity
- Consumed quantity
- Operational notes

Each record represents the operational history of a specific service.

Users can:

- Add operational records.
- Review historical records.
- Edit existing records.
- Correct inaccurate information.
- Delete records where authorized.
- Filter historical data.
- Persist operational information securely.

The operational record becomes the foundation for later demand planning and service-day analysis.

### Excel / Bulk Data Workflow

ServeWise also supports the existing Excel-based operational data workflow where implemented.

The workflow is designed for loading structured historical service information while maintaining validation and organization-level data isolation.

The Excel workflow uses **ExcelJS** for spreadsheet processing where implemented.

---

## 2. Demand Forecast & Preparation Recommendation

ServeWise uses historical operational data to estimate future demand.

The forecasting engine is deterministic rather than dependent on an AI model.

The system can use:

- Historical consumption
- Comparable service records
- Actual attendance
- Expected attendance
- Attendance-normalized consumption
- Recency weighting
- Historical variability
- Outlier handling
- Available historical record count

A simplified conceptual model is:

**Consumption per Attendee = Historical Consumed Quantity / Historical Actual Attendance**

The historical consumption rate is then applied to the expected attendance for the target service.

The system produces:

- Forecast demand
- Recommended preparation quantity
- Forecast basis
- Historical record count
- Limited-history indication where applicable

The Demand Lab also supports live attendance what-if analysis where implemented.

Changing the expected attendance allows the operator to see how the forecast and preparation recommendation respond without modifying the underlying historical operational data.

### Deterministic Planning

ServeWise keeps the forecasting engine separate from the AI layer.

**ServeWise Engine = Calculate + Determine**

**AI = Interpret + Explain**

Gemini does not become the source of truth for demand forecasts or preparation quantities.

---

## 3. Today's Kitchen & Service Day

Today's Kitchen provides an operational view of the current day's service activity.

The dashboard connects existing ServeWise data rather than displaying static or fabricated operational values.

Depending on the current service state, the operator can see information such as:

- Today's services
- Expected attendance
- Demand forecast
- Recommended preparation
- Actual preparation
- Actual attendance
- Actual consumption
- Potential surplus
- Current redistribution status

The Service Day workflow connects planning with what actually happened during the service.

The operator records the real:

- Prepared quantity
- Attendance
- Consumed quantity

This allows ServeWise to compare planning assumptions with actual service outcomes.

---

## 4. Potential Surplus Detection

After service, ServeWise compares actual preparation with actual consumption.

Conceptually:

**Potential Surplus = Actual Prepared Quantity − Actual Consumed Quantity**

When the result is positive, the system can identify a potential surplus.

This distinction is important:

> **Potential surplus is not automatically considered safe surplus.**

A detected surplus must still pass through the configured Safety Gate before it can proceed into the redistribution workflow.

This keeps operational calculation separate from safety verification.

---

## 5. Safety Gate

ServeWise provides a structured Safety Gate for surplus verification.

The workflow uses configured operational information such as:

- Holding time
- Holding method
- Temperature
- Handling/storage information
- Verification information
- Review status

The Safety Gate produces an explicit operational status that determines whether a surplus batch can continue through the configured redistribution workflow.

The process is deterministic and explainable.

The Safety Gate is not an AI decision system.

Configured safety values should be interpreted according to the organization's applicable food-safety procedures and regulations rather than treated as universal certification.

---

## 6. Recipient Matching

Once surplus passes the required safety workflow, ServeWise can coordinate it with eligible recipient organizations.

Recipient information can include:

- Service area
- Pickup capacity
- Pickup availability
- Pickup window
- Accepted food types
- Preferences
- Current acceptance status
- Pickup contact information

Matching is based on explicit operational criteria such as:

**Availability + Capacity + Food Type + Service Area + Pickup Window**

The matching process is deterministic and explainable.

AI is not responsible for deciding whether a recipient is eligible.

---

## 7. Surplus Redistribution Workflow

ServeWise connects kitchens and recipient organizations through an explicit redistribution workflow.

The process is:

**Eligible Surplus → Offer → NGO Review → Accept / Decline → Pickup → Receipt**

A recipient organization only receives surplus information that has been explicitly authorized through the redistribution workflow.

The system maintains the status of the redistribution process.

The workflow can progress through stages such as:

**Safety Approved → Available for Offer → Offer Sent → Accepted → Pickup Scheduled → Picked Up → Received → Completed**

Alternative states such as blocked or declined are handled separately.

Quantity integrity is maintained throughout the workflow so that the amount offered cannot exceed the available surplus.

---

## 8. Impact & Analytics

ServeWise converts completed operational and redistribution activity into measurable analytics.

The Impact module can provide information such as:

- Food redistributed
- Services completed
- Surplus identified
- Surplus redistributed
- Redistribution rate
- Forecast vs Actual
- Prepared vs Consumed
- Redistribution funnel
- Recipient summaries
- Time-based analysis
- Meal-level analysis

Completed redistribution is based on confirmed receipt rather than merely creating an offer.

This prevents pending or declined offers from being incorrectly counted as successfully redistributed food.

### Impact Assumptions

Where configured, ServeWise can use organization-level assumptions to estimate additional impact metrics.

Estimated metrics are clearly distinguished from directly measured operational quantities.

This allows the platform to maintain transparency around how impact figures are derived.

---

## 9. ServeWise Copilot

ServeWise Copilot provides a natural-language interface for understanding verified ServeWise information.

Users can ask questions about:

- Operational performance
- Historical consumption
- Demand forecasts
- Preparation recommendations
- Forecast vs actual results
- Potential surplus
- Safety status
- Redistribution
- Impact
- Operational trends

The architecture follows:

**User Question**

↓

**Authenticated ServeWise Backend**

↓

**Verified / Minimized ServeWise Context**

↓

**Gemini**

↓

**Explanation**

↓

**User**

### AI Design Principle

ServeWise follows a strict separation between business logic and AI.

**ServeWise Systems = Calculate + Determine**

**Copilot = Interpret + Explain**

Gemini does not independently calculate authoritative:

- Demand forecasts
- Preparation quantities
- Surplus quantities
- Safety eligibility
- Recipient eligibility
- Redistribution impact

Instead, the application retrieves verified information and provides the relevant context to Gemini for explanation.

### Secure AI Integration

The Gemini API key is stored server-side using:

`GEMINI_API_KEY`

The key is not intended to be exposed through:

- Frontend code
- Browser-visible configuration
- Logs
- Database records
- Saved chat data

Copilot also uses minimized context rather than sending unnecessary application or organizational data to the AI service.

If Gemini becomes temporarily unavailable, the core ServeWise application remains functional.

---

# Working Methodology

ServeWise follows a continuous operational loop:

1. The kitchen records operational service information.
2. Historical records accumulate over time.
3. Historical data is used for demand planning.
4. ServeWise generates a deterministic demand forecast.
5. A preparation recommendation is produced.
6. The kitchen conducts the service.
7. Actual attendance, preparation and consumption are recorded.
8. Potential surplus is calculated.
9. Potential surplus enters the Safety Gate.
10. Eligible surplus becomes available for recipient coordination.
11. Recipient organizations can review and respond to offers.
12. Pickup is coordinated.
13. Receipt confirms completed redistribution.
14. Impact metrics are updated.
15. ServeWise Copilot can explain the verified operational information.

This creates a continuous loop:

**Plan → Prepare → Serve → Measure → Rescue → Redistribute → Learn**

---

# Technology Stack

## Frontend

- React
- TypeScript
- Vite
- Responsive web interface

## Backend & Cloud

- Lovable Cloud
- Server-side application functions
- Authenticated backend operations

## Database

- PostgreSQL
- Organization-scoped data
- Row Level Security / database authorization where implemented

## Authentication

- Email & password authentication
- Google authentication
- Persistent sessions
- Protected routes

## AI

- Google Gemini API
- Server-side `GEMINI_API_KEY`

## Data Processing

- ExcelJS
- Structured Excel data processing and validation

## Security

- Authentication
- Authorization
- Organization-level data isolation
- Server-side secrets
- Database security policies
- Input validation
- Safe error handling
- Minimized AI context

---

# Security & Privacy

ServeWise is designed around secure, organization-scoped handling of operational food-service data.

The platform incorporates:

- Authentication
- Authorization
- Protected application routes
- Organization-level data isolation
- Server-side organization resolution
- Database-level security controls
- Input validation
- Controlled workflow transitions
- Secure API secrets
- Protected Gemini API credentials
- Minimized AI context
- Kitchen / NGO separation

Operational data belongs to its authorized organization.

Kitchen organizations cannot freely access another kitchen's operational information, while NGOs only receive information explicitly exposed through the surplus redistribution workflow.

The Gemini API key is kept server-side and is not exposed through frontend code, browser-visible configuration, logs, or persisted chat data.

---

# Explainable Decision Support

ServeWise is designed around transparency and human control.

The platform does not rely on AI to independently determine operational outcomes.

Instead, ServeWise:

- Uses deterministic logic for demand forecasting.
- Provides preparation recommendations from verified operational data.
- Separates planned values from actual service outcomes.
- Calculates potential surplus from actual preparation and consumption.
- Applies configured safety-gate rules.
- Uses explicit criteria for recipient matching.
- Uses confirmed receipt for completed redistribution impact.
- Allows operators to review and correct operational information.
- Uses Gemini to interpret and explain verified ServeWise information.

The core principle is:

**ServeWise Engine = Calculate + Determine**

**ServeWise Copilot = Interpret + Explain**

This keeps the important operational decisions transparent and traceable while allowing users to interact with the platform using natural language.

---

# Responsive User Experience

ServeWise is designed for:

- Desktop
- Tablet
- Mobile

The interface adapts operational dashboards, forms, cards, tables and navigation to different screen sizes.

The application also includes appropriate:

- Loading states
- Empty states
- Error states
- Validation feedback
- Responsive navigation
- Session persistence
- Session-based Copilot conversation

The application has been tested across desktop, tablet and mobile layouts to identify and resolve responsive issues.

---

# SEO & Public Discoverability

ServeWise includes SEO and public-discoverability configuration for the public-facing application.

This includes, where implemented:

- Page titles
- Meta descriptions
- Public landing-page metadata
- Robots configuration
- Sitemap
- Search-engine visibility controls

Private application routes are separated from the public-facing experience.

SEO configuration improves discoverability but does not guarantee search-engine ranking or indexing.

---

# Prototype Status

**Working Full-Stack Platform**

ServeWise demonstrates a connected operational workflow rather than an isolated collection of features.

The implemented system connects:

**Data → Planning → Service → Surplus → Safety → Redistribution → Impact → AI Explanation**

The platform includes:

- Authentication
- Organization management
- Operational data management
- Excel-based data processing
- Deterministic demand planning
- Preparation recommendations
- Service-day operations
- Surplus management
- Safety verification
- Recipient coordination
- Pickup and receipt tracking
- Impact analytics
- Gemini-powered Copilot
- Responsive web interface
- Organization-level security

The application has undergone functional, responsive, security and reliability auditing during development.

---

# Impact

ServeWise is designed to help food-service organizations:

- Improve demand visibility.
- Make more informed preparation decisions.
- Understand actual food consumption.
- Identify potential surplus.
- Structure surplus safety verification.
- Coordinate eligible surplus with recipient organizations.
- Track confirmed redistribution.
- Measure operational impact.
- Build a continuous feedback loop between planning and actual outcomes.

The broader objective is to turn food-service surplus from an isolated end-of-service problem into a structured operational workflow.

---

# Scalability & Future Scope

ServeWise can be extended as additional operational data sources and integrations become available.

Potential future directions include:

- POS integrations
- Attendance-system integrations
- Automated operational data ingestion
- IoT / temperature-monitoring integrations
- Larger historical datasets
- Advanced forecasting models
- Expanded recipient networks
- Enterprise food-service integrations
- Additional operational analytics

These are future possibilities and are not presented as current functionality unless implemented.

---

# Important Product Principle

ServeWise is built around:

**Transparency + Deterministic Logic + Human Control**

The platform helps operators understand:

- What happened?
- What is likely to happen?
- How much should be prepared?
- What actually happened during service?
- How much potential surplus exists?
- What happens during the safety-verification process?
- Which recipient organizations may be suitable?
- Was the surplus actually received?
- What impact was created?

The system provides the data, calculations, workflows and explanations required for informed operational decisions.

The responsible human operator remains in control.

---

# Disclaimer

ServeWise is a food-service planning, surplus-management and decision-support platform.

It does not:

- Guarantee food safety.
- Replace applicable food-safety regulations.
- Replace qualified food-safety professionals.
- Guarantee demand forecasts.
- Guarantee redistribution outcomes.
- Replace operational judgement.
- Use AI as the authoritative source for deterministic business decisions.

Forecasts are estimates based on available operational data.

Impact metrics may include estimates where configurable assumptions are used.

Safety workflows represent configured operational rules and should be validated against the applicable requirements of the organization and jurisdiction.

---

# Project Status

**ServeWise — Working Full-Stack Platform**

**Operational Data → Demand Planning → Service Day → Surplus → Safety → Redistribution → Impact → Copilot**

ServeWise brings food-service planning, operational tracking, surplus management and redistribution coordination into a single connected workflow.

> **From preparation to redistribution — ServeWise turns food-service data into smarter operations and measurable impact.**
