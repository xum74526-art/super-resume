# Super Resume MCP

Portable resume tools for MCP clients. Requires Node.js 22.12.0 or newer. No model API key is required.

Run the `super-resume-mcp` executable using your client's stdio MCP configuration. The default transport is stdio; `--http` starts a local Streamable HTTP endpoint at `http://127.0.0.1:3000/mcp`. `--studio` starts the local template workbench at `http://127.0.0.1:3141` for template selection, editing, preview and PDF/Word downloads. `--help` lists environment settings.

Tools: `get_resume_schema`, `create_resume`, `validate_resume`, `apply_resume_patch`, `match_job`, `import_resume_document`, `list_resume_templates`, `preview_resume`, `export_resume`.

117 A4 designs are included in 17 filter categories: 16 visual families and six base layouts. Ten new families cover executive, Swiss international, academic, graduate, tech, portfolio proposal, newsprint, collage journal, contemporary Chinese and career narrative designs. The six previously shipped visual families remain available. Use `list_resume_templates` to discover every ID, or the studio to filter and jump between pages. Every design supports PDF, editable DOCX and offline vector HTML. PDF and SVG preview share pagination. Word uses system fonts and may paginate differently. HTML uses glyph outlines; use PDF/DOCX for selectable text. Optional embedded PNG/JPEG photos are supported; remote URLs are never fetched. The former community catalog has been retired. The studio includes clearly marked fictional sample data and has no profile persistence; use JSON open/save.

Documents use JSON Resume. The host model drafts the wording; tools validate, transform and return data. The server does not persist resumes, write user files, contact job sites, submit applications, or send data to a cloud scoring API. With HTTP, the supplied document is processed in the server's memory; default stdio processing is local.

Exports support JSON, Markdown, PDF, DOCX and HTML. PDF embeds Noto Sans CJK SC; DOCX uses system fonts. Imports extract text with page/paragraph references from PDF/DOCX up to 5 MiB (PDF up to 30 pages). OCR is not included. Complex layouts need review against the original. Binary MCP exports are embedded resource blobs, not hosted URLs. Keyword matches contain source excerpts, but do not evaluate truth, proficiency, eligibility, negation, or hiring outcomes.

For hosts with shell access, avoid passing file bytes through model context:

```text
super-resume-mcp import resume.pdf
super-resume-mcp templates
super-resume-mcp export resume.json --out resume.pdf --template modern
super-resume-mcp export resume.json --out resume.docx --template compact --locale en
```

These explicit file commands run locally. Import prints extraction JSON; export writes only the named output, refusing overwrite unless `--force` is supplied. Unlike the file commands, MCP tools never read or write arbitrary local paths. Keep the worker program and assets with the executable; copying the executable alone is insufficient.

This package contains a bundled runtime and third-party license notices. See its repository metadata for plugin installation, publication status, and development documentation. A local test archive has `private: true` and is not a public Registry listing.
