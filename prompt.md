# Comprehensive AI Software Engineer Prompt for OH&S Compliance MVP

## Project Overview
Build a web-based OH&S (Occupational Health & Safety) compliance and risk management system for Saskatchewan crown corporations in 9 hours. The system enables workers to submit daily safety forms, uses AI/ML to predict risk levels, and provides dashboards for managers to monitor and prevent workplace incidents.

## Core User Types & Authentication

### User Roles (3 types)
1. **Workers** - Submit daily OH&S forms, view personal risk scores, receive alerts
2. **Managers** - View team/department risk dashboards, manage alerts, approve/block workers
3. **Admins** - System configuration, manage job types, set thresholds, view organization-wide analytics

### Authentication Requirements
- Simple email/password authentication
- Role-based access control (RBAC)
- Different landing pages/views per role
- Session management with logout capability

## Feature Set Breakdown

### 1. Daily OH&S Form Submission System

#### Form Types
**Option A: Standard Pre-built Forms**
- Pre-configured forms based on common Saskatchewan crown corporation hazards
- Fields include:
  - Worker ID/Name
  - Date & Shift Time
  - Location (Site A/B/C)
  - Department (Construction, Maintenance, Logistics, Operations)
  - Hazard Exposures (checkboxes for multiple hazards)
  - Exposure Duration (hours)
  - PPE Used (checklist)
  - Physical Condition Assessment (fatigue level, any symptoms)
  - Incident Report (if applicable)
  - Notes/Comments

**Option B: Custom Form Builder**
- Admin interface to create custom forms
- Drag-and-drop form fields
- Conditional logic (show fields based on previous answers)
- Save form templates per job type

#### Form Submission Flow
1. Worker logs in at shift start
2. Cannot proceed to work until form is completed
3. Form data validates before submission
4. Immediate risk calculation upon submission
5. Block/allow worker based on risk threshold
6. Confirmation screen with risk status

### 2. Job Type & Risk Profiles

#### Saskatchewan Crown Corporation Job Types (Research-Based)

**SaskTel (Telecommunications)**
- Field Technician
  - Hazards: Electrical exposure, heights (pole work), vehicle operation, confined spaces
  - Key metrics: Voltage exposure hours, height work duration, weather conditions
  
**SGI (Insurance/Auto)**
- Claims Adjuster/Inspector
  - Hazards: Vehicle operation, site inspections, repetitive strain
  - Key metrics: Driving hours, site visit frequency, ergonomic strain

**SaskPower (Electrical Utility)**
- Power Line Technician
  - Hazards: High voltage, heights, extreme weather, confined spaces, arc flash
  - Key metrics: Voltage exposure, height duration, weather severity, PPE compliance
  
- Substation Operator
  - Hazards: Electrical, confined spaces, chemical exposure
  - Key metrics: Electrical proximity time, chemical handling frequency

**SaskEnergy (Natural Gas)**
- Gas Fitter/Pipeline Technician
  - Hazards: Gas exposure, excavation, confined spaces, pressure systems
  - Key metrics: Gas concentration exposure, excavation depth/duration, confined space entries

#### Risk Profile Configuration
Each job type should have:
- Predefined hazard categories with severity weights
- Exposure thresholds (daily, weekly, monthly, cumulative)
- Required PPE checklist
- Baseline risk score
- Industry-specific compliance requirements

### 3. AI-Powered Risk Assessment System

#### Two-Tier Risk Analysis

**Tier 1: Rule-Based System (Immediate)**
- Triggers on form submission
- Hard rules for immediate blocking:
  - Single severe incident (e.g., chemical burn, electrical shock)
  - Cumulative exposure exceeds daily threshold
  - Missing required PPE for high-risk tasks
  - Consecutive days of high exposure without rest
  - Physical condition indicators (extreme fatigue, symptoms)

Example Rules:
```
IF exposure_to_high_voltage > 6_hours_today THEN risk = HIGH
IF days_without_break >= 6 AND cumulative_hazard_score > 80 THEN risk = CRITICAL
IF ppe_compliance < 100% AND hazard_severity = HIGH THEN risk = HIGH
IF reported_symptoms IN ['dizziness', 'chest_pain', 'breathing_difficulty'] THEN risk = CRITICAL
```

**Tier 2: ML Predictive Model (Analytical)**
- Runs on historical data provided (Incident_ID dataset)
- Features to analyze:
  - Frequency of exposure to specific hazards
  - Cumulative exposure hours over time windows (7-day, 30-day, 90-day)
  - Incident history correlation (injury type patterns)
  - Days lost trends
  - Root cause patterns
  - Seasonal/temporal patterns
  - Department/location risk factors
  
