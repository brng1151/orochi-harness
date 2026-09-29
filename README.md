# Orochi Harness

English | [中文](README.zh.md)

Orochi Harness (`oh`) is an open-source agent harness developed by [Orochi AI](https://deepseek.com).

It is built on an **everything-is-a-plugin** architecture and powered by [Cordis](https://github.com/cordiverse/cordis), whose design is described in [_A Programming Paradigm for Spatiotemporal Composability_](https://arxiv.org/abs/2608.25512).

Documentation: [https://orochi-harness.github.io/orochi-harness/](https://orochi-harness.github.io/orochi-harness/)

## Origin

Orochi Harness is based on [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness). Compared with DeepSeek Harness, this fork:

- removes the log and data collectors;
- uses [OpenRouter](https://openrouter.ai) as the default model provider.

## Developer preview

Orochi Harness is in _developer preview_ and iterating rapidly. **THERE WILL BE COMPATIBILITY-BREAKING CHANGES.**

Review the [safety notice](SAFETY.md) before running the project.

## Run

### Run from `npm`

Install `Node.js`, then run:

```sh
npx @orochi-network/oh web
```

The command starts the Web UI at `http://127.0.0.1:3080` by default and opens it in the default browser for a local launch. An SSH launch only prints the host URL because the SSH client or editor owns the local forwarded address. Pass `--no-open` to run the server without opening a browser. See [Web UI guide](docs/user/guide/index.md).

### Run from source

To run from a repository checkout:

```sh
git clone https://github.com/orochi-network/orochi-harness.git
cd orochi-harness
pnpm install
pnpm run build
pnpm oh web
```

`pnpm run build` prepares the repository artifacts. `pnpm oh web` uses those built artifacts without rebuilding.

## Community and support

- Submit feedback or bug reports through [GitHub Discussions](https://github.com/orochi-network/orochi-harness/discussions).
- Add the [`oh-plugin`](https://github.com/topics/oh-plugin) topic to your plugin repository for discoverability.
- Join <a href="https://discord.gg/Ycq5dCaS4">Orochi Harness Discord community</a>.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## Development

Start with the [development guide](docs/development.md) and [architecture documentation](docs/architecture.md).

`pnpm run dev:web` builds, serves, and rebuilds client bundles on source edits in one terminal, and `make help` lists the matching Make targets for Web and Desktop; the guide's application commands section owns the full table.

For agents, follow [AGENTS.md](AGENTS.md).

## Citation

```bibtex
@misc{orochi-harness2026,
  title={Orochi Harness: Everything is a Plugin},
  author={Orochi-AI},
  year={2026},
  publisher={GitHub},
  howpublished={\url{https://github.com/orochi-network/orochi-harness}},
}
```

## License

[MIT](LICENSE)

Third-party dependencies and their licenses are disclosed in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
