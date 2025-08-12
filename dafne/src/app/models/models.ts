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
  synch_id: number = -1;
  synch_label: string = "";
  average_fe?: number;
  average_be?: number;
  average_Timeliness?: number;
  number_of_measurements: number = 0;
  source: string = "";
}

export class DayTimeliness {
  timezone: string = "";
  centre_id: number = -1;
  synch_id: number = -1;
  synch_label: string = "";
  Timeliness_fe?: number;
  Timeliness_be?: number;
  Timeliness?: number;
  source: string = "";
}

export class Service {
  id!: number;
  username!: string;
  password!: string;
  service_url!: string;
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

export class Synchronizer {
  id!: number;
  label!: string;
  serviceUrlBackend!: string;
  serviceUrl!: string;
  serviceLogin!: string;
  servicePassword!: string;
  copyProduct?: string;
  schedule?: string;
  pageSize?: number;
  request?: string;
  targetCollection: any;
  remoteIncoming?: string;
  sourceCollection?: string;
  lastCreationDate?: string;
  filterParam?: string;
  geoFilter?: string;
  status?: string;
  skipOnError?: string;
}