- Model Output:
  - Risk probability score (0-100)
  - Predicted days to next incident
  - Top contributing risk factors
  - Recommended interventions

- ML Approach:
  - Use gradient boosting (XGBoost/LightGBM) for tabular data
  - Train on provided incident dataset
  - Features: worker history, job type, hazard combinations, temporal patterns
  - Target: Predict high-risk incidents (Severity = High, Days_Lost > 5)

#### Risk Score Calculation
```
Total Risk Score = (Rule_Based_Score × 0.4) + (ML_Prediction_Score × 0.6)

Risk Levels:
- LOW: 0-30
- MEDIUM: 31-60
- HIGH: 61-85
- CRITICAL: 86-100
```

#### Threshold & Blocking System
- **Configurable thresholds** per job type (default: 85 = CRITICAL)
- **Automatic blocking** when threshold exceeded
- **Manager override** capability with justification required
- **Graduated alerts**:
  - 60-70: Yellow warning to worker
  - 71-85: Orange warning to worker + manager notification
  - 86+: Red block + manager + admin notification
  
- **Cooling off period**: Suggest rest days based on risk level

### 4. Risk Dashboard System

#### Worker Dashboard
- **Personal risk score** with trend line (7-day, 30-day)
- **Current status**: Clear to work / Warning / Blocked
- **Exposure summary**: Current shift, this week, this month
- **Alerts history**
- **Recommendations**: Rest suggestions, PPE reminders
- **Form submission history**

#### Manager Dashboard (Job-Type Specific)

Each job type has a customized dashboard showing:

**Overview Panel**
- Team headcount & current work status
- Workers blocked/at risk count
- Active alerts requiring attention
- Incident trends for this job type

**Risk Heatmap**
- Worker risk matrix (name vs. risk level)
- Color-coded: Green (low), Yellow (medium), Orange (high), Red (critical)
- Sortable by risk score, exposure hours, days without incident

**Job-Specific Metrics** (varies by job type)

*For SaskPower Line Technician:*
- Total high-voltage exposure hours (team aggregate)
- Height work incidents
- Weather-related risk days
- Arc flash near-misses

*For SaskEnergy Gas Fitter:*
- Gas concentration exposure events
- Confined space entries this week
- Excavation incident rate
- Pressure system alerts

**Predictive Analytics**
- ML predictions: Workers likely to have incidents in next 7/30 days
- Recommended interventions per worker
- Department-wide risk trends

**Action Center**
- Workers pending approval (override requests)
- Unresolved high-risk alerts
- Corrective actions tracking (from incident data)

#### Admin Dashboard
- **Organization-wide metrics**
- **All job types** risk comparison
- **System configuration**: Thresholds, job types, hazard definitions
- **User management**
- **Historical data analysis**
- **Compliance reporting**
- **ML model performance metrics**

### 5. Alert & Notification System

#### Alert Types
1. **Worker Alerts**
   - Risk level changes
   - Approaching threshold warnings
   - Mandatory rest recommendations
   - PPE compliance reminders

2. **Manager Alerts**
   - Worker blocked from shift
   - Team member reaches HIGH risk
   - Predicted incident warnings (ML-based)
   - Multiple workers at risk (pattern detection)

3. **Admin Alerts**
   - System-wide risk spikes
   - ML model performance issues
   - Compliance threshold breaches

#### Delivery Mechanisms
- **In-app notifications** (priority for MVP)
- **Email alerts** (configurable)
- Dashboard badges/counters
- Alert history log

### 6. Data Management

#### Database Schema (Core Tables)

**users**
- user_id, email, password_hash, role, job_type_id, department, location, created_at

**job_types**
- job_type_id, name, corporation, description, base_risk_score, threshold

**hazards**
- hazard_id, name, severity_weight, category

**job_hazards** (many-to-many)
- job_type_id, hazard_id, is_required_ppe

**daily_forms**
- form_id, user_id, date, shift_time, location, hazards_json, exposure_hours_json, ppe_compliance, physical_condition, notes, submitted_at

**risk_scores**
- score_id, user_id, date, rule_based_score, ml_score, total_score, risk_level, created_at

**incidents** (from provided dataset)
- incident_id, date, location, department, injury_type, root_cause, corrective_action, severity, days_lost

**alerts**
- alert_id, user_id, alert_type, message, severity, is_read, created_at

**worker_blocks**
- block_id, user_id, blocked_date, reason, threshold_score, manager_override, override_reason, resolved_at

