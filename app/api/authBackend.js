const msal = require('@azure/msal-node');
const {DataProtectionScope, PersistenceCachePlugin, PersistenceCreator} = require("@azure/msal-node-extensions");

const cacheLocation = "./.tmp/cache.json";

const persistenceConfiguration = {
    cachePath: cacheLocation,
    dataProtectionScope: DataProtectionScope.CurrentUser,
    serviceName: "backendservice",
    accountName: "backend",
    usePlaintextFileOnLinux: true,
}

function init() {
    // Build MSAL ClientApplication Configuration object
    let authOptions = {
        "authority": "https://login.swarm-analytics.com/login.swarm-analytics.com/B2C_1A_AUTHENTICATE",
    }
    authOptions.clientId = process.env.CLIENT_ID
    authOptions.clientSecret = process.env.CLIENT_SECRET
    authOptions.knownAuthorities = ["https://login.swarm-analytics.com/login.swarm-analytics.com/B2C_1A_AUTHENTICATE"]

    PersistenceCreator
        .createPersistence(persistenceConfiguration)
        .then(async (persistence) => {
            this.clientConfig = {
                auth: authOptions,
                cache: {
                    cachePlugin: new PersistenceCachePlugin(persistence)
                }
            }
            this.confidentialClientApplication = new msal.ConfidentialClientApplication(this.clientConfig);
        });
}

init()

function authBackend() {
    // With client credentials flows permissions need to be granted in the portal by a tenant administrator.
    // The scope is always in the format "<resource>/.default"
    const clientCredentialRequest = {
        scopes: [`https://login.swarm-analytics.com/${process.env.APPLICATION_SCOPE}/.default`],
        azureRegion: null, // (optional) specify the region you will deploy your application to here (e.g. "westus2")
        skipCache: false, // (optional) this skips the cache and forces MSAL to get a new token from Azure AD
    };

    return this.confidentialClientApplication
        .acquireTokenByClientCredential(clientCredentialRequest)
}

module.exports = authBackend;
