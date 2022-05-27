export class Latency {
    day: string = "";
    centre_id: number = -1;
    synch_id: number = -1;
    synch_label: string = "";
    average_fe: number = null;
    average_be: number = null;
    average_latency: number = null;
    number_of_measurements: number = 0;
    source: string = "";
}

export class DayLatency {
    timezone: string = "";
    centre_id: number = -1;
    synch_id: number = -1;
    synch_label: string = "";
    latency_fe: number = null;
    latency_be: number = null;
    source: string = "";
}