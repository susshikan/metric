// types.ts
export interface LogEntry {
  method: string;
  url: string;
  status: string;
  duration: string;
  timestamp: string;
}

export interface DockerStats {
  id: string;
  name: string;
  image: string;
  cpu: string;
  memUsed: string;
  memLimit: string;
  memPercent: string;
  timestamp: string;
}

export interface ChartData {
  time: string;
  value: number;
  value2?: number; // Optional second line (e.g. for Memory in Load chart)
}