import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs/promises';
import path from 'path';

interface ProjectData {
  details: any; // From desk.json
  description: string; // From desc.md
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ProjectData | { error: string }>
) {
  const { id } = req.query;

  try {
    // Get the desk.json file
    const jsonPath = path.join(process.cwd(), 'public', 'projects', String(id), 'desc.json');
    const jsonData = await fs.readFile(jsonPath, 'utf8');
    const details = JSON.parse(jsonData);

    // Get the desc.md file
    const mdPath = path.join(process.cwd(), 'public', 'projects', String(id), 'desc.md');
    const mdData = await fs.readFile(mdPath, 'utf8');

    // Return both data sources
    res.status(200).json({
      details,
      description: mdData
    });
  } catch (error) {
    console.error(`Error fetching project ${id}:`, error);
    res.status(404).json({ error: `Project ${id} not found` });
  }
}
