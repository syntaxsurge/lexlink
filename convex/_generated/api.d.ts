/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as disputes from "../disputes.js";
import type * as dist_events from "../dist/events.js";
import type * as dist_ipAssets from "../dist/ipAssets.js";
import type * as dist_licenses from "../dist/licenses.js";
import type * as dist_trainingBatches from "../dist/trainingBatches.js";
import type * as dist_users from "../dist/users.js";
import type * as events from "../events.js";
import type * as ipAssets from "../ipAssets.js";
import type * as licenses from "../licenses.js";
import type * as trainingBatches from "../trainingBatches.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  disputes: typeof disputes;
  "dist/events": typeof dist_events;
  "dist/ipAssets": typeof dist_ipAssets;
  "dist/licenses": typeof dist_licenses;
  "dist/trainingBatches": typeof dist_trainingBatches;
  "dist/users": typeof dist_users;
  events: typeof events;
  ipAssets: typeof ipAssets;
  licenses: typeof licenses;
  trainingBatches: typeof trainingBatches;
  users: typeof users;
}>;
declare const fullApiWithMounts: typeof fullApi;

export declare const api: FilterApi<
  typeof fullApiWithMounts,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApiWithMounts,
  FunctionReference<any, "internal">
>;

export declare const components: {};
