# Mykad-Reader

## [Live Deployment](https://mykad-reader.pages.dev/)
Webpage for loading data from MyKad (Malaysia IC) cards for display. [A browser extension](https://github.com/cardid/webcard) is required to load the card readers, as they are usually blocked by WebUSB. Please be cautioned with the potential risks of using third-party extensions to process personal data.

This app uses the browser extension to allow users to view their MyKad details, and is written to easily allow users to make API calls with the data.

## Future Work
As of writing, WebUSB blocks access to Smartcard readers for security issues, though currently there is work towards a [Web Smart Card API](https://wicg.github.io/web-smart-card/). Once that has been implemented in browsers, this project may be refactored to use that instead.

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Compile and Minify for Production

```sh
npm run build
```
