# Security

## Reporting a vulnerability

If you believe you have found a security issue in this repository, please open a **private** report via [GitHub Security Advisories](https://docs.github.com/code-security/security-advisories/guidance-on-reporting-and-writing-information-about-vulnerabilities/privately-reporting-a-security-vulnerability) for this project, or contact the maintainers directly if that is not available. Please do not file public issues for undisclosed vulnerabilities.

## API keys and client-side use

DataSway is a browser application. When you enter an OpenAI API key, it is used **directly from your browser** to call the provider (see `src/assets/message.ts`). The key may be stored in **browser local storage** for convenience (see `src/store/index.ts`).

Implications:

- Treat the key like any other secret you paste into a website: use a key with **minimal scope** and **spending limits** where possible.
- Anyone with access to your machine or browser profile could potentially read stored keys.
- Do **not** commit real keys into the repo or share session export files that contain secrets.

We do not operate a backend that holds your key on your behalf in this open-source setup.
