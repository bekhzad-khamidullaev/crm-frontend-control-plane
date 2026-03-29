/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Customer } from '../models/Customer';
import type { Deployment } from '../models/Deployment';
import type { FeatureCatalog } from '../models/FeatureCatalog';
import type { LicenseActionAudit } from '../models/LicenseActionAudit';
import type { LicenseBundle } from '../models/LicenseBundle';
import type { LicenseIssue } from '../models/LicenseIssue';
import type { PaginatedCustomerList } from '../models/PaginatedCustomerList';
import type { PaginatedDeploymentList } from '../models/PaginatedDeploymentList';
import type { PaginatedFeatureCatalogList } from '../models/PaginatedFeatureCatalogList';
import type { PaginatedLicenseActionAuditList } from '../models/PaginatedLicenseActionAuditList';
import type { PaginatedLicenseBundleList } from '../models/PaginatedLicenseBundleList';
import type { PaginatedLicenseIssueList } from '../models/PaginatedLicenseIssueList';
import type { PaginatedPlanList } from '../models/PaginatedPlanList';
import type { PaginatedRuntimeLicenseRequestList } from '../models/PaginatedRuntimeLicenseRequestList';
import type { PaginatedSubscriptionList } from '../models/PaginatedSubscriptionList';
import type { PatchedCustomer } from '../models/PatchedCustomer';
import type { PatchedDeployment } from '../models/PatchedDeployment';
import type { PatchedFeatureCatalog } from '../models/PatchedFeatureCatalog';
import type { PatchedLicenseActionAudit } from '../models/PatchedLicenseActionAudit';
import type { PatchedLicenseBundle } from '../models/PatchedLicenseBundle';
import type { PatchedLicenseIssue } from '../models/PatchedLicenseIssue';
import type { PatchedPlan } from '../models/PatchedPlan';
import type { PatchedRuntimeLicenseRequest } from '../models/PatchedRuntimeLicenseRequest';
import type { PatchedSubscription } from '../models/PatchedSubscription';
import type { Plan } from '../models/Plan';
import type { RuntimeLicenseRequest } from '../models/RuntimeLicenseRequest';
import type { Subscription } from '../models/Subscription';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class CpService {
    /**
     * @returns PaginatedLicenseBundleList
     * @throws ApiError
     */
    public static cpBundlesList({
        ordering,
        page,
        pageSize,
        search,
    }: {
        /**
         * Which field to use when ordering the results.
         */
        ordering?: string,
        /**
         * A page number within the paginated result set.
         */
        page?: number,
        /**
         * Number of results to return per page.
         */
        pageSize?: number,
        /**
         * A search term.
         */
        search?: string,
    }): CancelablePromise<PaginatedLicenseBundleList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/cp/bundles/',
            query: {
                'ordering': ordering,
                'page': page,
                'page_size': pageSize,
                'search': search,
            },
        });
    }
    /**
     * @returns LicenseBundle
     * @throws ApiError
     */
    public static cpBundlesCreate({
        requestBody,
    }: {
        requestBody: LicenseBundle,
    }): CancelablePromise<LicenseBundle> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/cp/bundles/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns LicenseBundle
     * @throws ApiError
     */
    public static cpBundlesRetrieve({
        id,
    }: {
        /**
         * A unique integer value identifying this License Bundle.
         */
        id: number,
    }): CancelablePromise<LicenseBundle> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/cp/bundles/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @returns LicenseBundle
     * @throws ApiError
     */
    public static cpBundlesUpdate({
        id,
        requestBody,
    }: {
        /**
         * A unique integer value identifying this License Bundle.
         */
        id: number,
        requestBody: LicenseBundle,
    }): CancelablePromise<LicenseBundle> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/cp/bundles/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns LicenseBundle
     * @throws ApiError
     */
    public static cpBundlesPartialUpdate({
        id,
        requestBody,
    }: {
        /**
         * A unique integer value identifying this License Bundle.
         */
        id: number,
        requestBody?: PatchedLicenseBundle,
    }): CancelablePromise<LicenseBundle> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/cp/bundles/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns void
     * @throws ApiError
     */
    public static cpBundlesDestroy({
        id,
    }: {
        /**
         * A unique integer value identifying this License Bundle.
         */
        id: number,
    }): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/cp/bundles/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @returns LicenseBundle
     * @throws ApiError
     */
    public static cpBundlesRenewCreate({
        id,
        requestBody,
    }: {
        /**
         * A unique integer value identifying this License Bundle.
         */
        id: number,
        requestBody: LicenseBundle,
    }): CancelablePromise<LicenseBundle> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/cp/bundles/{id}/renew/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns LicenseBundle
     * @throws ApiError
     */
    public static cpBundlesSupportCreate({
        id,
        requestBody,
    }: {
        /**
         * A unique integer value identifying this License Bundle.
         */
        id: number,
        requestBody: LicenseBundle,
    }): CancelablePromise<LicenseBundle> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/cp/bundles/{id}/support/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns PaginatedCustomerList
     * @throws ApiError
     */
    public static cpCustomersList({
        ordering,
        page,
        pageSize,
        search,
    }: {
        /**
         * Which field to use when ordering the results.
         */
        ordering?: string,
        /**
         * A page number within the paginated result set.
         */
        page?: number,
        /**
         * Number of results to return per page.
         */
        pageSize?: number,
        /**
         * A search term.
         */
        search?: string,
    }): CancelablePromise<PaginatedCustomerList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/cp/customers/',
            query: {
                'ordering': ordering,
                'page': page,
                'page_size': pageSize,
                'search': search,
            },
        });
    }
    /**
     * @returns Customer
     * @throws ApiError
     */
    public static cpCustomersCreate({
        requestBody,
    }: {
        requestBody: Customer,
    }): CancelablePromise<Customer> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/cp/customers/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns Customer
     * @throws ApiError
     */
    public static cpCustomersRetrieve({
        id,
    }: {
        /**
         * A unique integer value identifying this Customer.
         */
        id: number,
    }): CancelablePromise<Customer> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/cp/customers/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @returns Customer
     * @throws ApiError
     */
    public static cpCustomersUpdate({
        id,
        requestBody,
    }: {
        /**
         * A unique integer value identifying this Customer.
         */
        id: number,
        requestBody: Customer,
    }): CancelablePromise<Customer> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/cp/customers/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns Customer
     * @throws ApiError
     */
    public static cpCustomersPartialUpdate({
        id,
        requestBody,
    }: {
        /**
         * A unique integer value identifying this Customer.
         */
        id: number,
        requestBody?: PatchedCustomer,
    }): CancelablePromise<Customer> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/cp/customers/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns void
     * @throws ApiError
     */
    public static cpCustomersDestroy({
        id,
    }: {
        /**
         * A unique integer value identifying this Customer.
         */
        id: number,
    }): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/cp/customers/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Returns True when the argument is true, False otherwise.
     * The builtins True and False are the only two instances of the class bool.
     * The class bool is a subclass of the class int, and cannot be subclassed.
     * @returns Customer
     * @throws ApiError
     */
    public static cpCustomersDetailRetrieve({
        id,
    }: {
        /**
         * A unique integer value identifying this Customer.
         */
        id: number,
    }): CancelablePromise<Customer> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/cp/customers/{id}/detail/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @returns PaginatedDeploymentList
     * @throws ApiError
     */
    public static cpDeploymentsList({
        ordering,
        page,
        pageSize,
        search,
    }: {
        /**
         * Which field to use when ordering the results.
         */
        ordering?: string,
        /**
         * A page number within the paginated result set.
         */
        page?: number,
        /**
         * Number of results to return per page.
         */
        pageSize?: number,
        /**
         * A search term.
         */
        search?: string,
    }): CancelablePromise<PaginatedDeploymentList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/cp/deployments/',
            query: {
                'ordering': ordering,
                'page': page,
                'page_size': pageSize,
                'search': search,
            },
        });
    }
    /**
     * @returns Deployment
     * @throws ApiError
     */
    public static cpDeploymentsCreate({
        requestBody,
    }: {
        requestBody: Deployment,
    }): CancelablePromise<Deployment> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/cp/deployments/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns Deployment
     * @throws ApiError
     */
    public static cpDeploymentsRetrieve({
        id,
    }: {
        /**
         * A unique integer value identifying this Deployment.
         */
        id: number,
    }): CancelablePromise<Deployment> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/cp/deployments/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @returns Deployment
     * @throws ApiError
     */
    public static cpDeploymentsUpdate({
        id,
        requestBody,
    }: {
        /**
         * A unique integer value identifying this Deployment.
         */
        id: number,
        requestBody: Deployment,
    }): CancelablePromise<Deployment> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/cp/deployments/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns Deployment
     * @throws ApiError
     */
    public static cpDeploymentsPartialUpdate({
        id,
        requestBody,
    }: {
        /**
         * A unique integer value identifying this Deployment.
         */
        id: number,
        requestBody?: PatchedDeployment,
    }): CancelablePromise<Deployment> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/cp/deployments/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns void
     * @throws ApiError
     */
    public static cpDeploymentsDestroy({
        id,
    }: {
        /**
         * A unique integer value identifying this Deployment.
         */
        id: number,
    }): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/cp/deployments/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @returns Deployment
     * @throws ApiError
     */
    public static cpDeploymentsAssignLicenseCreate({
        id,
        requestBody,
    }: {
        /**
         * A unique integer value identifying this Deployment.
         */
        id: number,
        requestBody: Deployment,
    }): CancelablePromise<Deployment> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/cp/deployments/{id}/assign-license/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns Deployment
     * @throws ApiError
     */
    public static cpDeploymentsUnlicensedRetrieve(): CancelablePromise<Deployment> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/cp/deployments/unlicensed/',
        });
    }
    /**
     * @returns PaginatedFeatureCatalogList
     * @throws ApiError
     */
    public static cpFeaturesList({
        ordering,
        page,
        pageSize,
        search,
    }: {
        /**
         * Which field to use when ordering the results.
         */
        ordering?: string,
        /**
         * A page number within the paginated result set.
         */
        page?: number,
        /**
         * Number of results to return per page.
         */
        pageSize?: number,
        /**
         * A search term.
         */
        search?: string,
    }): CancelablePromise<PaginatedFeatureCatalogList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/cp/features/',
            query: {
                'ordering': ordering,
                'page': page,
                'page_size': pageSize,
                'search': search,
            },
        });
    }
    /**
     * @returns FeatureCatalog
     * @throws ApiError
     */
    public static cpFeaturesCreate({
        requestBody,
    }: {
        requestBody: FeatureCatalog,
    }): CancelablePromise<FeatureCatalog> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/cp/features/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns FeatureCatalog
     * @throws ApiError
     */
    public static cpFeaturesRetrieve({
        id,
    }: {
        /**
         * A unique integer value identifying this Feature.
         */
        id: number,
    }): CancelablePromise<FeatureCatalog> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/cp/features/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @returns FeatureCatalog
     * @throws ApiError
     */
    public static cpFeaturesUpdate({
        id,
        requestBody,
    }: {
        /**
         * A unique integer value identifying this Feature.
         */
        id: number,
        requestBody: FeatureCatalog,
    }): CancelablePromise<FeatureCatalog> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/cp/features/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns FeatureCatalog
     * @throws ApiError
     */
    public static cpFeaturesPartialUpdate({
        id,
        requestBody,
    }: {
        /**
         * A unique integer value identifying this Feature.
         */
        id: number,
        requestBody?: PatchedFeatureCatalog,
    }): CancelablePromise<FeatureCatalog> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/cp/features/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns void
     * @throws ApiError
     */
    public static cpFeaturesDestroy({
        id,
    }: {
        /**
         * A unique integer value identifying this Feature.
         */
        id: number,
    }): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/cp/features/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @returns PaginatedLicenseActionAuditList
     * @throws ApiError
     */
    public static cpLicenseAuditList({
        ordering,
        page,
        pageSize,
        search,
    }: {
        /**
         * Which field to use when ordering the results.
         */
        ordering?: string,
        /**
         * A page number within the paginated result set.
         */
        page?: number,
        /**
         * Number of results to return per page.
         */
        pageSize?: number,
        /**
         * A search term.
         */
        search?: string,
    }): CancelablePromise<PaginatedLicenseActionAuditList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/cp/license-audit/',
            query: {
                'ordering': ordering,
                'page': page,
                'page_size': pageSize,
                'search': search,
            },
        });
    }
    /**
     * @returns LicenseActionAudit
     * @throws ApiError
     */
    public static cpLicenseAuditCreate({
        requestBody,
    }: {
        requestBody: LicenseActionAudit,
    }): CancelablePromise<LicenseActionAudit> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/cp/license-audit/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns LicenseActionAudit
     * @throws ApiError
     */
    public static cpLicenseAuditRetrieve({
        id,
    }: {
        /**
         * A unique integer value identifying this License Audit Event.
         */
        id: number,
    }): CancelablePromise<LicenseActionAudit> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/cp/license-audit/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @returns LicenseActionAudit
     * @throws ApiError
     */
    public static cpLicenseAuditUpdate({
        id,
        requestBody,
    }: {
        /**
         * A unique integer value identifying this License Audit Event.
         */
        id: number,
        requestBody: LicenseActionAudit,
    }): CancelablePromise<LicenseActionAudit> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/cp/license-audit/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns LicenseActionAudit
     * @throws ApiError
     */
    public static cpLicenseAuditPartialUpdate({
        id,
        requestBody,
    }: {
        /**
         * A unique integer value identifying this License Audit Event.
         */
        id: number,
        requestBody?: PatchedLicenseActionAudit,
    }): CancelablePromise<LicenseActionAudit> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/cp/license-audit/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns void
     * @throws ApiError
     */
    public static cpLicenseAuditDestroy({
        id,
    }: {
        /**
         * A unique integer value identifying this License Audit Event.
         */
        id: number,
    }): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/cp/license-audit/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @returns PaginatedLicenseIssueList
     * @throws ApiError
     */
    public static cpLicensesList({
        ordering,
        page,
        pageSize,
        search,
    }: {
        /**
         * Which field to use when ordering the results.
         */
        ordering?: string,
        /**
         * A page number within the paginated result set.
         */
        page?: number,
        /**
         * Number of results to return per page.
         */
        pageSize?: number,
        /**
         * A search term.
         */
        search?: string,
    }): CancelablePromise<PaginatedLicenseIssueList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/cp/licenses/',
            query: {
                'ordering': ordering,
                'page': page,
                'page_size': pageSize,
                'search': search,
            },
        });
    }
    /**
     * @returns LicenseIssue
     * @throws ApiError
     */
    public static cpLicensesCreate({
        requestBody,
    }: {
        requestBody: LicenseIssue,
    }): CancelablePromise<LicenseIssue> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/cp/licenses/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns LicenseIssue
     * @throws ApiError
     */
    public static cpLicensesRetrieve({
        id,
    }: {
        /**
         * A unique integer value identifying this Issued License.
         */
        id: number,
    }): CancelablePromise<LicenseIssue> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/cp/licenses/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @returns LicenseIssue
     * @throws ApiError
     */
    public static cpLicensesUpdate({
        id,
        requestBody,
    }: {
        /**
         * A unique integer value identifying this Issued License.
         */
        id: number,
        requestBody: LicenseIssue,
    }): CancelablePromise<LicenseIssue> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/cp/licenses/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns LicenseIssue
     * @throws ApiError
     */
    public static cpLicensesPartialUpdate({
        id,
        requestBody,
    }: {
        /**
         * A unique integer value identifying this Issued License.
         */
        id: number,
        requestBody?: PatchedLicenseIssue,
    }): CancelablePromise<LicenseIssue> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/cp/licenses/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns void
     * @throws ApiError
     */
    public static cpLicensesDestroy({
        id,
    }: {
        /**
         * A unique integer value identifying this Issued License.
         */
        id: number,
    }): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/cp/licenses/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @returns LicenseIssue
     * @throws ApiError
     */
    public static cpLicensesRevokeCreate({
        id,
        requestBody,
    }: {
        /**
         * A unique integer value identifying this Issued License.
         */
        id: number,
        requestBody: LicenseIssue,
    }): CancelablePromise<LicenseIssue> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/cp/licenses/{id}/revoke/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns LicenseIssue
     * @throws ApiError
     */
    public static cpLicensesIssueCreate({
        requestBody,
    }: {
        requestBody: LicenseIssue,
    }): CancelablePromise<LicenseIssue> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/cp/licenses/issue/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns LicenseIssue
     * @throws ApiError
     */
    public static cpLicensesRuntimeHeartbeatCreate({
        requestBody,
    }: {
        requestBody: LicenseIssue,
    }): CancelablePromise<LicenseIssue> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/cp/licenses/runtime_heartbeat/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns LicenseIssue
     * @throws ApiError
     */
    public static cpLicensesRuntimeInstallAckCreate({
        requestBody,
    }: {
        requestBody: LicenseIssue,
    }): CancelablePromise<LicenseIssue> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/cp/licenses/runtime_install_ack/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns LicenseIssue
     * @throws ApiError
     */
    public static cpLicensesRuntimeIssueCreate({
        requestBody,
    }: {
        requestBody: LicenseIssue,
    }): CancelablePromise<LicenseIssue> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/cp/licenses/runtime_issue/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns LicenseIssue
     * @throws ApiError
     */
    public static cpLicensesRuntimeNonceCreate({
        requestBody,
    }: {
        requestBody: LicenseIssue,
    }): CancelablePromise<LicenseIssue> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/cp/licenses/runtime_nonce/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns LicenseIssue
     * @throws ApiError
     */
    public static cpLicensesRuntimeRequestCreate({
        requestBody,
    }: {
        requestBody: LicenseIssue,
    }): CancelablePromise<LicenseIssue> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/cp/licenses/runtime_request/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns any No response body
     * @throws ApiError
     */
    public static cpOverviewRetrieve(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/cp/overview/',
        });
    }
    /**
     * @returns any No response body
     * @throws ApiError
     */
    public static cpOverviewCreate(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/cp/overview/',
        });
    }
    /**
     * @returns any No response body
     * @throws ApiError
     */
    public static cpOverviewRetrieve2({
        id,
    }: {
        id: string,
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/cp/overview/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @returns any No response body
     * @throws ApiError
     */
    public static cpOverviewUpdate({
        id,
    }: {
        id: string,
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/cp/overview/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @returns any No response body
     * @throws ApiError
     */
    public static cpOverviewPartialUpdate({
        id,
    }: {
        id: string,
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/cp/overview/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @returns void
     * @throws ApiError
     */
    public static cpOverviewDestroy({
        id,
    }: {
        id: string,
    }): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/cp/overview/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @returns PaginatedPlanList
     * @throws ApiError
     */
    public static cpPlansList({
        ordering,
        page,
        pageSize,
        search,
    }: {
        /**
         * Which field to use when ordering the results.
         */
        ordering?: string,
        /**
         * A page number within the paginated result set.
         */
        page?: number,
        /**
         * Number of results to return per page.
         */
        pageSize?: number,
        /**
         * A search term.
         */
        search?: string,
    }): CancelablePromise<PaginatedPlanList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/cp/plans/',
            query: {
                'ordering': ordering,
                'page': page,
                'page_size': pageSize,
                'search': search,
            },
        });
    }
    /**
     * @returns Plan
     * @throws ApiError
     */
    public static cpPlansCreate({
        requestBody,
    }: {
        requestBody: Plan,
    }): CancelablePromise<Plan> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/cp/plans/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns Plan
     * @throws ApiError
     */
    public static cpPlansRetrieve({
        id,
    }: {
        /**
         * A unique integer value identifying this Plan.
         */
        id: number,
    }): CancelablePromise<Plan> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/cp/plans/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @returns Plan
     * @throws ApiError
     */
    public static cpPlansUpdate({
        id,
        requestBody,
    }: {
        /**
         * A unique integer value identifying this Plan.
         */
        id: number,
        requestBody: Plan,
    }): CancelablePromise<Plan> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/cp/plans/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns Plan
     * @throws ApiError
     */
    public static cpPlansPartialUpdate({
        id,
        requestBody,
    }: {
        /**
         * A unique integer value identifying this Plan.
         */
        id: number,
        requestBody?: PatchedPlan,
    }): CancelablePromise<Plan> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/cp/plans/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns void
     * @throws ApiError
     */
    public static cpPlansDestroy({
        id,
    }: {
        /**
         * A unique integer value identifying this Plan.
         */
        id: number,
    }): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/cp/plans/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @returns PaginatedRuntimeLicenseRequestList
     * @throws ApiError
     */
    public static cpRuntimeLicenseRequestsList({
        ordering,
        page,
        pageSize,
        search,
    }: {
        /**
         * Which field to use when ordering the results.
         */
        ordering?: string,
        /**
         * A page number within the paginated result set.
         */
        page?: number,
        /**
         * Number of results to return per page.
         */
        pageSize?: number,
        /**
         * A search term.
         */
        search?: string,
    }): CancelablePromise<PaginatedRuntimeLicenseRequestList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/cp/runtime-license-requests/',
            query: {
                'ordering': ordering,
                'page': page,
                'page_size': pageSize,
                'search': search,
            },
        });
    }
    /**
     * @returns RuntimeLicenseRequest
     * @throws ApiError
     */
    public static cpRuntimeLicenseRequestsCreate({
        requestBody,
    }: {
        requestBody: RuntimeLicenseRequest,
    }): CancelablePromise<RuntimeLicenseRequest> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/cp/runtime-license-requests/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns RuntimeLicenseRequest
     * @throws ApiError
     */
    public static cpRuntimeLicenseRequestsRetrieve({
        id,
    }: {
        /**
         * A unique integer value identifying this Runtime License Request.
         */
        id: number,
    }): CancelablePromise<RuntimeLicenseRequest> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/cp/runtime-license-requests/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @returns RuntimeLicenseRequest
     * @throws ApiError
     */
    public static cpRuntimeLicenseRequestsUpdate({
        id,
        requestBody,
    }: {
        /**
         * A unique integer value identifying this Runtime License Request.
         */
        id: number,
        requestBody: RuntimeLicenseRequest,
    }): CancelablePromise<RuntimeLicenseRequest> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/cp/runtime-license-requests/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns RuntimeLicenseRequest
     * @throws ApiError
     */
    public static cpRuntimeLicenseRequestsPartialUpdate({
        id,
        requestBody,
    }: {
        /**
         * A unique integer value identifying this Runtime License Request.
         */
        id: number,
        requestBody?: PatchedRuntimeLicenseRequest,
    }): CancelablePromise<RuntimeLicenseRequest> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/cp/runtime-license-requests/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns void
     * @throws ApiError
     */
    public static cpRuntimeLicenseRequestsDestroy({
        id,
    }: {
        /**
         * A unique integer value identifying this Runtime License Request.
         */
        id: number,
    }): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/cp/runtime-license-requests/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @returns RuntimeLicenseRequest
     * @throws ApiError
     */
    public static cpRuntimeLicenseRequestsApproveCreate({
        id,
        requestBody,
    }: {
        /**
         * A unique integer value identifying this Runtime License Request.
         */
        id: number,
        requestBody: RuntimeLicenseRequest,
    }): CancelablePromise<RuntimeLicenseRequest> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/cp/runtime-license-requests/{id}/approve/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns RuntimeLicenseRequest
     * @throws ApiError
     */
    public static cpRuntimeLicenseRequestsRejectCreate({
        id,
        requestBody,
    }: {
        /**
         * A unique integer value identifying this Runtime License Request.
         */
        id: number,
        requestBody: RuntimeLicenseRequest,
    }): CancelablePromise<RuntimeLicenseRequest> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/cp/runtime-license-requests/{id}/reject/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns RuntimeLicenseRequest
     * @throws ApiError
     */
    public static cpRuntimeLicenseRequestsUnlicensedRetrieve(): CancelablePromise<RuntimeLicenseRequest> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/cp/runtime-license-requests/unlicensed/',
        });
    }
    /**
     * @returns PaginatedSubscriptionList
     * @throws ApiError
     */
    public static cpSubscriptionsList({
        ordering,
        page,
        pageSize,
        search,
    }: {
        /**
         * Which field to use when ordering the results.
         */
        ordering?: string,
        /**
         * A page number within the paginated result set.
         */
        page?: number,
        /**
         * Number of results to return per page.
         */
        pageSize?: number,
        /**
         * A search term.
         */
        search?: string,
    }): CancelablePromise<PaginatedSubscriptionList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/cp/subscriptions/',
            query: {
                'ordering': ordering,
                'page': page,
                'page_size': pageSize,
                'search': search,
            },
        });
    }
    /**
     * @returns Subscription
     * @throws ApiError
     */
    public static cpSubscriptionsCreate({
        requestBody,
    }: {
        requestBody: Subscription,
    }): CancelablePromise<Subscription> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/cp/subscriptions/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns Subscription
     * @throws ApiError
     */
    public static cpSubscriptionsRetrieve({
        id,
    }: {
        /**
         * A unique integer value identifying this Subscription.
         */
        id: number,
    }): CancelablePromise<Subscription> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/cp/subscriptions/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @returns Subscription
     * @throws ApiError
     */
    public static cpSubscriptionsUpdate({
        id,
        requestBody,
    }: {
        /**
         * A unique integer value identifying this Subscription.
         */
        id: number,
        requestBody: Subscription,
    }): CancelablePromise<Subscription> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/cp/subscriptions/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns Subscription
     * @throws ApiError
     */
    public static cpSubscriptionsPartialUpdate({
        id,
        requestBody,
    }: {
        /**
         * A unique integer value identifying this Subscription.
         */
        id: number,
        requestBody?: PatchedSubscription,
    }): CancelablePromise<Subscription> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/cp/subscriptions/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns void
     * @throws ApiError
     */
    public static cpSubscriptionsDestroy({
        id,
    }: {
        /**
         * A unique integer value identifying this Subscription.
         */
        id: number,
    }): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/cp/subscriptions/{id}/',
            path: {
                'id': id,
            },
        });
    }
}
