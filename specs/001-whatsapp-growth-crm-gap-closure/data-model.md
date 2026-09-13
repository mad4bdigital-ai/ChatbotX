# Data Model

## MessagingConsent

Current materialized authorization state.

- id
- workspaceId
- contactId
- channel (`whatsapp`, extensible)
- purpose (`marketing`, `service`, `ads_audience`)
- status (`granted`, `revoked`, `unknown`)
- capturedAt
- revokedAt
- source (`ctwa_flow`, `agent`, `api`, `import`, `keyword`, `web_form`, etc.)
- consentTextVersion
- actorType / actorId
- evidence JSONB
- externalReference
- createdAt / updatedAt

Unique: `(workspaceId, contactId, channel, purpose)`

## MessagingConsentEvent

Append-only consent history.

- id, workspaceId, contactId, consentId
- action (`grant`, `revoke`, `import`, `correct`)
- occurredAt
- source, textVersion, actorType/actorId
- evidence JSONB
- previousStatus / nextStatus

## AttributionTouch

- id, workspaceId, contactId, contactInboxId/conversationId
- channel
- touchType (`ctwa`, `messenger_ad`, `instagram_ad`, `organic`, `external`)
- occurredAt
- ctwaClid
- rawReferral JSONB
- sourceId/sourceType/sourceUrl
- headline/body/media metadata
- adId/adName
- adSetId/adSetName
- campaignId/campaignName
- enrichmentSource / enrichmentVersion / enrichedAt
- enrichmentStatus/errorCode

Immutable evidence fields; enrichment fields can be appended/versioned.

## SequenceEnrollment extension

Required logical fields if not already present:

- status
- nextActionAt
- lastExecutedStepId
- entryCount
- entryPolicy / cooldownUntil
- stoppedAt / stopReason
- pauseReason
- terminalEventId
- timezoneSnapshot

## Pipeline

- id, workspaceId, name, isDefault, archivedAt

## PipelineStage

- id, workspaceId, pipelineId, name, position, terminalKind (`none`, `won`, `lost`)

## Deal

- id, workspaceId, contactId, pipelineId, stageId
- ownerUserId
- title
- status (`open`, `won`, `lost`)
- amount / currency
- expectedCloseAt
- sourceAttributionTouchId
- wonAt / lostAt / lostReason
- externalSystem / externalId / sourceVersion
- createdAt / updatedAt

## DealActivity

- id, workspaceId, dealId
- type (`stage_change`, `owner_change`, `note`, `message_link`, `sync`, `conversion`)
- payload JSONB
- actorType / actorId
- createdAt

## ExternalObjectLink

Generic CRM sync identity map.

- id, workspaceId
- objectType (`contact`, `deal`, `order`)
- localId
- externalSystem
- externalId
- lastSourceVersion
- lastSyncAt

Unique: `(workspaceId, externalSystem, objectType, externalId)`

## ConversionDeliveryAttempt

- id, workspaceId, conversionEventId
- provider
- attemptNumber
- requestFingerprint
- status (`accepted`, `retryable_failed`, `permanent_failed`, `skipped`, `replayed`)
- providerCode / providerMessageRedacted
- attemptedAt
- nextRetryAt
- responseMetadata JSONB (PII-safe)

## AudienceSync / AudienceMembership

AudienceSync:
- id, workspaceId, provider, externalAudienceId, segmentDefinition, enabled

AudienceMembership:
- workspaceId, audienceSyncId, contactId, desiredState, providerState, lastAttemptAt, lastErrorCode
