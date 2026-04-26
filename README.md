# DataSway

DataSway is a browser-based tool for exploring and authoring data-driven SVG animation with LLM assistance. The UI is built with React, Vite, MobX, and Ant Design.

- Live Demo: https://shellywhen.github.io/DataSway
- Project Page: https://shellywhen.github.io/projects/DataSway

## Using the app

Routes (paths are relative to your deployed origin; locally that is `http://localhost:5173/`):

| Path | Screen |
|------|--------|
| `/` | About |
| `/board` | Getting started — OpenAI API token, examples, session list |
| `/workspace` | Main tool — SVG workspace and LLM-assisted animation |
| `/gallery` | Gallery |

Typical flow: configure your API token and load an example on "Board", then open "Workspace".

## Requirements

- Node.js 20+ recommended (matches CI; other maintained LTS versions may work)

## Run locally

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

### Other scripts

- `npm run build` — production build written to `docs/` (`outDir` in `vite.config.ts`)
- `npm run preview` — serve that build locally (good check before publishing)
- `npm run lint` — ESLint (many rules are **warnings** so the project stays usable while quality improves)

## OpenAI API key

On the "Board" tab, the app asks for an OpenAI API key. The key is used in the browser and may be stored in localStorage. See [SECURITY.md](./SECURITY.md) for risks and safe-use guidance.


## License

[MIT](./LICENSE)

## Contributing

Issues and pull requests are welcome. Run `npm run lint` before submitting.

## Citation

```bibtex
@inproceedings{xie2026datasway,
    title = {{DataSway}: Vivifying Metaphoric Visualization with Animation Clip Generation and Coordination},
    author = {Liwenhan Xie and Jiayi Zhou and Anyi Rao and Huamin Qu and Xinhuan Shu},
    year = {2026},
    booktitle = {Proceedings of the 2026 ACM Designing Interactive Systems Conference},
    doi = {10.1145/3800645.3813048},
    publisher = {Association for Computing Machinery},
    address = {New York, NY, USA},
    eprint = {2507.22051},
}
```
