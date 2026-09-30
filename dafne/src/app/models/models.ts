export class User {
  id?: number;
  username?: string;
  role?: string;
  token?: any;
  isAdmin?: boolean;
}

export class Centre {
  id!: number;
  name!: string;
  description!: string;
  latitude!: string;
  longitude!: string;
  local!: boolean;
  icon!: string;
  color!: string;
}

export class Availability {
  date!: string;
  successResponses!: number;
  totalRequests!: number;
  percentage!: number;
}

export class Timeliness {
  day: string = "";
  centre_id: number = -1;
  filter_label: string = "";
  average_timeliness?: number;
  number_of_measurements: number = 0;
}

export class DayTimeliness {
  timezone: string = "";
  centre_id: number = -1;
  filter_label: string = "";
  timeliness?: number;
}

export class Service {
  id!: number;
  username!: string;
  password!: string;
  service_url!: string;
  service_admin_url!: string;
  token_url?: string;
  client_id?: string;
  service_type!: number;
  supports_oauth2!: boolean;
  centre!: number;
}

export class ServiceType {
  id!: number;
  service_type!: string;
  supports_oauth2: boolean = false;
}

export interface DataSourcesInfo {
  centre?: Centre;
  info: string;
  filter: string;
  lastCreationDate: string;
}

/* Ingesters */
export interface Datastore {
  name: string;
  parentGroup?: string | null;
  type: string;
  permission: string[];
  properties: {
    property?: {
      name: string;
      value: string;
    }[];
  } | null;
  path?: string;
  depth?: number;
  granularity?: number;
  credentials?: string | null;
  prefixLocation?: string | null;
  container?: string | null;
  containerPattern?: {
    type: string | null;
    patternMapper: string | null;
  }
  filter?: string | null;
  bucket?: string | null;
  policy?: string | null;
  children?: Datastore[];
}

export interface Metadatastore {
  name: string;
  hosts: string | null;
  clientType: string;
  permission: string[];
  properties: {
    property: {
      name: string;
      value: string;
    }[];
  } | null;
  strategies: {
    strategy: {
      name: string;
      value: string | number | null;
    }[]
  } | null;
  user: string | null;
  password: string | null;
  collection: string | null;
  defaultSort: string | null;
  defaultTop: number;
  maxSkip: number;
  storage?: string | null;
  visitorBuilder?: string | null;
  transformer?: string | null;
}

export interface Credential {
  name: string;
  region: string | null;
  tenant?: string | null;
  password?: string | null;
  user?: string | null;
  url?: string | null;
  endpoint?: string | null;
  domain?: string | null;
  accessKey?: string | null;
  secretKey?: string | null;
}

export interface Producer {
  name: string;
  hosts: string | null;
  user: string | null;
  password: string | null;
  topic: string;
  pushInterval: number;
  processQueuedProductSeconds?: number;
  filter: string | null;
  processError: {
    active: boolean;
    retries: number;
  };
  reprocess: boolean;
  dataSource?: string | null;
  productionType?: string | null;
  source: {
    sourceType: string | null;
    serviceRootUrl?: string | null;
    auth?: string | {
        user: string; 
        password: string; 
        clientId?: string | null; 
        tokenEndpoint?: string | null; 
        type: string
      } | null;
    top?: number;
    lastPublicationDate?: string | null;
    filter?: string | {param?: {name?: string; value?: string}[]} | null;
    type?: string | null;
    assumedFormat?: string | null;
    fetchAttributes?: boolean;
    fetchQuicklook?: boolean;
    useDateFromDb?: boolean;
    geoPostFilter?: string | null;
    csvFile?: string | null;
    path?: string | null;
    buckets?: string | null;
    infiniteLoop?: boolean;
    productDirectories?: boolean;
    suffix?: string | null;
    credentials?: string | null;
    containers?: string | null;
    pivotDate?: string | null;
    pivotDateValue?: string | null;
  }
}

export interface Consumer {
  name: string;
  parallelIngests: number;
  hosts: string | null;
  user: string | null;
  password: string | null;
  groupId: string | null;
  topics: string | null;
  reprocess: boolean;
  pollIntervalMs: number;
  tmpPath: string | null;
  source: {
    sourceType: string | null;
    path?: string | null;
    containers?: string | null;
    buckets?: string | null;
    credentials?: string | null;
    serviceRootUrl?: string | null;
    productDirectories?: boolean;
    suffix?: string | null;
    type?: string | null;
    retriesOn429?: number;
    retryWaitOn429Ms?: number;
    auth?: {
      type: string | null;
      user: string;
      password: string;
      clientId?: string;
      clientSecret?: string | null;
      tokenEndpoint?: string;
    };
  };
  taskList: {
    type: string | null;
    pattern: string | null;
    stopOnFailure: boolean;
    tryLimit: number;
    active: boolean;
    forceOnline?: boolean;
    onlyUseProvidedQL?: boolean;
    height?: number;
    width?: number;
    targetStores?: string | null;
  }[];
  errorManager: {
    errorLocation?: string | null;
    type: string | null;
    container?: string | null;
    bucket?: string | null;
    kafkaHosts?: string | null;
    kafkaTopic?: string | null;
    kafkaUser?: string | null;
    kafkaPassword?: string | null;
    credentials?: string | null;
  }
  topicPattern?: string | null;
  ingestThreads?: number;
  sourceDeleteValue?: boolean;
  sourceDeletePattern?: string | null;
  sourceDelete?: {
    value: boolean;
    pattern: string | null;
    type?: string | null;
  };
}
