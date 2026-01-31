# Updated Comprehensive AI Software Engineer Prompt for OH&S Compliance MVP

## Project Overview
Build a web-based OH&S (Occupational Health & Safety) compliance and risk management system for Saskatchewan crown corporations in 9 hours. The system enables workers to submit daily safety forms, uses AI/ML to predict risk levels based on cumulative exposure patterns, and provides dashboards for managers to monitor and prevent workplace incidents.

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

#### Pre-built Standard Forms (Use This for MVP)
Pre-configured forms based on Saskatchewan crown corporation hazards with the following fields:

**Basic Information:**
- Worker ID/Name (auto-populated from login)
- Date & Shift Time (auto-populated)
- Location (dropdown: Site A, Site B, Site C)
- Department (auto-populated from worker profile)

**Shift Details:**
- Shift Duration (dropdown: 8, 10, 12 hours)
- Time of Day (dropdown: Day, Evening, Night)
- Days Worked Consecutively (auto-calculated from history)

**Hazard Exposure Tracking:**
For each applicable hazard (based on job type), track:
- Exposure Duration (hours) - numeric input
- Severity Level (dropdown: Low, Medium, High)

**Job-Specific Hazards by Type:**
- **SaskPower Line Technician**: High voltage, Heights, Weather exposure, Arc flash risk
- **SaskPower Substation Operator**: Electrical proximity, Confined spaces, Chemical exposure
- **SaskEnergy Gas Fitter**: Gas exposure, Confined space, Excavation, Pressure systems
- **SaskEnergy Pipeline Tech**: Gas concentration, Excavation, Pipeline pressure
- **SaskTel Field Tech**: Electrical, Heights, Vehicle operation, Weather exposure
- **SGI Claims Inspector**: Vehicle operation, Site hazards, Repetitive strain

**Safety Compliance:**
- PPE Used (checklist based on job requirements)
- PPE Compliance Rate (auto-calculated: items checked / items required)
- Required PPE checklist (dynamically generated based on job type and hazards)

**Physical Condition:**
- Fatigue Level (slider: 1=Fresh to 5=Exhausted)
- Reported Symptoms (multi-select: None, Dizziness, Headache, Breathing difficulty, Chest pain, Muscle pain, Other)
- Hours of Sleep Last Night (numeric)

**Incident Reporting (if applicable):**
- Any Incidents Today? (Yes/No toggle)
- If Yes:
  - Incident Type (dropdown: Near miss, Minor injury, Equipment failure, Other)
  - Description (text area)
  - Immediate Actions Taken (text area)

**Notes/Comments:**
- Additional observations (optional text area)

#### Form Submission Flow
1. Worker logs in at shift start
2. System checks if form already submitted today - if yes, block duplicate submission
3. Cannot proceed to work until form is completed and validated
4. Form validates required fields before submission
5. **Immediate risk calculation upon submission** using both rule-based and ML models
6. Display risk status to worker (Green/Yellow/Orange/Red)
7. If risk score ≥ 85 (CRITICAL), worker is blocked from working
8. Confirmation screen shows:
   - Current risk score
   - Work status (Cleared/Warning/Blocked)
   - Trending risk (7-day and 30-day averages)
   - Recommendations (e.g., "Take a rest day", "Reduce high-voltage exposure")

### 2. Job Type & Risk Profiles

#### Saskatchewan Crown Corporation Job Types

**SaskPower (Electrical Utility)**
- **Power Line Technician**
  - Hazards: High voltage exposure, Heights (pole work), Extreme weather, Arc flash, Vehicle operation
  - High-risk thresholds:
    - High voltage > 6 hours/day
    - Height work > 4 hours/day
    - Working in extreme weather (temp < -20°C or > 35°C)
  - Required PPE: Arc flash suit, Insulated gloves, Hard hat, Safety harness, Steel-toed boots
  - Baseline risk score: 35
  - Critical threshold: 85

- **Substation Operator**
  - Hazards: Electrical proximity, Confined spaces, Chemical exposure (SF6 gas, oil)
  - High-risk thresholds:
    - Electrical work > 5 hours/day
    - Confined space entry > 2 hours/day
  - Required PPE: Electrical gloves, Respirator (when needed), Safety glasses, Hard hat
  - Baseline risk score: 30
  - Critical threshold: 85

**SaskEnergy (Natural Gas)**
- **Gas Fitter**
  - Hazards: Natural gas exposure, Confined spaces, Excavation, Pressure systems
  - High-risk thresholds:
    - Gas exposure events > 3/day
    - Confined space > 2 hours/day
    - Excavation depth > 6 feet
  - Required PPE: Gas monitor, Respirator, Hard hat, Steel-toed boots, High-vis vest
  - Baseline risk score: 40
  - Critical threshold: 85

- **Pipeline Technician**
  - Hazards: Gas exposure, Excavation, Pipeline pressure, Heavy equipment operation
  - High-risk thresholds:
    - Pipeline pressure work > 4 hours/day
    - Excavation > 3 hours/day
  - Required PPE: Gas monitor, Hard hat, Steel-toed boots, Gloves, Safety glasses
  - Baseline risk score: 38
  - Critical threshold: 85

**SaskTel (Telecommunications)**
- **Field Technician**
  - Hazards: Electrical exposure (lower voltage), Heights (pole/tower work), Vehicle operation, Weather exposure, Confined spaces
  - High-risk thresholds:
    - Electrical work > 5 hours/day
    - Height work > 4 hours/day
    - Driving > 6 hours/day
  - Required PPE: Insulated gloves, Safety harness, Hard hat, High-vis vest
  - Baseline risk score: 25
  - Critical threshold: 85

**SGI (Insurance)**
- **Claims Adjuster/Inspector**
  - Hazards: Vehicle operation, Site inspection hazards, Repetitive strain (computer work), Weather exposure
  - High-risk thresholds:
    - Driving > 7 hours/day
    - Site visits in hazardous conditions
  - Required PPE: Safety vest (during site visits), Steel-toed boots (when inspecting damage)
  - Baseline risk score: 15
  - Critical threshold: 80 (lower threshold due to lower baseline risk)

#### Risk Profile Configuration
Each job type has:
- **Predefined hazard categories** with severity weights (stored in database)
- **Exposure thresholds** (daily, 7-day rolling, 30-day rolling)
- **Required PPE checklist** (dynamically shown on form)
- **Baseline risk score** (starting point for calculations)
- **Industry-specific compliance requirements**

### 3. AI-Powered Risk Assessment System

#### Two-Tier Risk Analysis Architecture

**Tier 1: Rule-Based System (Immediate Decision Engine)**

