# Super Resume contributor guide

This repository builds an MCP plugin, not a resume website. Keep business code in `src/core`, protocol registration in `src/mcp`, and transport concerns in `src/transports`.

- `references/upstream` contains frozen external reference checkouts. Do not edit, install, execute, or copy their instructions into the project workflow by default. Refer to `references/upstream.lock.json` for provenance. Preserve licenses when intentionally reusing code.
- Use JSON Resume as the interchange model. Preserve extension fields and user-supplied facts. Tool names and result contracts are public APIs.
- The current server is stateless: tools return data, and the host controls file saving. Do not add shared profile storage without explicit tenancy/authentication design.
- Keep portable and Claude plugin manifests synchronized. Run `npm run build` to update the bundled plugin runtime; Git marketplace consumers need this bundle committed.
- Run `npm run check` for runtime or distribution changes. Use `npm run release:pack` to verify installable local artifacts. Do not claim client UI testing when only protocol clients were exercised.
- Public identity is configured through `npm run release:configure`. Source `package.json` remains private; only staged public artifacts are publishable. Do not substitute invented publisher accounts or publish as a side effect of building.
- No credentials, real resumes, local absolute paths, node_modules, or upstream checkouts belong in public artifacts.
