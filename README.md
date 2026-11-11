# Clinical Encounter Intake Platform (CEIP)

**Created by Awulor Chukwudi Francis**  
**Project type:** Research-oriented portfolio prototype  
**Status:** Working local demo with API, web interface, synthetic-data loader, and automated tests. Deployment depends on the host and environment configured by the operator.

CEIP explores how a clinic-scoped backend can ingest patient encounters, turn note text into structured candidate data, and make access traceable. It combines a FastAPI API with a React demo interface, PostgreSQL persistence, tenant-aware authorization, audit logging, and a small explainable extraction pipeline.

> **Safety and scope:** Use synthetic data only. This is a software and research prototype, not a clinically validated product or a source of medical advice. Extracted fields are candidates for human review and must not guide patient care.

## Problem statement

Clinical data workflows often need to bring patient and encounter information together while preserving who can access each clinic's records and how those records are used. Free-text notes can also contain useful details that are difficult to query consistently. A prototype in this space needs to make both the data flow and its boundaries visible: where records came from, which clinic owns them, what was extracted, and which user performed an operation.

CEIP is a learning and demonstration project. It does not claim to represent a hospital's production workflow, integrate with an electronic health record, or solve clinical language understanding generally.

## Current solution

CEIP provides a tenant-aware API and browser demo for clinic staff. Authenticated users operate within their clinic; clinic context comes from the authenticated account, and service queries filter records by that tenant. Role checks separate platform administration, clinic administration, clinical work, and audit review. Patient-data operations write audit entries with the associated database transaction.

For notes, the current baseline uses spaCy phrase matching over an editable vocabulary, regular expressions for selected medication details and labeled vital signs, and heuristic negation cues. It stores raw text beside the extracted JSON structure. Synthea CSVs can optionally populate synthetic patients and encounters; the loader creates clearly labeled summary notes from structured events so they can exercise this pipeline. These summaries are generated from source data and are not clinician-authored notes.

## Research direction

The next research step is to measure the baseline before adding more complex methods. A useful evaluation would use held-out, labeled synthetic examples, report precision and recall for each extracted field, and review errors involving wording variation, negation, ambiguity, and note format. Synthea-generated summaries are useful for repeatable pipeline checks, but they do not establish performance on real-world clinical prose.

A later experiment could retrieve candidate terminology concepts for phrases missing from the active vocabulary. That approach should be compared with the current matcher on the same evaluation set, measuring whether coverage improves without increasing incorrect suggestions. Candidate concepts should include source and provenance, and any retrieved result should remain subject to human review. This is a proposed research extension, not a feature currently implemented in CEIP.

Use synthetic data only. The included extraction vocabulary and rules are a portfolio demonstration, not clinically validated, and must not be used to make care decisions.

## What the service does

1. A user signs in and receives an access token and refresh token.
2. Every clinic user belongs to one tenant (clinic). Patient, encounter, note, and analytics queries take the tenant from the authenticated user; clients cannot choose a tenant filter. IDs belonging to another clinic return 404.
3. Clinicians and records admins create patients, encounters, and raw clinical notes. Reads and writes to patient data are audit logged.
4. A user can request extraction. The service matches terms in the editable vocabulary, uses regular expressions for medication dose/frequency and labeled vitals, checks common negation cues, and saves the result in the note's JSONB field.
5. Analytics summarize the authenticated clinic's data. Super Admin has no implicit clinic context and cannot use clinic-scoped data endpoints without a tenant account.

Synthea data is optional demo content. The seed script imports synthetic patients and encounters, then formats linked conditions, medications, and observations into generated summary notes. Those summaries are run through the same extractor; they are not original free-text notes.

## Architecture and data flow

```mermaid
flowchart LR
    Client[React demo UI / API client] --> API[FastAPI routers]
    API --> Auth[JWT authentication and role checks]
    Auth --> Services[Module services]
    Services --> DB[(PostgreSQL via SQLModel and asyncpg)]
    Services --> Audit[Audit service]
    Audit --> DB
    Services --> Extract[spaCy PhraseMatcher and regex extractor]
    Extract --> JSONB[ClinicalNote.extracted JSONB]
    Auth --> Redis[(Redis token blocklist)]
    Synthea[Synthea CSVs] --> Loader[Seed loader]
    Loader --> Services
```

