/**
 * Create and export configuration variables
 */

// Container for all the environments
var environments = {};

// Setting up staging and prod environments

environments.staging = {
    'httpPort' : 3000,
    'httpsPort' : 3001,
    'envName' : 'staging',
    'hashingSecret' : 'louisIsTheKey'
};

// Production environment
environments.production = {
    'httpPort' : 5000,
    'httpsPort' : 5001,
    'envName' : 'production',
    'hashingSecret' : 'louisIsTheOnlyKeyBruce'
};

// passed logic to cl argument
var currentEnvironment = typeof(process.env.NODE_ENV) == 'string' ? process.env.NODE_ENV.toLowerCase() : '';

// Check if we have the config, if not default to staging
var envToExport = typeof(environments[currentEnvironment]) == 'object' ? environments[currentEnvironment] : environments.staging;

module.exports = envToExport;