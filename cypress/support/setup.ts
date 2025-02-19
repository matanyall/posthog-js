import { Compression, DecideResponse, PostHogConfig } from '../../src/types'

import { EventEmitter } from 'events'

export const start = ({
    waitForDecide = true,
    initPosthog = true,
    resetOnInit = false,
    options = {},
    decideResponseOverrides = {
        sessionRecording: undefined,
        isAuthenticated: false,
        capturePerformance: true,
    },
    url = './playground/cypress-full',
}: {
    waitForDecide?: boolean
    initPosthog?: boolean
    resetOnInit?: boolean
    options?: Partial<PostHogConfig>
    decideResponseOverrides?: Partial<DecideResponse>
    url?: string
}) => {
    // sometimes we have too many listeners in this test environment
    // that breaks the event emitter listeners in error tracking tests
    // we don't see the error in production, so it's fine to increase the limit here
    EventEmitter.prototype.setMaxListeners(100)

    const decideResponse: DecideResponse = {
        editorParams: {},
        featureFlags: { 'session-recording-player': true },
        featureFlagPayloads: {},
        errorsWhileComputingFlags: false,
        toolbarParams: {},
        toolbarVersion: 'toolbar',
        isAuthenticated: false,
        siteApps: [],
        supportedCompression: [Compression.GZipJS],
        autocaptureExceptions: false,
        ...decideResponseOverrides,
    }
    cy.intercept('POST', '/decide/*', decideResponse).as('decide')

    cy.visit(url)

    if (initPosthog) {
        cy.posthogInit({
            opt_out_useragent_filter: true, // we ARE a bot, so we need to enable this opt-out
            ...options,
        })
    }

    if (resetOnInit) {
        cy.posthog().invoke('reset', true)
    }

    if (waitForDecide) {
        cy.wait('@decide')
    }
}