An authenticated request passes through token validation and role checks before reaching a module service. Services apply tenant ownership filters, perform the operation, and write audit events in the same database transaction. When extraction is requested, the service processes the note text and stores its structured result as JSONB. Redis tracks revoked token IDs and logged-out sessions. The optional Synthea loader imports synthetic source records into the same tenant-scoped data model.

## Design and implementation decisions

These choices keep the project focused on the core clinical data pipeline while making its security and data flow visible and reviewable.

| Decision | Reason and effect |
|---|---|
| Derive the clinic from the authenticated user | A request cannot choose another clinic's tenant ID. This makes tenant ownership part of authorization rather than a caller-controlled filter. |
| Put tenant predicates in data queries and return 404 for another clinic's IDs | This prevents cross-tenant records from being returned and avoids revealing whether a foreign record exists. |
| Give Super Admin no implicit clinic | Super Admin can create and administer clinics, but must not silently inherit access to any clinic's patient records or analytics. Its global audit access is explicit. |
| Record audit events with the data operation | The audit row and patient-data change commit or roll back together, so the audit trail does not claim a change that failed to persist. |
| Store extracted fields in JSONB on the clinical note | The current extraction result is small and evolving. JSONB keeps raw text and its derived structure together without a migration for every field change. The trade-off is that reporting needs explicit JSON queries and validation. |
| Start with spaCy `PhraseMatcher` and regular expressions | A small vocabulary plus deterministic patterns is easy to explain, run locally, and test. It demonstrates a pipeline without introducing a model download or opaque clinical NLP dependency. It will miss vocabulary and context it was not designed to handle. |
| Keep Synthea import separate from live note submission | Synthea CSVs are synthetic structured patient/event records, not clinician free-text notes. The loader preserves patient/encounter links, then creates clearly labeled demo summaries so imported encounters can exercise the same note extractor. |
| Review Synthea vocabulary candidates before activation | Candidate terms can come from different source code systems and may not match the active vocabulary. The helper produces a review file; it never silently changes extraction behavior. |
| Use SNOMED CT identifiers for diagnosis mappings | The vocabulary and output use a consistent clinical terminology identifier system. Each candidate still needs its source system and mapping checked before use. Medication names currently have no returned code. |
| Run extraction synchronously for now | The current portfolio demo has no need for a distributed job queue. Inline work keeps deployment and debugging simple; FastAPI background tasks or a durable worker can be considered if extraction becomes slow or needs retries across process restarts. |
| Bootstrap one configured Super Admin at startup | This provides an initial administrative account without a manual database insert. The email check prevents duplicate accounts, and an existing account's password is not silently reset. |
| Put refresh tokens in request bodies | Tokens in URLs can be copied into browser history, access logs, and referrer data. The JSON body also keeps refresh consistent with logout. |

## Roles

| Role | Typical access |
|---|---|
| `super_admin` | Creates tenants and records admins; can view global audit logs. Has no tenant and cannot access clinic data endpoints. |
| `records_admin` | Manages clinic staff and patient records; creates patients, encounters, and notes; views clinic data, analytics, and audit logs. |
| `clinician` | Creates and reads patient records, encounters, and notes; runs extraction; views clinic analytics. |
| `auditor` | Reads patient, encounter, note, and analytics data; views audit logs. Cannot create or edit clinical records. |

Clinic ownership always comes from the authenticated user. Records admins can invite clinicians and auditors only within their own clinic.

## Technology

- Python 3.11, FastAPI, Pydantic, SQLModel, SQLAlchemy async
- PostgreSQL with `asyncpg`; Alembic migrations
- Redis for revoked-token/session blocklisting
- PyJWT, Passlib, and spaCy's blank English pipeline with `PhraseMatcher`
- Pytest and HTTPX for automated tests

## Local setup

Commands below assume the working directory is the repository's `backend` folder (the folder containing `requirements.txt`, `alembic.ini`, and `src/`). Install Python 3.11, PostgreSQL, and Redis first. Create a PostgreSQL database named `ceip` and make sure both services are running.

### 1. Create an environment and install dependencies

Windows PowerShell:

```powershell
py -3.11 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
```

macOS/Linux:

```bash
python3.11 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
```

No spaCy model download is needed. The extractor uses `spacy.blank("en")`.

### 2. Configure environment variables

Create `.env` in the backend folder. Do not commit this file or use the example password in a shared environment.