#### Data Persistence
- Use PostgreSQL or MySQL for relational data
- Store form data as JSON for flexibility
- Index on user_id, date, risk_level for fast queries
- Retain historical data for ML training

## Technical Stack Recommendations

### Backend
- **Framework**: Flask or FastAPI (Python) for rapid development
- **Database**: PostgreSQL with SQLAlchemy ORM
- **ML**: scikit-learn, XGBoost/LightGBM, pandas
- **Auth**: Flask-Login or JWT tokens

### Frontend
- **Framework**: React or Vue.js (or vanilla JS for speed)
- **UI Library**: Tailwind CSS or Bootstrap for rapid styling
- **Charts**: Chart.js or Recharts for dashboards
- **State Management**: React Context or simple state

### ML Pipeline
- **Data Processing**: pandas, numpy
- **Model**: XGBoost classifier for incident prediction
- **Features**: Automated feature engineering from form data
- **Training**: Load provided incident CSV, train on startup
- **Inference**: Real-time scoring on form submission

### Deployment
- **Containerization**: Docker (optional, if time permits)
- **Database**: PostgreSQL on same server or SQLite for simplicity
- **File Structure**: Modular backend API + frontend SPA

## 9-Hour Development Timeline

### Hour 1-2: Setup & Data Model
- Project scaffolding
- Database schema creation
- Load incident CSV data
- Basic authentication setup

### Hour 3-4: Form System
- Daily form UI (worker view)
- Form submission API
- Basic validation
- Data storage

### Hour 5-6: Risk Engine
- Rule-based risk calculator
- ML model training on incident data
- Risk scoring API
- Threshold checking & blocking logic

### Hour 7-8: Dashboards
- Worker dashboard with personal risk
- Manager dashboard with team view (focus on 1-2 job types)
- Risk visualization charts
- Alert display

### Hour 9: Alerts, Testing & Polish
- Alert generation system
- End-to-end testing (worker submits form → risk calculated → manager sees alert)
- Bug fixes
- Basic admin panel (if time)

## MVP Scope Limitations (9 Hours)

**Include:**
- All 3 user types with authentication
- Daily form submission (use pre-built standard forms)
- Risk calculation (both rule-based + ML)
- Worker dashboard (personal risk)
- Manager dashboard (1-2 job types fully built)
- Basic alerts (in-app notifications)
- Blocking system with threshold
- Data persistence

**Defer Post-MVP:**
- Custom form builder (use standard forms only)
- Email notifications (in-app only)
- Advanced admin configuration UI
- Mobile app (web-responsive only)
- Detailed reporting/exports
- Manager override workflow (can add as simple button)
- All 4 job types dashboards (focus on 2, make others generic)

## Success Criteria

The MVP is complete when:
1. ✅ Worker can log in, submit daily form, see personal risk score
2. ✅ System blocks worker if risk exceeds threshold
3. ✅ Manager can view team dashboard with risk levels
4. ✅ ML model predicts high-risk workers based on historical data
5. ✅ Alerts are generated for high-risk situations
6. ✅ Data persists across sessions
7. ✅ Dashboard shows job-specific risk metrics (at least 1 job type fully)

## Sample Data & Testing

Use the provided incident dataset to:
- Train ML model
- Seed database with historical incidents
- Create test worker profiles with varying risk levels
- Demonstrate dashboard analytics

Create 3 test users:
- Worker: `worker@test.com` (low risk profile)
- Worker: `worker2@test.com` (high risk profile to demonstrate blocking)
- Manager: `manager@test.com` (can see both workers)
- Admin: `admin@test.com`

## Key Implementation Notes

1. **Start with data model** - Getting the schema right saves time later
2. **ML can be simple** - A basic XGBoost model on the provided data is sufficient
3. **Focus on one job type first** - SaskPower Line Technician (most hazardous), then generalize
4. **Hardcode thresholds initially** - Use 85 as default, make it configurable later
5. **Use component libraries** - Don't build charts from scratch
6. **Prioritize working features over polish** - Functional > beautiful for MVP
7. **Mock some alerts** - If time is short, pre-generate some alert scenarios

## Deliverables

1. **Working web application** with all core features
2. **Seeded database** with sample data
3. **README** with setup instructions and test credentials
4. **Brief demo script** showing key workflows

---

This prompt provides your AI software engineer with a complete specification to build a functional MVP in 9 hours. The scope is ambitious but achievable by focusing on core features and using the right tools. Good luck with SaskHack! 🚀