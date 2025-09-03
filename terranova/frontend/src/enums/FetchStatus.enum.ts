/**
 * An enum for tracking the fetching status of a remote resource.
 */
export enum FetchStatus {
    /**
     * A fetch for a resource has not yet been dispatched
     */
    NOT_FETCHED = "NOT FETCHED",
    /**
     * A fetch for a resource has been dispatched and the result is pending
     */
    FETCHING = "FETCHING",
    /**
     * A fetch has been been dispatched and the resource's data has been
     * retrieved with no errors.
     */
    FETCH_SUCCESS = "FETCH SUCCESS",
    /**
     * A fetch has been dispatched but the resource data was not able to
     * be retrived due to an error.
     */
    FETCH_FAILURE = "FETCH FAILURE",
}
