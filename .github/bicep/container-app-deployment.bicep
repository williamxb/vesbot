param containerAppName string
param location string = 'uksouth'
param registry string

param registryUsername string
@secure()
param registryPassword string

param imageName string
param imageTag string

param environmentName string = '${containerAppName}-env'

param discordAppId string
@secure()
param discordAppToken string

resource logAnalyticsWorkspace 'Microsoft.OperationalInsights/workspaces@2023-09-01' = {
  name: 'docker-logs'
  location: location
  properties: {
    sku: {
      name: 'PerGB2018'
    }
  }
}

resource containerAppEnvironment 'Microsoft.App/managedEnvironments@2024-03-01' = {
  name: environmentName
  location: location
  properties: {
    appLogsConfiguration: {
      destination: 'log-analytics'
      logAnalyticsConfiguration: {
        customerId: logAnalyticsWorkspace.properties.customerId
        sharedKey: logAnalyticsWorkspace.listKeys().primarySharedKey
      }
    }
  }
}

resource containerApp 'Microsoft.App/containerApps@2024-03-01' = {
  name: containerAppName
  location: location
  properties: {
    managedEnvironmentId: containerAppEnvironment.id
    configuration: {
      registries: [
        {
          server: registry
          username: registryUsername
          passwordSecretRef: 'registry-password'
        }
      ]
      secrets: [
        {
          name: 'registry-password'
          value: registryPassword
        }
        {
          name: 'discord-app-token'
          value: discordAppToken
        }
      ]
    }
    template: {
      containers: [
        {
          name: containerAppName
          image: '${registry}/${registryUsername}/${imageName}:${imageTag}'
          resources: {
            cpu: json('0.25')
            memory: '0.5Gi'
          }
          env: [
            {
              name: 'DISCORD_APP_ID'
              value: discordAppId
            }
            {
              name: 'DISCORD_APP_TOKEN'
              secretRef: 'discord-app-token'
            }
          ]
        }
      ]
    }
  }
}