Triggers on every form submission for instant blocking decisions:

```python
# Pseudo-code for rule-based engine

def calculate_rule_based_risk(form_data, worker_history):
    risk_score = worker.baseline_risk_score
    alerts = []
    
    # IMMEDIATE CRITICAL TRIGGERS (Auto-block)
    if form_data.symptoms in ['chest_pain', 'breathing_difficulty', 'severe_dizziness']:
        return 100, ["CRITICAL: Medical symptoms reported - seek medical attention"]
    
    if form_data.fatigue_level >= 4 and form_data.shift_duration >= 10:
        risk_score += 25
        alerts.append("HIGH: Extreme fatigue on long shift")
    
    if form_data.ppe_compliance < 0.8 and has_high_severity_hazards(form_data):
        risk_score += 20
        alerts.append("HIGH: PPE non-compliance with high-risk hazards")
    
    # SHIFT DURATION IMPACT
    if form_data.shift_duration > 10:
        risk_score += 10
        alerts.append("Extended shift increases risk")
    
    if form_data.days_worked_consecutively >= 6:
        risk_score += 15
        alerts.append("Six consecutive days without rest")
    
    # HAZARD-SPECIFIC RULES (job-dependent)
    for hazard in form_data.hazards:
        threshold = get_threshold_for_hazard(worker.job_type, hazard.type)
        if hazard.hours > threshold:
            risk_score += hazard.severity_weight * (hazard.hours - threshold)
            alerts.append(f"Exceeded safe threshold for {hazard.type}")
    
    # CUMULATIVE EXPOSURE (from 7-day history)
    week_exposure = get_7day_exposure(worker_id, hazard_type)
    if week_exposure > weekly_threshold:
        risk_score += 15
        alerts.append("Cumulative weekly exposure too high")
    
    # TIME-BASED PATTERNS
    if form_data.time_of_day == 'Night' and form_data.fatigue_level >= 3:
        risk_score += 10
        alerts.append("Night shift with fatigue")
    
    return min(100, risk_score), alerts
```

**Hard Rules for Immediate Blocking (Risk = 100):**
- Severe medical symptoms reported (chest pain, breathing difficulty)
- Critical incident occurred today
- PPE compliance < 60% with HIGH severity hazards
- 7+ consecutive days without rest
- Single-day hazard exposure > 200% of safe threshold

**Tier 2: ML Predictive Model (Risk Forecasting)**

Uses historical data to predict incident probability in next 7 days.

**Training Data Structure:**

You'll need to generate synthetic training data (see data generation script below). The model requires:

```python
# Features for ML model
features = [
    # Worker characteristics
    'age',
    'years_experience',
    'baseline_risk_score',
    
    # Current shift data
    'shift_duration',
    'fatigue_level',
    'ppe_compliance_rate',
    'total_hazard_exposure_hours',  # Sum of all hazard hours today
    
    # Temporal features
    'day_of_week',
    'days_worked_consecutively',
    'hours_since_last_rest',
    
    # Rolling window features (calculate from history)
    'avg_daily_risk_7d',       # Average risk score last 7 days
    'avg_daily_risk_30d',      # Average risk score last 30 days
    'max_risk_7d',             # Highest risk day in last 7 days
    'cumulative_hazard_hours_7d',  # Total hazard exposure last 7 days
    'cumulative_hazard_hours_30d', # Total hazard exposure last 30 days
    'consecutive_high_risk_days',  # Days in a row with risk > 60
    'ppe_compliance_avg_7d',   # Average PPE compliance last 7 days
    
    # Incident history
    'incidents_last_90d',      # Number of incidents in last 90 days
    'days_since_last_incident',
    
    # Job-specific
    'job_type_encoded',        # One-hot encoded job categories
]

# Target variable
target = 'incident_next_7d'  # Binary: Will have incident in next 7 days? (0/1)
```

**ML Model Architecture:**

```python
from xgboost import XGBClassifier

model = XGBClassifier(
    max_depth=6,
    learning_rate=0.05,
    n_estimators=200,
    min_child_weight=3,
    gamma=0.1,
    subsample=0.8,
    colsample_bytree=0.8,
    scale_pos_weight=20,  # Handle class imbalance (incidents are rare)
    objective='binary:logistic',
    random_state=42
)

# Train on synthetic + real data
model.fit(X_train, y_train)

# Predict probability of incident
risk_probability = model.predict_proba(current_worker_features)[:, 1]
ml_risk_score = risk_probability * 100  # Convert to 0-100 scale
```

**Model Outputs:**
- **Risk probability** (0-100): Likelihood of incident in next 7 days
- **Feature importance**: Which factors contribute most to this worker's risk
- **Recommended interventions**: Based on top risk factors

**Training Data Sources:**

1. **Use Kaggle Industrial Safety Dataset**: https://www.kaggle.com/datasets/ihmstefanini/industrial-safety-and-health-analytics-database
   - Download and use as baseline training data
   - Has 12,000+ accident records with worker demographics

2. **Use provided incident CSV** as templates for synthetic data generation

3. **Generate synthetic worker exposure data** (use script provided below)

#### Combined Risk Score Calculation

```python
# Final risk score combines both systems
total_risk_score = (rule_based_score * 0.4) + (ml_score * 0.6)

# Risk Levels
if total_risk_score < 30:
    risk_level = "LOW"
    color = "green"
elif total_risk_score < 60:
    risk_level = "MEDIUM"
    color = "yellow"
elif total_risk_score < 85:
    risk_level = "HIGH"
    color = "orange"
else:
    risk_level = "CRITICAL"
    color = "red"
    worker_blocked = True
```

#### Threshold & Blocking System

- **Configurable thresholds** per job type (stored in database)
- **Default critical threshold**: 85 for most jobs, 80 for low-risk jobs (SGI)
- **Automatic blocking** when threshold exceeded
- **Manager override** capability (requires justification, logged in database)
- **Graduated alerts**:
  - 30-59: Green - "You're doing great, stay safe!"
  - 60-70: Yellow - "Elevated risk detected. Consider reducing exposure."
  - 71-84: Orange - "High risk! Manager notified. Review your hazard exposure."
  - 85+: Red - "CRITICAL RISK. You are blocked from working. Contact your manager."

- **Cooling off recommendations**:
  - Risk 60-70: Suggest reducing hazard exposure by 30%
  - Risk 71-84: Recommend 1 rest day
  - Risk 85+: Mandatory 2+ rest days until risk drops below 60

### 4. Risk Dashboard System

#### Worker Dashboard

