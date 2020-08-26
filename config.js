/**
 * Create and export configuration variables
 */

// Container for all the environments
var environments = {};

// Setting up staging and prod environments

environments.staging = {
    'port' : 3000,
    'envName' : 'staging'
};

// Production environment
environments.production = {
    'port' : 5000,
    'envName' : 'production'
};

// passed logic to cl argument
var currentEnvironment = typeof(process.env.NODE_ENV) == 'string' ? process.env.NODE_ENV.toLowerCase() : '';

// Check if we have the config, if not default to staging
var envToExport = typeof(environments[currentEnvironment]) == 'object' ? environments[currentEnvironment] : environments.staging;

module.exports = envToExport;