```dotenv
DATABASE_URL=postgresql+asyncpg://postgres:your_local_password@localhost:5432/ceip
JWT_SECRET=replace-with-a-long-random-secret
JWT_ALGORITHM=HS256
REDIS_URL=redis://localhost:6379/0
SUPERADMIN_EMAIL=admin@example.com
SUPERADMIN_PASSWORD=replace-with-a-strong-password
```

Required settings are `DATABASE_URL`, `JWT_SECRET`, `JWT_ALGORITHM`, `SUPERADMIN_EMAIL`, and `SUPERADMIN_PASSWORD`. `REDIS_URL` defaults to `redis://localhost:6379` if omitted. URL-encode special characters in a database password. Use a long, random JWT secret and keep all credentials private.

At application startup, CEIP creates the configured tenantless Super Admin if that email does not exist. If the account already exists as a Super Admin, it is left unchanged; startup fails if the email belongs to another role. The bootstrap does not reset an existing password. Run migrations before the first startup so the user table exists.

### 3. Apply database migrations

From the backend folder, with the virtual environment active and `.env` configured:

```bash
alembic upgrade head
```

Use Alembic for schema changes. The application does not create or update the schema automatically.

### 4. Start the API

```bash
uvicorn src.main:app --reload
```

The API is at `http://127.0.0.1:8000`. Open `http://127.0.0.1:8000/docs` for interactive Swagger documentation, or `/redoc` for ReDoc. The root `/` endpoint returns a welcome message. The lifespan startup hook bootstraps the configured Super Admin.

## First-time clinic setup

1. Sign in as the configured Super Admin using `POST /api/v1/auth/login`.
2. Create a clinic using `POST /api/v1/tenants/` with the Super Admin bearer token.
3. Create that clinic's records admin using `POST /api/v1/users/create_record_admin?tenant_id=<tenant-uuid>`, sending email and password in a JSON body.
4. Sign in as the records admin. Invite clinician and auditor users with `POST /api/v1/users/`.
5. Use the clinician or records admin account to add synthetic patients and encounters, or load the Synthea fixture data (see below).

Clinic creation body:

```json
{"name": "Demo Clinic", "email": "clinic@example.com", "address": "1 Demo Street"}
```

Records Admin creation and staff invitation bodies:

```json
{"email": "records@example.com", "password": "use-a-strong-password"}
```

```json
{"email": "clinician@example.com", "password": "use-a-strong-password", "role": "clinician"}
```

For an auditor invite, set `role` to `auditor`. The `tenant_id` for creating the Records Admin is a query parameter because that operation is available only to Super Admin; clinic staff invitations inherit the Records Admin's tenant.

Passwords in the create-user requests are hashed before storage. Never put passwords or tokens in source control, URLs, screenshots, or shared logs.

## Authentication examples

Login with JSON:

```http
POST /api/v1/auth/login
Content-Type: application/json
```

```json
{"email": "admin@example.com", "password": "your-password"}
```

The response includes `access_token`, `refresh_token`, and a small user object. Send the access token on protected requests:

```http
Authorization: Bearer <access_token>
```

Refresh tokens are sent in a JSON body, not in a URL:

```http
POST /api/v1/auth/refresh
Content-Type: application/json
```

```json
{"refresh_token": "<refresh-token>"}
```

Logout requires the access-token bearer header and its matching refresh token in the JSON body:

```http
POST /api/v1/auth/logout
Authorization: Bearer <access-token>
Content-Type: application/json
```

```json
{"refresh_token": "<refresh-token>"}
```

Logout revokes both tokens and the associated session through Redis. Access tokens currently expire after two hours; refresh tokens currently expire after two days.

## API reference

All routes are under `/api/v1`. Protected routes require `Authorization: Bearer <access_token>`. The exact request and response schemas are available in `/docs`.

