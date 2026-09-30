import { Consumer, Datastore, Metadatastore, Producer, Credential } from "./models";

export const CreateDatastore = (name: string, type: string): Datastore => ({
  name: name,
  parentGroup: "",
  type: type,
  permission: [
    "READ",
    "WRITE",
    "DELETE"
  ],
  properties: {
    property: []
  },
  path: "/path/to/datastore",
  depth: 2,
  granularity: 2
})

export const CreateMetadatastore = (name: string): Metadatastore => ({
  name: name,
  permission: [
    "READ",
    "WRITE",
    "DELETE"
  ],
  properties: {
    property: []
  },
  strategies: null,
  hosts: "http(s)://<host-url>",
  clientType: "LBHttp",
  user: "",
  password: "",
  collection: "",
  defaultSort: "name desc",
  defaultTop: 100,
  maxSkip: 100
})

export const CreateProducer = (name: string, sourceType: string): Producer => ({
  name: name,
  hosts: "host-name",
  user: "",
  password: "",
  topic: "topic-name",
  pushInterval: 60,
  filter: ".*",
  processError: {
    active: true,
    retries: 0
  },
  reprocess: false,
  source: {
    sourceType: sourceType
  }
})

export const CreateConsumer = (name: string, sourceType: string): Consumer => ({
  name: name,
  parallelIngests: 4,
  hosts: "host-name",
  user: "",
  password: "",
  groupId: "groupId-name",
  topics: "topic-name",
  reprocess: false,
  pollIntervalMs: 1200000,
  tmpPath: "",
  source: {
    sourceType: sourceType
  },
  taskList: [
    {
      type: "fr.gael.gss.ingest.ingester.IngestInDataStores",
      pattern: ".*",
      stopOnFailure: true,
      tryLimit: 3,
      active: true,
      targetStores: "<target-store-name>"
    },
    {
      type: "fr.gael.gss.ingest.ingester.ExtractMetadata",
      pattern: ".*",
      stopOnFailure: true,
      tryLimit: 3,
      active: true,
      forceOnline: false
    },
    {
      type: "fr.gael.gss.ingest.ingester.IngestInMetadataStores",
      pattern: ".*",
      stopOnFailure: true,
      tryLimit: 3,
      active: true,
      targetStores: "<target-metadatastore-name>"
    },
    {
      type: "fr.gael.gss.ingest.ingester.CreateQuicklook",
      pattern: ".*",
      stopOnFailure: true,
      tryLimit: 3,
      active: true,
      onlyUseProvidedQL: true,
      height : 45,
      width : 45,
      targetStores: "<target-quicklook-store-name>"
    }
  ],
  errorManager: {
    type: "folder",
    errorLocation: ""
  }
})

export const CreateCredential = (name: string): Credential => ({
  name: name,
  region: "region-name",
})