**Header Section:**
- Welcome message with worker name
- Current date and time
- "Submit Today's Form" button (prominent if not yet submitted)

**Risk Status Panel (Large, Center):**
- Current risk score displayed as large number with color coding
- Risk level badge (LOW/MEDIUM/HIGH/CRITICAL)
- Visual gauge/meter showing risk score
- Status message: "✓ Cleared to work" or "⚠ Warning" or "🛑 BLOCKED"

**Risk Trend Chart:**
- Line graph showing daily risk scores for last 30 days
- Horizontal threshold line at 85
- Color-coded regions (green/yellow/orange/red)
- 7-day moving average overlay

**Exposure Summary (Current Period):**
- **Today**: Total hazard hours, PPE compliance %, fatigue level
- **This Week (7 days)**: 
  - Total hazard exposure hours
  - Average daily risk score
  - Days worked consecutively
  - Highest risk day
- **This Month (30 days)**:
  - Total hazard exposure hours
  - Average daily risk score
  - Number of high-risk days (>70)
  - PPE compliance average

**Active Alerts:**
- List of current warnings/recommendations
- "Take a rest day" suggestion if applicable
- PPE reminders if compliance is low
- Specific hazard warnings

**Form Submission History:**
- Table of last 10 form submissions
- Columns: Date, Risk Score, Status, View Details button

**Recommendations Panel:**
- AI-generated personalized recommendations based on risk factors
- Example: "Your risk is high due to consecutive work days. Consider taking a rest day."
- Example: "PPE compliance has dropped to 75%. Ensure full compliance with safety equipment."

#### Manager Dashboard (Job-Type Specific)

Each manager sees their team filtered by department/job type.

**Overview Panel:**
- **Team Size**: Total workers under management
- **Today's Status**:
  - Workers cleared (green badge)
  - Workers at warning level (yellow badge)
  - Workers at high risk (orange badge)
  - Workers blocked (red badge)
- **Active Alerts**: Count of unresolved alerts requiring attention
- **Forms Pending**: Workers who haven't submitted today's form
- **Incident Rate**: 7-day and 30-day incident trends

**Risk Heatmap (Team Matrix):**
- Grid/table view of all workers
- Columns:
  - Worker Name
  - Job Type
  - Current Risk Score (color-coded cell)
  - Status (icon: ✓/⚠/🛑)
  - Days Since Last Incident
  - Action (button: View Details / Override Block)
- Sortable by: Risk Score (high to low), Name, Status
- Filterable by: Risk Level, Job Type, Status

**Job-Specific Metrics Dashboard**

*Example: SaskPower Line Technician Manager View:*

**Hazard Exposure Summary (Team Aggregate - Last 7 Days):**
- Total high-voltage exposure hours across team
- Total height work hours across team
- Weather-related risk days
- Arc flash near-miss count

**Individual Alerts:**
- Worker X: Exceeded high-voltage threshold (6.5 hrs yesterday)
- Worker Y: 6 consecutive days without rest
- Worker Z: PPE compliance only 70% this week

**Risk Distribution Chart:**
- Bar chart showing number of workers in each risk level
- Trend line showing change from last week

*Example: SaskEnergy Gas Fitter Manager View:*

**Hazard Exposure Summary (Team Aggregate - Last 7 Days):**
- Gas concentration exposure events (count)
- Confined space entries (count and total hours)
- Excavation incidents
- Pressure system work hours

**Individual Alerts:**
- Worker A: 3 gas exposure events yesterday (threshold: 2)
- Worker B: Confined space work totaling 8 hours this week
- Worker C: Excavation work in extreme weather

*Example: SGI Claims Inspector Manager View:*

**Activity Summary (Last 7 Days):**
- Total driving hours across team
- Site visits in hazardous conditions
- Repetitive strain injury risks flagged
- Average fatigue levels

**Individual Alerts:**
- Worker D: 8 hours driving yesterday (threshold: 7)
- Worker E: Reporting fatigue level 4+ for 3 consecutive days

**Predictive Analytics Panel:**

- **ML Predictions**: List of workers with highest probability of incident in next 7 days
  - Worker name, predicted risk %, top risk factors, recommended action
- **Recommended Interventions**:
  - "Worker X should take a rest day (6 consecutive days worked)"
  - "Worker Y needs PPE refresher training (compliance dropped to 72%)"
  - "Worker Z should avoid high-voltage tasks this week (cumulative exposure high)"

**Action Center (Requires Manager Attention):**
- **Blocked Workers Pending Override**: 
  - List with worker name, risk score, reason for block, override request form
  - Manager can approve with justification (logged) or deny
- **Unresolved High-Risk Alerts**:
  - Workers at risk 71-84 who haven't reduced exposure
- **Forms Not Submitted**:
  - Workers who haven't submitted today's form (send reminder)
- **Corrective Actions Tracking**:
  - Follow-up on past incidents (from historical data)
  - Status of corrective actions (Open/In Progress/Completed)

**Department/Team Trends:**
- Risk trend line for entire team (30-day view)
- Incident rate comparison: This month vs. last month
- PPE compliance trends
- Most common hazard exposures

#### Admin Dashboard

**Organization-Wide Metrics:**
- Total workers across all crown corporations
- Overall risk distribution (pie chart: Low/Medium/High/Critical)
- Total incidents this month vs. last month
- Forms submitted today (progress bar)

**Cross-Corporation Comparison:**
- Risk scores by corporation:
  - SaskPower average risk: 42
  - SaskEnergy average risk: 38
  - SaskTel average risk: 28
  - SGI average risk: 18
- Incident rates by corporation (bar chart)
- Top 5 highest-risk jobs across all corporations

**Job Type Risk Analysis:**
- Table showing all job types with:
  - Average risk score
  - Number of workers
  - Incident rate
  - Most common hazards
  - Recommended threshold adjustments

**System Configuration Panel:**
- **Manage Job Types**: Add/edit/delete job types, set baseline risk scores
- **Manage Hazards**: Define hazard categories, set severity weights
- **Set Thresholds**: Configure critical thresholds per job type
- **PPE Requirements**: Define required PPE per job type

**User Management:**
- Add/edit/delete users
- Assign roles (Worker/Manager/Admin)
- Assign job types and departments
- Reset passwords

**Historical Data Analysis:**
- Date range selector
- Export data (CSV download)
- Incident trends over time (line chart)
- Risk score distributions (histogram)
- Correlation analysis: Which factors most predict incidents?

**ML Model Performance:**
- Model accuracy metrics (precision, recall, F1-score)
- Feature importance chart (which factors matter most)
- Prediction vs. actual incidents comparison
- Model last trained date
- "Retrain Model" button (for after gathering more data)

