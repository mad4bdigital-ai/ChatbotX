# Data Model v2

Only new durable entities that close proven gaps are proposed. Existing sequence/CAPI/audience tables remain authoritative for their current responsibilities.

## MessagingConsent
Current materialized authorization state.

- id
- workspaceId
- contactId
- channel (`whatsapp`, extensible)
- purpose (`marketing`, `service`, `ads_audience`)
- status (`granted`, `revoked`, `unknown`)
- capturedAt / revokedAt
- source
- consentTextVersion
- actorType / actorId
- evidence JSONB
- externalReference
- createdAt / updatedAt

Unique: `(workspaceId, contactId, channel, purpose)`.

## MessagingConsentEvent
Append-only history for every state transition/import/correction.

- id, workspaceId, contactId, consentId
- action
- occurredAt
- source / consentTextVersion
- actorType / actorId
- previousStatus / nextStatus
- evidence JSONB

## AttributionTouch
Append-only multi-touch evidence; complements, never replaces, `ContactInbox.referral`.

- id, workspaceId, contactId
- contactInboxId / conversationId
- channel
- occurredAt
- touchType
- providerMessageId or providerEventId where available
- ctwaClid
- rawReferral JSONB
- sourceId/sourceType/sourceUrl/headline/body/media metadata
- adId/adName
- adSetId/adSetName
- campaignId/campaignName
- enrichmentSource/enrichmentVersion/enrichedAt/enrichmentStatus

Uniqueness/idempotency should use provider identity + workspace/inbox where available, with a deterministic fallback fingerprint for referral payloads lacking a provider event id.

## Pipeline
- id, workspaceId, name, isDefault, archivedAt

## PipelineStage
- id, workspaceId, pipelineId, name, position
- terminalKind: `none | won | lost`

## Deal
- id, workspaceId, contactId, pipelineId, stageId
- ownerUserId
- title
- status: `open | won | lost`
- amount / currency
- expectedCloseAt
- sourceAttributionTouchId nullable
- wonAt / lostAt / lostReason
- externalSystem / externalId / sourceVersion
- createdAt / updatedAt

## DealActivity
- id, workspaceId, dealId
- type (`stage_change`, `owner_change`, `note`, `sync`, `conversion`)
- payload JSONB
- actorType / actorId
- createdAt

## ExternalObjectLink
- id, workspaceId
- objectType (`contact`, `deal`, `order`)
- localId
- externalSystem
- externalId
- lastSourceVersion
- lastSyncAt

Unique: `(workspaceId, externalSystem, objectType, externalId)`.

## ConversionDeliveryAttempt — optional extension
Add only if current ErrorLog/status cannot provide the acceptance-required operator history.

- id, workspaceId
- pipelineType (`ads_conversion_event`, `meta_capi_event`)
- localEventId
- attemptNumber
- provider
- status
- requestFingerprint
- providerCode / redactedProviderMessage
- attemptedAt / nextRetryAt
- replayedBy / replayedAt

This table MUST NOT become a third conversion-event source of truth.

## AudienceMembership — reconciliation state
Reuse existing provider adapter and audience identifiers.

- workspaceId
- provider
- externalAudienceId
- contactId
- desiredState (`present`, `absent`)
- providerState (`unknown`, `present`, `absent`, `error`)
- permissionSnapshot/status reference
- lastAttemptAt / lastSuccessAt / lastErrorCode

Do not persist unnecessary unhashed provider match payloads.

## Existing sequence model policy
Do NOT replace `ContactsOnSequence` / `SequenceDispatch`. Add fields only if characterization shows existing fields cannot represent:
- stop reason / stoppedAt;
- re-entry generation/history pointer;
- timezone snapshot or schedule-resolution status.
Prefer separate enrollment-history/event rows over widening the hot scheduler table if that keeps current scheduler paths simpler.
