export interface ProjectDetails {
  title: string;
  // Add other fields that exist in your desk.json
  [key: string]: any;
}

export interface Project {
  details: ProjectDetails;
  description: string;
}