**Compliance Reporting:**
- Generate monthly safety report (PDF)
- Incident summaries
- Risk trend reports
- Export for regulatory submission

### 5. Alert & Notification System

#### Alert Types & Triggers

**1. Worker Alerts (In-App Notifications):**

| Trigger | Alert Message | Priority |
|---------|--------------|----------|
| Risk score enters 60-70 range | "⚠ Your risk level is elevated. Consider reducing hazard exposure." | Medium |
| Risk score enters 71-84 range | "🔶 HIGH RISK detected. Manager has been notified. Please review your recent exposures." | High |
| Risk score ≥ 85 | "🛑 CRITICAL RISK. You are blocked from working until your risk decreases. Contact your manager." | Critical |
| PPE compliance < 80% | "⚠ PPE compliance below 80%. Ensure you're using all required safety equipment." | Medium |
| 5+ consecutive days worked | "💤 You've worked 5 consecutive days. Consider taking a rest day soon." | Low |
| 6+ consecutive days worked | "⚠ 6 consecutive days worked. Rest day recommended." | Medium |
| Form not submitted by 9 AM | "📝 Reminder: Submit your daily OH&S form before starting work." | Medium |
| Specific hazard threshold exceeded | "⚠ High-voltage exposure exceeded safe limit (6.5 hrs). Reduce exposure tomorrow." | High |

**2. Manager Alerts (In-App + Email):**

| Trigger | Alert Message | Priority |
|---------|--------------|----------|
| Worker reaches HIGH risk (71-84) | "Worker [Name] reached HIGH risk (Score: 78). Review and take action." | High |
| Worker blocked (≥85) | "🛑 Worker [Name] BLOCKED (Score: 87). Immediate intervention required." | Critical |
| Multiple workers at high risk | "⚠ 3 workers on your team are at HIGH risk. Review team workload." | High |
| Worker hasn't submitted form | "[Name] hasn't submitted OH&S form. Send reminder." | Low |
| ML predicts high incident risk | "🔮 AI Prediction: Worker [Name] has 65% probability of incident in next 7 days." | High |
| Worker requests override | "[Name] requesting override for work clearance. Review and approve/deny." | Medium |
| Pattern detected | "⚠ Pattern detected: 5 workers in [Department] showing high fatigue this week." | Medium |

**3. Admin Alerts (In-App + Email):**

| Trigger | Alert Message | Priority |
|---------|--------------|----------|
| Multiple workers blocked across org | "🛑 15 workers blocked organization-wide. Potential systemic issue." | Critical |
| Department risk spike | "SaskPower Line Technician avg risk increased 25% this week." | High |
| ML model performance drop | "⚠ ML model accuracy below 75%. Consider retraining with new data." | Medium |
| Compliance threshold breach | "Regulatory threshold breached: 10 incidents this month (limit: 8)." | Critical |

#### Delivery Mechanisms (MVP Priority)

1. **In-App Notifications** (MUST HAVE - Priority 1)
   - Badge counter on navbar showing unread alerts
   - Dropdown panel with alert list
   - Click alert to view details/take action
   - Mark as read/dismiss functionality
   - Persistent until acknowledged

2. **Dashboard Badges** (MUST HAVE - Priority 1)
   - Visual indicators on relevant dashboard widgets
   - Example: Red badge showing "3" on "Workers at Risk" panel

3. **Alert History Log** (MUST HAVE - Priority 2)
   - Searchable/filterable log of all alerts
   - Shows: Date, Type, Message, Status (Unread/Read/Resolved)

4. **Email Alerts** (NICE TO HAVE - Priority 3)
   - Only for Critical alerts if time permits
   - Manager/Admin emails only
   - Use simple SMTP or service like SendGrid

#### Alert Workflow Example:

```
1. Worker submits form → Risk calculated = 88 (CRITICAL)
2. System generates alerts:
   - Worker alert: "🛑 BLOCKED - Score 88"
   - Manager alert: "🛑 [Worker Name] BLOCKED - Score 88"
   - Admin alert: "🛑 1 worker blocked in [Department]"
3. Alerts appear in:
   - Worker's dashboard (banner + notification badge)
   - Manager's dashboard (Action Center + notification badge)
   - Admin's dashboard (notification badge)
4. Manager clicks alert → Views worker details → Approves override OR denies
5. If approved → Worker receives "✓ Override approved. Work cautiously."
6. If denied → Worker receives "Your override was denied. You must take rest."
7. Alert marked as Resolved
```

### 6. Data Management & Database Schema

#### Database Schema (PostgreSQL/MySQL)

**Core Tables:**