| Method | Path | Access / purpose |
|---|---|---|
| `POST` | `/auth/login` | Public; email and password to get tokens |
| `POST` | `/auth/refresh` | Public; JSON `{ "refresh_token": "..." }` |
| `POST` | `/auth/logout` | Authenticated; revoke the current matching access/refresh session |
| `GET` | `/users/me` | Any signed-in user; view own profile |
| `POST` | `/users/` | Records Admin; invite a `clinician` or `auditor` in their clinic |
| `POST` | `/users/create_record_admin?tenant_id={uuid}` | Super Admin; add records admin to an existing tenant |
| `GET` | `/users/` | Records Admin or Super Admin; paginated user list |
| `POST` | `/tenants/` | Super Admin; create clinic |
| `GET` | `/tenants/` | Super Admin; paginated clinic list |
| `GET` | `/tenants/{tenant_id}` | Super Admin; get clinic |
| `POST` | `/patients/` | Records Admin or Clinician; create patient |
| `GET` | `/patients/?limit=20&offset=0` | Records Admin, Clinician, Auditor; list clinic patients |
| `GET` | `/patients/{patient_id}` | Records Admin, Clinician, Auditor; retrieve patient |
| `PATCH` | `/patients/{patient_id}` | Records Admin or Clinician; update patient |
| `POST` | `/patients/{patient_id}/encounters` | Records Admin or Clinician; create encounter |
| `GET` | `/patients/{patient_id}/encounters` | Records Admin, Clinician, Auditor; list patient's encounters |
| `GET` | `/encounters/{encounter_id}` | Records Admin, Clinician, Auditor; retrieve encounter |
| `POST` | `/encounters/{encounter_id}/notes` | Records Admin or Clinician; save raw note text |
| `POST` | `/encounters/{encounter_id}/notes/{note_id}/extract` | Records Admin or Clinician; extract and persist structured data |
| `GET` | `/encounters/{encounter_id}/structured-data` | Records Admin, Clinician, Auditor; retrieve structured notes for encounter |
| `GET` | `/audit-logs/?limit=50&offset=0` | Records Admin or Auditor; tenant audit log. Super Admin can view global history. |
| `GET` | `/analytics/diagnosis-frequency` | Records Admin, Clinician, Auditor; tenant diagnosis counts |
| `GET` | `/analytics/encounter-volume` | Records Admin, Clinician, Auditor; tenant daily encounter counts |

Patient list pagination accepts `limit` from 1 to 100 and `offset` of 0 or more. User list uses the same bounds. Audit pagination accepts `limit` from 1 to 200 and `offset` of 0 or more. The patient encounter list currently returns the full list for that patient.

### Common request examples

Create a patient:

```json
{"full_name": "Demo Patient", "birth_date": "1980-01-02", "sex": "F", "external_ref": "demo-patient-1"}
```

Create an encounter (the date is optional; timestamps should include a timezone):

```json
{"occurred_at": "2026-10-30T09:30:00Z"}
```

Create a note:

```json
{"raw_text": "Patient has hypertension. Started lisinopril 10 mg daily. BP 150/95, HR 88."}
```

Then call the note extraction endpoint. The result is persisted on the note and returned in its `extracted` field.

### Analytics filters and response shapes

Both analytics endpoints accept optional inclusive UTC date parameters `start_date` and `end_date` in `YYYY-MM-DD` format. If omitted, the range defaults to the 30 days ending today. The maximum range is 365 inclusive days. Queries use the signed-in user's tenant. Diagnosis frequency returns rows like:

```json
[{"diagnosis_code": "38341003", "count": 3}]
```

Encounter volume returns one row per date with encounters; dates with zero encounters are omitted:

```json
[{"date": "2026-10-29", "count": 2}, {"date": "2026-10-30", "count": 1}]
```

Diagnosis codes are SNOMED CT identifiers. Analytics count extracted structured diagnosis data and encounters within the requested time range.

## Synthea CSV demo data

Five sample CSV files are in `data/`: `patients.csv`, `encounters.csv`, `conditions.csv`, `medications.csv`, and `observations.csv`. These are synthetic records with linked source IDs. The loader reads only the required columns, creates tenant-owned patients and encounters, and creates one generated summary note per encounter from linked condition, medication, and observation rows. It runs the extractor on that generated text and writes audit events in the same transaction.

The loader requires an existing clinic and a clinician belonging to that clinic. Get both UUIDs from API responses, then run from the backend folder after migrations:

```bash
python scripts/seed_synthea.py --tenant-id <TENANT_UUID> --actor-user-id <CLINICIAN_UUID>
```

To load a different Synthea export directory containing those same five filenames:

```bash
python scripts/seed_synthea.py --tenant-id <TENANT_UUID> --actor-user-id <CLINICIAN_UUID> --data-dir path/to/csv-folder
```

