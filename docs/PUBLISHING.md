# Publishing to Private NPM Registry

Publishing is handled by a GitHub Action located at [publish.yaml](../.github/workflows/publish.yml). It uses Anthropic's AI to determine the semver version type to increment by (MAJOR, MINOR, or PATCH), increments the package.json version acccordingly, and then publishes it to npmjs.

You cannot publish this package manually, which is done for security reasons so that there are constraints on individual devs pushing code that is then used by all Uni devs.