```sql
-- Users table
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('worker', 'manager', 'admin')),
    job_type_id INT REFERENCES job_types(job_type_id),
    department VARCHAR(100),
    location VARCHAR(50),
    age INT,
    hire_date DATE,
    years_experience INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Job types table
CREATE TABLE job_types (
    job_type_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    corporation VARCHAR(50) NOT NULL,
    description TEXT,
    baseline_risk_score INT DEFAULT 30,
    critical_threshold INT DEFAULT 85,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Hazards master table
CREATE TABLE hazards (
    hazard_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50),
    severity_weight INT DEFAULT 5,
    description TEXT
);

-- Job-Hazard mapping (many-to-many)
CREATE TABLE job_hazards (
    job_type_id INT REFERENCES job_types(job_type_id),
    hazard_id INT REFERENCES hazards(hazard_id),
    daily_threshold_hours DECIMAL(4,1),
    weekly_threshold_hours DECIMAL(5,1),
    is_required_ppe BOOLEAN DEFAULT FALSE,
    PRIMARY KEY (job_type_id, hazard_id)
);

-- PPE requirements
CREATE TABLE ppe_requirements (
    ppe_id SERIAL PRIMARY KEY,
    job_type_id INT REFERENCES job_types(job_type_id),
    ppe_name VARCHAR(100) NOT NULL,
    is_required BOOLEAN DEFAULT TRUE
);

-- Daily forms (worker submissions)
CREATE TABLE daily_forms (
    form_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(user_id),
    submission_date DATE NOT NULL,
    shift_start_time TIME,
    shift_duration INT,
    time_of_day VARCHAR(20),
    days_worked_consecutively INT,
    fatigue_level INT CHECK (fatigue_level BETWEEN 1 AND 5),
    hours_sleep_last_night DECIMAL(3,1),
    ppe_compliance_rate DECIMAL(4,2),
    symptoms TEXT[], -- PostgreSQL array
    notes TEXT,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, submission_date) -- One form per worker per day
);

-- Hazard exposures (daily per-hazard tracking)
CREATE TABLE hazard_exposures (
    exposure_id SERIAL PRIMARY KEY,
    form_id INT REFERENCES daily_forms(form_id) ON DELETE CASCADE,
    hazard_id INT REFERENCES hazards(hazard_id),
    exposure_hours DECIMAL(4,1),
    severity_level VARCHAR(20) CHECK (severity_level IN ('Low', 'Medium', 'High')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Risk scores (calculated daily)
CREATE TABLE risk_scores (
    score_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(user_id),
    form_id INT REFERENCES daily_forms(form_id),
    date DATE NOT NULL,
    rule_based_score DECIMAL(5,2),
    ml_score DECIMAL(5,2),
    total_score DECIMAL(5,2),
    risk_level VARCHAR(20) CHECK (risk_level IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    risk_factors TEXT[], -- Array of contributing factors
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_date (user_id, date)
);

-- Incidents (from historical data + new incidents)
CREATE TABLE incidents (
    incident_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(user_id),
    incident_date DATE NOT NULL,
    location VARCHAR(100),
    department VARCHAR(100),
    injury_type VARCHAR(100),
    root_cause VARCHAR(100),
    corrective_action TEXT,
    incident_severity VARCHAR(20) CHECK (incident_severity IN ('Low', 'Medium', 'High')),
    days_lost INT DEFAULT 0,
    description TEXT,
    risk_score_at_incident DECIMAL(5,2),
    reported_by INT REFERENCES users(user_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Alerts
CREATE TABLE alerts (
    alert_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(user_id), -- Recipient
    alert_type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) CHECK (severity IN ('Low', 'Medium', 'High', 'Critical')),
    message TEXT NOT NULL,
    related_worker_id INT REFERENCES users(user_id), -- For manager/admin alerts about workers
    is_read BOOLEAN DEFAULT FALSE,
    is_resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP,
    INDEX idx_user_unread (user_id, is_read)
);

-- Worker blocks
CREATE TABLE worker_blocks (
    block_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(user_id),
    blocked_date DATE NOT NULL,
    risk_score DECIMAL(5,2) NOT NULL,
    reason TEXT,
    manager_override BOOLEAN DEFAULT FALSE,
    override_reason TEXT,
    overridden_by INT REFERENCES users(user_id),
    overridden_at TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    resolved_at TIMESTAMP,
    INDEX idx_active_blocks (user_id, is_active)
);

-- ML model metadata
CREATE TABLE ml_model_metadata (
    model_id SERIAL PRIMARY KEY,
    model_name VARCHAR(100),
    version VARCHAR(20),
    trained_date TIMESTAMP,
    accuracy DECIMAL(5,4),
    precision_score DECIMAL(5,4),
    recall SCORE DECIMAL(5,4),
    f1_score DECIMAL(5,4),
    feature_importance JSON, -- Store as JSON
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Database Indexes for Performance

```sql
-- Speed up common queries
CREATE INDEX idx_daily_forms_user_date ON daily_forms(user_id, submission_date DESC);
CREATE INDEX idx_risk_scores_user_date ON risk_scores(user_id, date DESC);
CREATE INDEX idx_incidents_user_date ON incidents(user_id, incident_date DESC);
CREATE INDEX idx_alerts_unread ON alerts(user_id, is_read, created_at DESC);
```

#### Data Persistence Requirements

1. **Historical Retention**: Keep all data indefinitely for ML training and compliance
2. **Backup**: Daily automated backups (if time permits, otherwise manual)
3. **Seed Data**: 
   - Pre-populate job types, hazards, PPE requirements
   - Load historical incident data from provided CSV
   - Generate synthetic worker profiles (500 workers)
   - Generate 6 months of synthetic exposure data for training

### 7. Synthetic Data Generation (CRITICAL FOR MVP)

Since you only have incident data without daily exposure tracking, you MUST generate synthetic training data for the ML model.

**Python Script to Generate Synthetic Data:**

```python
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import json

# Configuration
N_WORKERS = 500
START_DATE = datetime(2024, 7, 1)
END_DATE = datetime(2025, 1, 30)

# Job distribution for Saskatchewan Crown Corporations
JOB_DISTRIBUTION = {
    'SaskPower_Line_Technician': {'count': 75, 'base_risk': 35, 'threshold': 85},
    'SaskPower_Substation_Operator': {'count': 50, 'base_risk': 30, 'threshold': 85},
    'SaskEnergy_Gas_Fitter': {'count': 75, 'base_risk': 40, 'threshold': 85},
    'SaskEnergy_Pipeline_Tech': {'count': 50, 'base_risk': 38, 'threshold': 85},
    'SaskTel_Field_Tech': {'count': 75, 'base_risk': 25, 'threshold': 85},
    'SGI_Claims_Inspector': {'count': 100, 'base_risk': 15, 'threshold': 80},
    'Construction_General': {'count': 75, 'base_risk': 35, 'threshold': 85}
}

# Hazard definitions by job type
JOB_HAZARDS = {
    'SaskPower_Line_Technician': {
        'high_voltage': {'min': 2, 'max': 8, 'weight': 6, 'threshold': 6},
        'heights': {'min': 1, 'max': 6, 'weight': 5, 'threshold': 4},
        'weather_exposure': {'min': 0, 'max': 8, 'weight': 3, 'threshold': 6},
        'arc_flash_risk': {'min': 0, 'max': 4, 'weight': 8, 'threshold': 3}
    },
    'SaskEnergy_Gas_Fitter': {
        'gas_exposure': {'min': 1, 'max': 7, 'weight': 7, 'threshold': 5},
        'confined_space': {'min': 0, 'max': 4, 'weight': 6, 'threshold': 2},
        'excavation': {'min': 0, 'max': 6, 'weight': 4, 'threshold': 4},
        'pressure_systems': {'min': 1, 'max': 6, 'weight': 5, 'threshold': 5}
    },
    'SaskTel_Field_Tech': {
        'electrical': {'min': 1, 'max': 6, 'weight': 4, 'threshold': 5},
        'heights': {'min': 0, 'max': 5, 'weight': 5, 'threshold': 4},
        'vehicle_operation': {'min': 2, 'max': 8, 'weight': 2, 'threshold': 7},
        'weather_exposure': {'min': 0, 'max': 6, 'weight': 3, 'threshold': 6}
    },
    'SGI_Claims_Inspector': {
        'vehicle_operation': {'min': 3, 'max': 9, 'weight': 2, 'threshold': 7},
        'site_hazards': {'min': 0, 'max': 3, 'weight': 4, 'threshold': 3},
        'repetitive_strain': {'min': 2, 'max': 6, 'weight': 2, 'threshold': 5}
    }
}