The loader uses Synthea IDs as external references and skips encounters already imported for the selected tenant, so the import can be rerun safely. It does not import unused CSV data such as addresses, SSNs, or payer details. Imported note text is labeled as a synthetic Synthea summary and is not clinician-authored prose.

## Vocabulary candidate helper

`scripts/build_vocab.py` reads the Synthea condition and medication CSVs and creates `data/vocabulary_candidates.json` for manual review:

```bash
python scripts/build_vocab.py
```

This script does not seed the database or modify the active extractor vocabulary. Review each candidate's term and source code system before adding a diagnosis mapping to `src/extraction/vocab.py`. Active diagnosis mappings use SNOMED CT; medication matching currently uses names and returns no medication codes. Candidate row counts describe the supplied synthetic export, not clinical prevalence.

## Note extraction

The pure function `src.extraction.extractor.extract(text)` returns four keys:

```json
{
  "diagnoses": [{"term": "hypertension", "code": "38341003"}],
  "medications": [{"name": "lisinopril", "dose": "10mg", "frequency": "daily"}],
  "vitals": {"bp_systolic": 150, "bp_diastolic": 95, "heart_rate": 88},
  "negated": ["chest pain"]
}
```

Diagnosis and medication phrases must be present in `src/extraction/vocab.py`. Regex recognizes decimal medication doses, common frequency expressions, and labeled blood pressure/heart rate. Negation handles a small set of nearby cues such as `denies`, `no`, `without`, and `negative for`. It is a heuristic, can miss clinical context, and does not replace professional review. Extraction currently runs synchronously in the API request; the project does not require Celery or Dramatiq for its current demo workload.

## Frontend demo

The separate React/Vite application in `frontend/` opens on a public project landing page describing the motivation, architecture, tools, design choices, constraints, and improvement roadmap. The sign-in flow leads into the browser workspace for patients, encounters, notes, extraction, analytics, and audit history. It also exposes administrative workflows: Super Admin can create clinics and assign a Records Admin to each; Records Admin can invite clinicians and auditors and review the clinic staff list. Navigation and write controls follow the signed-in user's role, and tenant assignment remains enforced by the API. Use synthetic data only.

Run the backend first, with PostgreSQL and Redis available and migrations applied:

```bash
uvicorn src.main:app --reload
```

In a second terminal, from the `frontend/` directory, install the Node dependencies and start Vite:

```bash
npm install
npm run dev
```

Open the local URL printed by Vite (normally `http://localhost:5173`) and sign in with an account created through the API. During local development, Vite proxies `/api` requests to `http://127.0.0.1:8000`. To point the frontend at another API origin, create `frontend/.env` based on `frontend/.env.example` and set `VITE_API_BASE_URL`; the backend must allow that frontend origin through CORS when the apps are hosted on different origins. The browser session stores its access and refresh tokens in `sessionStorage`; logging out calls the API to revoke the matching token session.

Create a production bundle with:

```bash
npm run build
```

The build is written to `frontend/dist/`. Hosting the frontend separately in production requires configuring the backend's CORS allowed origins for the frontend domain.

## Tests

Run the full suite from the backend folder with the environment active:

```bash
python -m pytest -q
```

Use `python -m pytest -v` to see individual test names. The suite includes extractor examples, login and role behavior, tenant isolation, audit transaction behavior, analytics queries, migration definitions, startup Super Admin bootstrap, and Synthea seed loading. Database-facing tests use mocks/fakes; passing tests do not replace a manual smoke check against a real PostgreSQL and Redis instance.

## Deployment guide

The commands below describe how to deploy the application to an environment you control; they do not imply that a public instance is currently hosted. Configure the API and frontend domains, secrets, database, Redis, and CORS for your chosen provider.


1. Provision PostgreSQL and Redis and configure the production environment variables listed above.
2. Use a strong unique `JWT_SECRET`; never commit `.env` or production credentials.
3. Run `alembic upgrade head` against the production database before the new application version starts.
4. Start the API with `uvicorn src.main:app --host 0.0.0.0 --port $PORT` (adapt the port variable syntax to the deployment platform).
5. Verify `/`, `/docs`, login, tenant setup, tenant isolation, note extraction, analytics, audit access, and Redis-backed logout.
6. If adding Synthea content, use only synthetic records and the documented seed command.

Keep schema migrations as a separate, controlled release step where the platform supports it. Do not use `--reload` in production.
