export type Template = 'small' | 'large';

export type ColorDistribution = 'indicator' | 'card';

export type Colors = Record<string, string | undefined>;

export interface Shot {
  id: string;
  sequence: string;
  action?: string;
  label?: string;
  periode?: string;
  fx?: string;
  url?: string;
}

export interface Project {
  key: string;
  name: string;
  data: Shot[];
  colors: Colors;
  template: Template;
  colorDistribution?: ColorDistribution;
  defaultColor?: string;
  fontFamily?: string;
  printSpaceAround?: boolean;
  mainPicture?: string;
  dirLink?: FileSystemDirectoryHandle;
}

export type PermissionMode = 'read' | 'readwrite';

// File System Access API methods that TypeScript's DOM lib doesn't declare yet.
export interface PermissionDirectoryHandle extends FileSystemDirectoryHandle {
  queryPermission(options: { mode: PermissionMode }): Promise<PermissionState>;
  requestPermission(options: {
    mode: PermissionMode;
  }): Promise<PermissionState>;
}

export interface ProjectsSource {
  list(): Promise<Project[]>;
  get(id: string): Promise<Project>;
  dirLink(id: string): Promise<FileSystemDirectoryHandle | undefined>;
  add(project: Project): Promise<Project[]>;
  save(project: Project): Promise<Project[]>;
  delete(id: string): Promise<Project[]>;
}