def generate_workers():
    """Generate synthetic worker profiles"""
    workers = []
    worker_id = 1
    
    for job_type, config in JOB_DISTRIBUTION.items():
        for i in range(config['count']):
            age = np.random.randint(22, 65)
            experience = min(np.random.randint(0, age - 21), 35)
            
            worker = {
                'worker_id': f'W{worker_id:05d}',
                'email': f'worker{worker_id}@{job_type.split("_")[0].lower()}.sk.ca',
                'job_type': job_type,
                'department': job_type.split('_')[0],
                'age': age,
                'years_experience': experience,
                'hire_date': (datetime.now() - timedelta(days=experience*365)).strftime('%Y-%m-%d'),
                'baseline_risk_score': config['base_risk'] + np.random.randint(-5, 6),
                'critical_threshold': config['threshold']
            }
            workers.append(worker)
            worker_id += 1
    
    return pd.DataFrame(workers)

def calculate_daily_risk(exposure_data, worker_baseline, hazards_config):
    """Calculate risk score for a single day"""
    risk = worker_baseline
    
    # Shift duration
    if exposure_data['shift_duration'] >= 12:
        risk += 15
    elif exposure_data['shift_duration'] >= 10:
        risk += 8
    
    # Fatigue
    risk += exposure_data['fatigue_level'] * 4
    
    # PPE compliance
    if exposure_data['ppe_compliance'] < 0.8:
        risk += 15
    elif exposure_data['ppe_compliance'] < 0.9:
        risk += 8
    
    # Hazard exposures
    total_hazard_hours = 0
    for hazard, hours in exposure_data['hazards'].items():
        if hours > 0:
            threshold = hazards_config[hazard]['threshold']
            weight = hazards_config[hazard]['weight']
            
            total_hazard_hours += hours
            
            if hours > threshold:
                excess = hours - threshold
                risk += weight * excess * 2  # Double penalty for exceeding
            else:
                risk += weight * (hours / threshold) * 0.5
    
    # Consecutive days
    if exposure_data['consecutive_days'] >= 7:
        risk += 20
    elif exposure_data['consecutive_days'] >= 6:
        risk += 12
    elif exposure_data['consecutive_days'] >= 5:
        risk += 5
    
    # Time of day
    if exposure_data['time_of_day'] == 'Night' and exposure_data['fatigue_level'] >= 3:
        risk += 8
    
    return min(100, max(0, risk))

def generate_daily_exposures(workers_df):
    """Generate daily exposure records for all workers"""
    records = []
    
    current_date = START_DATE
    worker_consecutive_days = {w: 0 for w in workers_df['worker_id']}
    
    while current_date <= END_DATE:
        is_weekend = current_date.weekday() >= 5
        
        for _, worker in workers_df.iterrows():
            # 70% chance to skip weekend
            if is_weekend and np.random.random() < 0.7:
                worker_consecutive_days[worker['worker_id']] = 0
                continue
            
            # 5% chance to take day off during week
            if not is_weekend and np.random.random() < 0.05:
                worker_consecutive_days[worker['worker_id']] = 0
                continue
            
            # Increment consecutive days
            worker_consecutive_days[worker['worker_id']] += 1
            
            # Get hazards for this job
            job_type = worker['job_type']
            hazards_config = JOB_HAZARDS.get(job_type, {})
            
            # Generate hazard exposures
            hazard_exposures = {}
            for hazard, config in hazards_config.items():
                # Not every hazard every day
                if np.random.random() < 0.7:  # 70% chance of exposure
                    hours = round(np.random.uniform(config['min'], config['max']), 1)
                    hazard_exposures[hazard] = hours
                else:
                    hazard_exposures[hazard] = 0
            
            # Generate other exposure data
            exposure_data = {
                'shift_duration': np.random.choice([8, 10, 12], p=[0.7, 0.2, 0.1]),
                'time_of_day': np.random.choice(['Day', 'Evening', 'Night'], p=[0.7, 0.2, 0.1]),
                'fatigue_level': np.random.randint(1, 6),
                'hours_sleep': round(np.random.uniform(5, 9), 1),
                'ppe_compliance': round(np.random.uniform(0.7, 1.0), 2),
                'consecutive_days': worker_consecutive_days[worker['worker_id']],
                'hazards': hazard_exposures
            }
            
            # Calculate risk
            daily_risk = calculate_daily_risk(
                exposure_data, 
                worker['baseline_risk_score'],
                hazards_config
            )
            
            # Create record
            record = {
                'worker_id': worker['worker_id'],
                'date': current_date.strftime('%Y-%m-%d'),
                'shift_duration': exposure_data['shift_duration'],
                'time_of_day': exposure_data['time_of_day'],
                'fatigue_level': exposure_data['fatigue_level'],
                'hours_sleep_last_night': exposure_data['hours_sleep'],
                'ppe_compliance_rate': exposure_data['ppe_compliance'],
                'consecutive_days_worked': exposure_data['consecutive_days'],
                'daily_risk_score': round(daily_risk, 2),
                'total_hazard_hours': round(sum(hazard_exposures.values()), 1)
            }
            
            # Add individual hazard hours
            for hazard, hours in hazard_exposures.items():
                record[f'{hazard}_hours'] = hours
            
            records.append(record)
        
        current_date += timedelta(days=1)
    
    return pd.DataFrame(records)

def generate_incidents(exposure_df, incident_template_df, workers_df):
    """Generate incidents based on risk scores"""
    incidents = []
    
    # High risk days more likely to have incidents
    # Risk 85+ = 8% chance, 70-84 = 3%, 60-69 = 1%, <60 = 0.1%
    def incident_probability(risk):
        if risk >= 85:
            return 0.08
        elif risk >= 70:
            return 0.03
        elif risk >= 60:
            return 0.01
        else:
            return 0.001
    
    for _, row in exposure_df.iterrows():
        prob = incident_probability(row['daily_risk_score'])
        
        if np.random.random() < prob:
            # Sample incident template
            template = incident_template_df.sample(1).iloc[0]
            
            # Get worker info
            worker = workers_df[workers_df['worker_id'] == row['worker_id']].iloc[0]
            
            incident = {
                'worker_id': row['worker_id'],
                'incident_date': row['date'],
                'location': template.get('Location', 'Site A'),
                'department': worker['department'],
                'injury_type': template.get('Injury_Type', 'Bruise'),
                'root_cause': template.get('Root_Cause', 'Human Error'),
                'corrective_action': template.get('Corrective_Action', 'Training'),
                'incident_severity': template.get('Incident_Severity', 'Low'),
                'days_lost': template.get('Days_Lost', 0),
                'risk_score_at_incident': row['daily_risk_score']
            }
            incidents.append(incident)
    
    return pd.DataFrame(incidents)

