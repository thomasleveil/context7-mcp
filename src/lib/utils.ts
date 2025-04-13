import { Project } from "./types.js";
import Fuse, { FuseResult, IFuseOptions } from "fuse.js";

export interface ProjectWithScore extends Project {
  score?: number;
}

/**
 * Format a project into a string representation
 * @param project Project to format
 * @returns Formatted project string
 */
export function formatProject(project: ProjectWithScore): string {
  const scoreText = project.score !== undefined ? `Score: ${(1 - project.score).toFixed(3)}\n` : "";
  return `Title: ${project.settings.title}\nContext7-compatible library ID: ${project.settings.project}\n${scoreText}`;
}

/**
 * Format a list of projects into a string representation
 * @param projects Projects to format
 * @returns Formatted projects string
 */
export function formatProjectsList(projects: ProjectWithScore[], totalProjects?: number): string {
  const formattedProjects = projects.map(formatProject);
  const prefix =
    totalProjects && totalProjects > projects.length
      ? `Showing ${projects.length} of ${totalProjects} documentation libraries:\n\n`
      : `${projects.length} documentation libraries:\n\n`;
  return prefix + formattedProjects.join("\n");
}

/**
 * Rerank projects based on a search term using Fuse.js for fuzzy searching
 * @param projects Projects to rerank
 * @param searchTerm Search term to rerank by
 * @returns Reranked projects with scores
 */
export function rerankProjects(projects: Project[], searchTerm: string): ProjectWithScore[] {
  if (!searchTerm) return projects;

  // If search term includes github.com, extract the project path
  const normalizedSearchTerm = searchTerm.includes("github.com")
    ? searchTerm.replace(/^(https?:\/\/)?github\.com\//, "").replace(/\/$/, "")
    : searchTerm;

  const options: IFuseOptions<Project> = {
    keys: [
      // Project path is the most reliable identifier
      { name: "settings.project", weight: 3 },
      // Title can help with alternative names/common terms
      { name: "settings.title", weight: 1 },
    ],
    includeScore: true, // Include relevance score in results
    threshold: 0.4, // Lower threshold means stricter matching (0.0 = perfect match)
    isCaseSensitive: false, // Ignore case of search term
    ignoreDiacritics: true, // Ignore diacritics in search term
    ignoreLocation: true, // Ignore location of search term
    distance: 1, // Allow for some distance between matched characters
    minMatchCharLength: 2, // Minimum length of characters to be considered a match
    findAllMatches: true, // Find all matches, not just the first one
  };

  const fuse = new Fuse(projects, options);
  const results = fuse.search(normalizedSearchTerm);

  // If no fuzzy matches found, return original array
  if (results.length === 0) return projects;

  // Map back to original project objects with scores
  return results.map((result: FuseResult<Project>) => ({
    ...result.item,
    score: result.score,
  }));
}
