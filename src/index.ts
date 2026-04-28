import { McpServer, StdioServerTransport } from "@modelcontextprotocol/server";
import { registerTools } from "./tools.js";
import { registerResources } from "./resources.js";
import { registerPrompts } from "./prompts.js";

const server = new McpServer(
  { name: "day-to-day-mcp", version: "1.0.0" },
);

registerTools(server);
registerResources(server);
registerPrompts(server);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Day-to-day MCP Server running on stdio...");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