def add_ml_features(exposure_df):
    """Add rolling window features for ML training"""
    df = exposure_df.copy()
    df['date'] = pd.to_datetime(df['date'])
    df = df.sort_values(['worker_id', 'date'])
    
    # Rolling features (7-day and 30-day windows)
    for window in [7, 30]:
        df[f'avg_risk_{window}d'] = df.groupby('worker_id')['daily_risk_score'].transform(
            lambda x: x.rolling(window, min_periods=1).mean()
        )
        df[f'max_risk_{window}d'] = df.groupby('worker_id')['daily_risk_score'].transform(
            lambda x: x.rolling(window, min_periods=1).max()
        )
        df[f'total_hazard_hours_{window}d'] = df.groupby('worker_id')['total_hazard_hours'].transform(
            lambda x: x.rolling(window, min_periods=1).sum()
        )
        df[f'avg_ppe_{window}d'] = df.groupby('worker_id')['ppe_compliance_rate'].transform(
            lambda x: x.rolling(window, min_periods=1).mean()
        )
    
    # Consecutive high-risk days
    df['is_high_risk'] = (df['daily_risk_score'] >= 60).astype(int)
    df['consecutive_high_risk_days'] = df.groupby('worker_id')['is_high_risk'].transform(
        lambda x: x * (x.groupby((x != x.shift()).cumsum()).cumcount() + 1)
    )
    
    return df

# Generate all data
print("Generating workers...")
workers = generate_workers()

print("Generating daily exposures...")
exposures = generate_daily_exposures(workers)

print("Loading incident templates...")
# Load your provided incident data
incident_templates = pd.read_csv('your_incident_data.csv')  # Replace with actual path

print("Generating incidents...")
incidents = generate_incidents(exposures, incident_templates, workers)

print("Adding ML features...")
ml_ready_data = add_ml_features(exposures)

# Add target variable (incident in next 7 days)
incident_dates = incidents.groupby('worker_id')['incident_date'].apply(
    lambda x: pd.to_datetime(x).tolist()
).to_dict()

def has_incident_next_7d(row):
    worker_incidents = incident_dates.get(row['worker_id'], [])
    future_dates = [row['date'] + timedelta(days=i) for i in range(1, 8)]
    return int(any(d in worker_incidents for d in future_dates))

ml_ready_data['target_incident_next_7d'] = ml_ready_data.apply(has_incident_next_7d, axis=1)

# Save to CSV
print("Saving data...")
workers.to_csv('synthetic_workers.csv', index=False)
exposures.to_csv('synthetic_exposures.csv', index=False)
incidents.to_csv('synthetic_incidents.csv', index=False)
ml_ready_data.to_csv('ml_training_data.csv', index=False)

print(f"Generated:")
print(f"  - {len(workers)} workers")
print(f"  - {len(exposures)} daily exposure records")
print(f"  - {len(incidents)} incidents")
print(f"  - Incident rate: {len(incidents)/len(exposures)*100:.2f}%")
print(f"  - Date range: {START_DATE} to {END_DATE}")
```

**Usage Instructions:**
1. Run this script BEFORE starting the web app development
2. Place your incident CSV in same directory as script
3. Run: `python generate_synthetic_data.py`
4. Load the generated CSVs into your database during app initialization
5. Use `ml_training_data.csv` to train your XGBoost model

### 8. Technical Stack Recommendations

#### Backend
- **Framework**: **FastAPI** (Python) - Fast development, async support, auto API docs
- **Database**: **PostgreSQL** with SQLAlchemy ORM
- **ML**: scikit-learn, XGBoost, pandas, numpy
- **Auth**: FastAPI JWT or simple session-based
- **File handling**: Python pickle for trained ML model

#### Frontend
- **Framework**: **React** with Vite (or Next.js if you prefer)
- **UI Library**: **Tailwind CSS** + **shadcn/ui** components (pre-built, beautiful)
- **Charts**: **Recharts** or **Chart.js**
- **State Management**: React Context or Zustand (lightweight)
- **HTTP Client**: Axios or fetch

#### ML Pipeline
- **Data Processing**: pandas, numpy
- **Model**: XGBoost for binary classification (incident prediction)
- **Training**: 
  - Load synthetic data + Kaggle dataset
  - Train on initialization
  - Save model to disk (pickle)
- **Inference**: Real-time scoring on form submission

#### Deployment (if time permits)
- **Backend**: Run on localhost:8000
- **Frontend**: Run on localhost:3000
- **Database**: PostgreSQL on localhost:5432 (or SQLite for simplicity)

### 9. 9-Hour Development Timeline (Revised)

#### Hour 0-1: Setup & Data Generation
- **Backend**: FastAPI project setup, database schema creation
- **Frontend**: React + Vite setup, Tailwind CSS config
- **Data**: Run synthetic data generation script
- **Database**: Create tables, load synthetic data + incident templates
- **Deliverable**: Database populated with 500 workers, 6 months of exposure data

#### Hour 1-2: Authentication & User Management
- **Backend**: 
  - User registration/login endpoints
  - JWT token generation
  - Role-based middleware
- **Frontend**:
  - Login page
  - Role-based routing (worker/manager/admin views)
- **Deliverable**: Users can log in and see role-specific dashboards

#### Hour 2-4: Daily Form System & Risk Engine
- **Backend**:
  - Form submission endpoint
  - Rule-based risk calculator (implement logic from pseudocode above)
  - ML model training (load data, train XGBoost, save model)
  - Risk scoring endpoint (combines rule + ML)
  - Worker blocking logic
- **Frontend**:
  - Daily form UI (dynamic hazard fields based on job type)
  - Form validation
  - Risk score display after submission
  - Block/warning messages
- **Deliverable**: Workers can submit forms, see risk scores, get blocked if critical

#### Hour 4-6: Dashboards (Worker & Manager)
- **Backend**:
  - Worker dashboard data endpoint (personal stats, trends)
  - Manager dashboard data endpoint (team stats, alerts)
  - Historical data queries (7-day, 30-day aggregates)
- **Frontend**:
  - Worker dashboard with risk gauge, trend chart, exposure summary
  - Manager dashboard with team heatmap, job-specific metrics, predictive alerts
  - Charts using Recharts
- **Deliverable**: Both dashboards functional with real-time data

#### Hour 6-7: Alert System
- **Backend**:
  - Alert generation on form submission (based on risk triggers)
  - Alert endpoints (get unread, mark as read, resolve)
  - Alert history
- **Frontend**:
  - Notification badge in navbar
  - Alert dropdown panel
  - Alert list on dashboards
- **Deliverable**: Alerts generated and displayed in-app

#### Hour 7-8: Admin Panel & Manager Actions
- **Backend**:
  - Admin dashboard endpoint (org-wide stats)
  - Manager override endpoint (approve/deny blocked workers)
  - User management endpoints (CRUD users)
- **Frontend**:
  - Admin dashboard with org metrics
  - Manager action center (override requests)
  - Basic user management UI
- **Deliverable**: Admin can view system-wide data, managers can override blocks

#### Hour 8-9: Testing, Bug Fixes & Polish
- **Testing**:
  - End-to-end workflow: Worker submits form → risk calculated → manager sees alert
  - Test blocking system
  - Test ML predictions
- **Polish**:
  - Fix UI bugs
  - Improve error messages
  - Add loading indicators
  - Test with 3-5 sample users
- **Deliverable**: Stable, demo-ready MVP

### 10. MVP Scope Limitations (9 Hours)

**✅ MUST INCLUDE:**
- All 3 user types with authentication
- Daily form submission with job-specific hazards
- Risk calculation (rule-based + ML)
- Worker dashboard (personal risk, trends)
- Manager dashboard (team view, 2 job types fully built)
- Basic in-app alerts
- Blocking system with threshold
- Data persistence
- Synthetic data generation

**⏭️ DEFER POST-MVP:**
- Custom form builder (use standard pre-built forms only)
- Email notifications (in-app only)
- Advanced admin configuration UI (hardcode thresholds initially)
- Mobile app (web-responsive only)
- PDF report exports
- Manager override workflow (simple approve/deny button if time)
- All 7 job types fully customized (focus on 2-3, make others generic)

### 11. Success Criteria

The MVP is complete when:
1. ✅ Worker can log in, submit daily form, see personal risk score
2. ✅ System calculates risk using both rule-based and ML models
3. ✅ System blocks worker if risk exceeds 85 (configurable threshold)
4. ✅ Manager can view team dashboard with risk levels for 2+ job types
5. ✅ ML model predicts high-risk workers based on historical patterns
6. ✅ Alerts are generated for high-risk situations (in-app)
7. ✅ Data persists across sessions
8. ✅ Dashboard shows job-specific risk metrics (at least 2 job types)
9. ✅ System uses synthetic + real training data

### 12. Sample Data & Testing

**Test Users (Create These):**
```
Worker (Low Risk):
- Email: worker.safe@saskpower.sk.ca
- Password: test123
- Job: SaskTel Field Tech
- Risk Profile: Consistently low risk (20-35)

