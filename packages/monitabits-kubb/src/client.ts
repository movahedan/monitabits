/**
 * Client-side exports for use in "use client" React components.
 * Includes SWR hooks and client-side mutator utilities.
 */

// Actions Controller Hooks
export {
	type ActionsControllerCheatMutationKey,
	actionsControllerCheatMutationKey,
	useActionsControllerCheat,
} from "./gen/hooks/actionsController/useActionsControllerCheat";
export {
	type ActionsControllerGetPendingFollowUpQueryKey,
	actionsControllerGetPendingFollowUpQueryKey,
	actionsControllerGetPendingFollowUpQueryOptions,
	useActionsControllerGetPendingFollowUp,
} from "./gen/hooks/actionsController/useActionsControllerGetPendingFollowUp";
export {
	type ActionsControllerHarmMutationKey,
	actionsControllerHarmMutationKey,
	useActionsControllerHarm,
} from "./gen/hooks/actionsController/useActionsControllerHarm";
export {
	type ActionsControllerSubmitFollowUpMutationKey,
	actionsControllerSubmitFollowUpMutationKey,
	useActionsControllerSubmitFollowUp,
} from "./gen/hooks/actionsController/useActionsControllerSubmitFollowUp";
// Health Controller Hooks
export {
	type AppControllerGetStatusQueryKey,
	appControllerGetStatusQueryKey,
	appControllerGetStatusQueryOptions,
	useAppControllerGetStatus,
} from "./gen/hooks/healthController/useAppControllerGetStatus";
// Sessions Controller Hooks
export {
	type SessionsControllerCheckInMutationKey,
	sessionsControllerCheckInMutationKey,
	useSessionsControllerCheckIn,
} from "./gen/hooks/sessionsController/useSessionsControllerCheckIn";
export {
	type SessionsControllerCheckOutMutationKey,
	sessionsControllerCheckOutMutationKey,
	useSessionsControllerCheckOut,
} from "./gen/hooks/sessionsController/useSessionsControllerCheckOut";
export {
	type SessionsControllerGetCurrentSessionQueryKey,
	sessionsControllerGetCurrentSessionQueryKey,
	sessionsControllerGetCurrentSessionQueryOptions,
	useSessionsControllerGetCurrentSession,
} from "./gen/hooks/sessionsController/useSessionsControllerGetCurrentSession";
// Settings Controller Hooks
export {
	type SettingsControllerGetSettingsQueryKey,
	settingsControllerGetSettingsQueryKey,
	settingsControllerGetSettingsQueryOptions,
	useSettingsControllerGetSettings,
} from "./gen/hooks/settingsController/useSettingsControllerGetSettings";
export {
	type SettingsControllerUpdateSettingsMutationKey,
	settingsControllerUpdateSettingsMutationKey,
	useSettingsControllerUpdateSettings,
} from "./gen/hooks/settingsController/useSettingsControllerUpdateSettings";
// Statistics Controller Hooks
export {
	type StatisticsControllerGetDetailsQueryKey,
	statisticsControllerGetDetailsQueryKey,
	statisticsControllerGetDetailsQueryOptions,
	useStatisticsControllerGetDetails,
} from "./gen/hooks/statisticsController/useStatisticsControllerGetDetails";
export {
	type StatisticsControllerGetLockdownNowQueryKey,
	statisticsControllerGetLockdownNowQueryKey,
	statisticsControllerGetLockdownNowQueryOptions,
	useStatisticsControllerGetLockdownNow,
} from "./gen/hooks/statisticsController/useStatisticsControllerGetLockdownNow";
export {
	type StatisticsControllerGetSummaryQueryKey,
	statisticsControllerGetSummaryQueryKey,
	statisticsControllerGetSummaryQueryOptions,
	useStatisticsControllerGetSummary,
} from "./gen/hooks/statisticsController/useStatisticsControllerGetSummary";
// Re-export client mutator
export * from "./mutator.client";
