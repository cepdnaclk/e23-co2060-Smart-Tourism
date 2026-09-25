---
layout: home
permalink: index.html

# Repository and Project Information
repository-name: e23-co2060-Smart-Tourism
title: Smart Tourism Management System
---

[comment]: # "Standard Jekyll documentation layout for Department of Computer Engineering project showcase"

# Smart Tourism Management System

---

## Team
-  E/23/161, Kanchana K.L.A.Y.R., [e23161@eng.pdn.ac.lk](mailto:e23161@eng.pdn.ac.lk)
-  E/23/187, Kumarasinghe K.M.D.S., [e23187@eng.pdn.ac.lk](mailto:e23187@eng.pdn.ac.lk)
-  E/23/202, Liyanagama K.L.D.H., [e23202@eng.pdn.ac.lk](mailto:e23202@eng.pdn.ac.lk)
-  E/23/300, Ranathunga S.M.R.S., [e23300@eng.pdn.ac.lk](mailto:e23300@eng.pdn.ac.lk)

#### Table of Contents
1. [Introduction](#introduction)
2. [Solution Architecture](#solution-architecture)
3. [Software Designs](#software-designs)
4. [Testing](#testing)
5. [Conclusion](#conclusion)
6. [Links](#links)

---

## Introduction

### Problem Statement
The modern travel industry—particularly in rapidly developing travel destinations such as Sri Lanka—suffers from severe operational fragmentation. Tourists face multiple disconnected hurdles when planning trips:
1. **Disjointed Trip Planning**: Travelers use separate platforms for discovering attractions, planning geographical routes, and calculating driving times, often leading to unrealistic schedules.
2. **Unverified Local Guides & Middleman Exploitation**: Finding credible, licensed local guides is difficult. Traditional booking agencies charge heavy middleman commissions (often 20%–40%), while independent tour guides struggle to reach global travelers directly.
3. **Opaque Pricing & Communication Barriers**: Haggling occurs over informal channels without standardized itineraries, leading to price ambiguity, unexpected surcharges, and lack of accountability.

### The Solution: Smart Tourism SaaS Platform
The **Smart Tourism Management System** is a unified, full-stack web platform designed to streamline travel coordination between tourists, travel guides, and administrators:
- **Interactive Routing & Itinerary Planning**: Tourists visually organize destinations on an interactive map with turn-by-turn road route generation, waypoints, and distance calculations powered by OpenRouteService and GraphHopper.
- **Intelligent Guide Matchmaking**: An automated algorithmic matching engine pairs tourists with local guides based on itinerary locations, guides' covered regions, domain specializations, and experience.
- **Direct Quoting & Real-Time Negotiation**: Guides provide direct quotes in multiple currencies (LKR / USD), and both parties coordinate itineraries via real-time WebSocket messaging.
- **Vetted Community & Governance**: A human-in-the-loop admin verification process ensures all registered guides hold official licenses, paired with dual-sided ratings and reviews.

### Impact
- **Empowering Local Guides**: Eliminates exploitative broker fees, providing direct market access to licensed guides and boosting their local earning potential.
- **Enhanced Tourist Experience**: Cuts itinerary planning time from hours to minutes while preventing travel scams through verified credentials and fixed transparent quotes.
- **Scalable Architecture**: Provides a resilient, decoupled foundation capable of expanding across regional tourism sectors.

---

## Solution Architecture

The Smart Tourism Platform follows a **Decoupled 3-Tier Client-Server Architecture** augmented with an asynchronous real-time event layer and external geospatial services.

### Architectural Breakdown

<!-- to do -->

### Tier Descriptions & Component Interactions

1. **Presentation Tier (Frontend)**:
   - Built as a Single Page Application (SPA) using **React 18** and styled with modular CSS and **Framer Motion** animations.
   - Utilizes **Leaflet** and **React-Leaflet** for interactive mapping, waypoint rendering, and polyline visualization.
   - State management is handled through React Contexts (`AuthContext` for JWT session persistence and `PlaceContext` for active destination filtering).
   - Real-time bidirectional updates are consumed via `socket.io-client`.

2. **Application Tier (Backend)**:
   - Built on **Node.js** with **Express 5**, organized according to the **Repository Pattern** to separate routing/controllers from SQL queries.
   - **Authentication & RBAC**: Implements stateless JSON Web Tokens (JWT) and Bcrypt hashing to enforce strict role-based access controls across `tourist`, `guide`, and `admin` roles.
   - **Real-Time Communication Layer**: An integrated **Socket.IO** server manages isolated broadcast rooms (`booking_{bookingId}` for conversation threads and `user_{userId}` for global notifications).

3. **Data Persistence Tier (Database)**:
   - Powered by **PostgreSQL 16** managed through connection pooling (`pg.Pool`).
   - Enforces relational constraints (such as `ON DELETE CASCADE` for user dependencies and `ON DELETE RESTRICT` for places attached to active itineraries), automated triggers for timestamp tracking, and composite indices for fast query lookups.

4. **External Services Tier**:
   - **Geospatial & Routing APIs**: Direct integration with **OpenRouteService** and **GraphHopper** using coordinate waypoints to compute road driving geometry and distances.
   - **Map Tiles**: Served via OpenStreetMap (OSM) standard tile servers.

---

## Software Designs

### 1. Architectural & Design Patterns
- **Repository Pattern**: All database interactions are encapsulated inside repository modules (`bookingRepo.js`, `itineraryRepo.js`, `placesRepo.js`, `userRepo.js`), keeping controllers focused exclusively on HTTP orchestration and business logic.
- **Observer Pattern (WebSockets)**: Leveraged via Socket.IO to asynchronously publish and subscribe to chat messages, price quote updates, and system-wide notifications without client polling.
- **Centralized Context Pattern**: Frontend state is decoupled using React Context providers (`AuthContext`, `PlaceContext`), ensuring global accessibility of credentials and cart/itinerary state.

### 2. Database Design & Relational Data Modeling
The database schema consists of 8 core entities designed to maintain integrity and prevent orphaned data:
- `users`: Core account table storing email, hashed password, role (`tourist`, `guide`, `admin`), and verification flag.
- `tourist_profiles` & `guide_profiles`: 1-to-1 extension tables storing biographical data, contact numbers, languages, profile pictures, license numbers, hourly rates, and admin approval status (`is_approved`).
- `places`: Catalog of verified tourist spots with precise decimal coordinates (`latitude`, `longitude`), category tags, and descriptions.
- `itineraries` & `itinerary_items`: 1-to-many relationship mapping itineraries to ordered place sequences. The `visit_order` column maintains sequence order, while a unique composite index (`idx_itinerary_items_itinerary_place`) prevents duplicate stops within the same trip.
- `bookings`: Central transaction table tracking itinerary bookings, status workflow (`pending`, `quoted`, `accepted`, `rejected`, `cancelled`), quoted prices, and currency codes (`LKR`, `USD`).
- `booking_messages`: Chat messages bound to a specific booking, with audit fields (`is_edited`, `is_deleted`, `created_at`, `updated_at`).
- `place_reviews` & `guide_reviews`: Community review tables with database-level `CHECK (rating >= 1 AND rating <= 5)` constraints.
- `notifications`: User-centric notification log with read/unread tracking and reference entity IDs.

### 3. Authentication, Authorization & Security Architecture
- **Password Protection**: Passwords are salted and hashed using `bcrypt` (10 rounds) before persistence.
- **Stateless Session Management**: Authenticated requests require a Bearer JWT signed with a server secret key, encoding user ID and role with a 24-hour expiration window.
- **Route Guarding**: Frontend routes are guarded using a `ProtectedRoute` wrapper component that evaluates role access. The backend verifies incoming JWTs via middleware before delegating to controller logic.
- **Data Protection Rules**: Message edits are strictly governed—users can only edit their own messages within a strict 1-hour window from creation.

### 4. Interactive Itinerary Planning & Routing Engine
- **Waypoint Routing**: Tourists select destinations that dynamically plot markers on Leaflet maps.
- **Dual-Provider Routing with Fallback**: The client requests full driving coordinates from OpenRouteService. If the request fails or quota is exhausted, it seamlessly falls back to the GraphHopper API, decoding encoded routing polylines into map paths. If both external APIs are unreachable, straight dashed vector coordinates render as a safety net.

### 5. Guide Matchmaking Algorithm
Guides are recommended for a tourist's itinerary using a deterministic multi-factor scoring algorithm:
$$\text{Match Score} = S_{\text{location}} + S_{\text{specialization}} + S_{\text{experience}}$$
- **Location Coverage ($S_{\text{location}}$)**: $+10$ points for every itinerary place matching the guide's declared coverage areas (or $+10$ per place for island-wide guides).
- **Specialization ($S_{\text{specialization}}$)**: $+5$ bonus points if the guide's specialization aligns with the destination categories in the itinerary.
- **Experience ($S_{\text{experience}}$)**: $+1$ bonus point per year of verified guide experience (capped at $10$ points).
- **Sorting Rank**: Candidates are filtered by matching places ($> 0$), ranked primarily by the number of covered places (descending), and secondarily by the composite match score.

### 6. Real-Time Negotiation & Booking Workflow

<!-- to do -->


### 7. Gamification & Community Feedback Engine
- **XP Calculation**: Tourist activity is gamified through experience points calculated as:
  $$\text{XP} = (\text{Itineraries Created} \times 50) + (\text{Place Reviews Written} \times 20)$$
- **Social Proof**: Aggregate star ratings and written reviews are computed on both attractions and tour guides to assist prospective travelers.

---

## Testing

A comprehensive testing pyramid was implemented across the application, combining automated Unit Testing, Database Integration Testing, End-to-End (E2E) Browser Testing, and Continuous Integration (CI).

### 1. Unit Testing (Server & Client)
- **Framework**: Jest & Supertest.
- **Scope**:
  - `authController.test.js`: Validates cryptographic hashing behavior with `bcrypt`, ensures mismatched passwords return `false`, tests JWT creation, payload decoding, and ensures tampered tokens are rejected with exceptions.
  - `systemController.test.js`: Validates system health endpoints (`/api/status`) verifying payload structure, project metadata, and HTTP 200 responses without requiring a database connection.
  - `App.test.js`: React unit smoke tests leveraging `@testing-library/react` to ensure the component tree mounts and renders critical DOM nodes without crashing.

### 2. Integration Testing (Database & API)
- **Framework**: Jest with Supertest executing against a dedicated, live PostgreSQL test instance.
- **Scope**:
  - `auth.integration.test.js`: Verifies full HTTP registration cycles with parameter validation, catches duplicate email registration attempts ($HTTP\ 400+$), validates valid logins ($HTTP\ 200$), and ensures invalid credentials return $HTTP\ 401$.
  - `places.integration.test.js`: Creates dynamic database place fixtures, queries `/api/places` with text filters, confirms response payload shapes, and tears down test fixtures cleanly using `afterAll` hooks.

### 3. End-to-End (E2E) Browser Testing
- **Framework**: Playwright (`@playwright/test`).
- **Scope**:
  - `smoke.spec.js`: Confirms root accessibility, validates homepage title tags, ensures the DOM is populated, and performs a live check on the backend API `/api/status`.
  - `auth.spec.js`: Simulates a complete user journey—navigates to homepage, clicks registration, fills in user details (name, email, phone, role, password), intercepts the `POST /api/auth/register` network call, validates response code $201$, and asserts automatic navigation to the `/dashboard` page upon success.

### 4. Automated CI/CD Pipeline
Continuous integration is orchestrated using **GitHub Actions** (`.github/workflows/ci.yml`) on every push and pull request to `main` and `dev` branches:
- **`server-unit`**: Executes isolated unit tests and outputs coverage reports.
- **`client-unit`**: Runs React unit test suites in CI mode.
- **`server-integration`**: Automatically provisions a containerized `postgres:16-alpine` service, executes database migrations (`npm run db:migrate`), and runs integration tests.
- **`e2e`**: Depends on all unit and integration jobs. Spawns an ephemeral PostgreSQL database, runs migrations and seed scripts, builds the React frontend in production mode, spins up background server/client instances, waits for readiness via `wait-on`, and executes Playwright tests across headless Chromium.
- **`build`**: Produces and preserves production build artifacts for deployment.

### 5. Summary of Test Results

<!-- to do -->

---

## Conclusion

### What Was Achieved
The Smart Tourism Management System successfully delivers an integrated, production-ready solution that bridges the gap between independent travelers and certified local guides:
- Developed a high-performance web platform featuring interactive GIS mapping with turn-by-turn road calculations and automatic fallback routing.
- Engineered a deterministic matchmaking engine ensuring relevant guide discovery based on location coverage and domain expertise.
- Integrated real-time bidirectional negotiation and communication tools using WebSockets with multi-currency quotation support (LKR and USD).
- Implemented human-in-the-loop admin governance, authentication guards, community review mechanisms, and activity-driven gamification.
- Established an industry-grade quality assurance pipeline combining unit tests, database-backed integration tests, and Playwright E2E tests inside GitHub Actions CI.

### Future Developments
1. **Spatial Queries via PostGIS**: Migrating latitude and longitude decimal columns to PostGIS `GEOMETRY(Point, 4326)` types to enable spatial radius queries (`ST_DWithin`) for proximity-based attraction discovery.
2. **AI-Assisted Itinerary Generator**: Integrating Generative AI / Large Language Models (LLMs) to automatically recommend optimized day-by-day itineraries based on traveler interests, weather conditions, and pace preferences.
3. **Cross-Platform Mobile Application**: Extending the platform to iOS and Android via React Native to enable on-the-go GPS tracking and instant messaging during active tours.
4. **Escrow Payment Integration**: Introducing digital payment gateways (e.g., Stripe, PayHere) with escrow-based fund releases to secure financial transactions between tourists and guides.

### Commercialization Plans
- **Tiered Model for Guides**: Offering free basic profiles with commission-free introductory bookings, alongside premium subscription tiers providing enhanced profile visibility, featured matchmaking placement, and advanced analytics.
- **Institutional Partnerships**: Collaborating with regional bodies such as the Sri Lanka Tourism Development Authority (SLTDA) and certified hotel associations to onboard registered tourist guides and promote verified heritage tours.

---

## Links

- [Project Repository](https://github.com/cepdnaclk/{{ page.repository-name }}){:target="_blank"}
- [Project Page](https://cepdnaclk.github.io/{{ page.repository-name}}){:target="_blank"}
- [Department of Computer Engineering](http://www.ce.pdn.ac.lk/)
- [University of Peradeniya](https://eng.pdn.ac.lk/)
