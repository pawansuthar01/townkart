// Config Index - Central export for all configuration files
export * from "./api.config";
export * from "./routes.config";
export * from "./site.config";
export * from "./theme.config";

// Re-export commonly used configurations
export { SITE_CONFIG } from "./site.config";
export { ROUTES } from "./routes.config";
export { API_CONFIG } from "./api.config";
export { THEME_CONFIG } from "./theme.config";