Worker (High Risk):
- Email: worker.highrisk@saskenergy.sk.ca
- Password: test123
- Job: SaskEnergy Gas Fitter
- Risk Profile: Escalating risk (60-90 over past week)

Manager:
- Email: manager@saskpower.sk.ca
- Password: test123
- Manages: 20 workers across SaskPower jobs

Admin:
- Email: admin@worksafe.sk.ca
- Password: test123
- Sees all corporations
```

**Demo Scenario:**
1. Log in as high-risk worker
2. Submit form with high hazard exposure (8 hrs gas exposure)
3. See risk score spike to 88 (CRITICAL)
4. Worker gets blocked
5. Log in as manager
6. See alert: "Worker blocked - Score 88"
7. Review worker details
8. Approve override with justification
9. Worker can now work (with warning)

### 13. Key Implementation Notes

1. **Start with database schema** - Getting structure right saves time later
2. **Generate synthetic data FIRST** - ML model needs training data immediately
3. **Use Kaggle dataset** as baseline for ML patterns
4. **Focus on 2 job types initially** (SaskPower Line Tech + SaskEnergy Gas Fitter - highest risk)
5. **Hardcode thresholds initially** (85 for most jobs, 80 for SGI)
6. **Use pre-built UI components** (shadcn/ui, Recharts) - don't build from scratch
7. **Prioritize working features over polish** - Functional > Beautiful for MVP
8. **Mock some ML predictions if model training takes too long** - Can always improve later

### 14. Deliverables

1. **Working web application** with all core features
2. **Seeded database** with 500 workers, 6 months of exposure data, incidents
3. **Trained ML model** (saved as pickle file)
4. **README** with:
   - Setup instructions
   - Test credentials
   - How to run synthetic data generation
   - API endpoint documentation (FastAPI auto-generates this)
5. **Brief demo script** showing key workflows

### 15. Data Sources Summary

**Use These Datasets:**
1. **Kaggle Industrial Safety Database** (12,000+ records):
   - https://www.kaggle.com/datasets/ihmstefanini/industrial-safety-and-health-analytics-database
   - Use for baseline ML training patterns

2. **Your Provided Incident CSV**:
   - Use as templates for synthetic incident generation
   - Provides realistic injury types, severity, root causes

3. **Synthetic Generated Data** (created by script):
   - 500 workers across 7 Saskatchewan job types
   - 6 months of daily exposure records (~90,000 records)
   - ~1,800 incidents (2% incident rate on high-risk days)
   - Full feature set for ML training

**Combined Training Approach:**
```python
# Load Kaggle data for baseline patterns
kaggle_df = pd.read_csv('kaggle_industrial_safety.csv')

# Load your synthetic Saskatchewan-specific data
synthetic_df = pd.read_csv('ml_training_data.csv')

# Train model on combined data
X = pd.concat([
    prepare_features(kaggle_df),
    prepare_features(synthetic_df)
])
y = pd.concat([kaggle_df['target'], synthetic_df['target_incident_next_7d']])

model.fit(X, y)
```

---

## Final Notes for AI Software Engineer

This prompt provides a complete specification for a 9-hour hackathon build. Key priorities:

1. **Data First**: Generate synthetic data immediately - without it, ML model can't work
2. **Core Loop**: Form → Risk Calc → Dashboard → Alert is the critical path
3. **Use Libraries**: Don't reinvent wheels - use XGBoost, Recharts, shadcn/ui
4. **Scope Control**: Build 2 job types fully, make others generic if time runs out
5. **Test Early**: Have test users ready, demo workflow multiple times

**The biggest differentiator**: Most OH&S systems only track incidents after they happen. This system **predicts and prevents** them using ML + cumulative exposure tracking. That's your competitive advantage.

