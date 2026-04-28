import { McpServer, StdioServerTransport } from "@modelcontextprotocol/server";

const server = new McpServer(
  { name: "day-to-day-mcp", version: "1.0.0" },
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Day-to-day MCP Server running on stdio...");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});