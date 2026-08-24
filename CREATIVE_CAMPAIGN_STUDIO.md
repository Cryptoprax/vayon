# Creative Campaign Studio & AI Creative Agency

## Architecture

`/vayon/creative/campaigns` is a planning layer over the existing licensed Creative Studio and Brand Studio services. Existing campaigns, projects, brand kits, and assets remain authoritative. The route inherits the centralized `creative_studio` permission and tenant boundaries.

## Campaign lifecycle

The lifecycle contract supports Draft, Review, Approved, Scheduled, Published, and Archived. Sprint 128 creates blueprints only: it does not persist transitions, publish content, or generate assets. Every proposed deliverable requires Creative Review, Brand Review, and Management Approval.

## Creative Director orchestration

Users interact with a single Creative Director. `buildCampaignBlueprint()` deterministically validates the brief, assigns each deliverable to a specialized department, calculates dependencies, estimates outputs and completion days, evaluates brand and creative readiness, and returns explainable recommendations and risks. It has no provider calls and cannot execute tasks.

## Department responsibilities

- Brand Designer: identity, guidelines, colour, typography, and brand collateral.
- Graphic Designer: campaign graphics, brochures, flyers, images, and mockups.
- Presentation Designer: pitch decks and sales presentations.
- Copywriter: proposals, documents, product information, and long-form copy.
- Motion Designer and Video Producer: future motion and video deliverables.
- Social Media Manager: channel-specific social packages.
- Advertising Specialist: search, display, and paid-social specifications.
- Landing Page Designer: conversion page structures.
- Email Marketing Specialist: lifecycle and campaign email sequences.

## Blueprint model

Blueprints contain deliverables, departments, dependencies, output estimates, completion estimates, required approvals, brand/creative readiness, creative score, completeness, missing assets, recommendations, and risks. Every task is `planned`; execution is explicitly disabled and provider state is unavailable.

## Future provider integration

Future providers integrate behind the Creative Director execution boundary. They must accept structured blueprint tasks and return governed results without changing Campaign Studio, while respecting permissions, entitlements, approvals, audit history, and workspace isolation.

## Roadmap

1. Add approved campaign/project blueprint persistence.
2. Add workflow-backed reviews, assignments, and lifecycle transitions.
3. Connect specialized workers through the existing AI runtime.
4. Add provider adapters without changing orchestration contracts.
5. Add governed Campaign ZIP and creative/brand/presentation/marketing package exporters.

No provider was connected, no image/video/asset was generated, and authentication, Founder RBAC, permissions, subscriptions, billing, deployment, production configuration, and reconciliation remain unchanged.
