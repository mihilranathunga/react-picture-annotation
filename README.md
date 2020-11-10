# [React Picture Annotation](https://cognitedata.github.io/react-picture-annotation/index.html?path=/docs/cognite-file-viewer--simple)

[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/kunduin/react-picture-annotation/blob/master/LICENSE)

A simple annotation component.

![rect](./doc/rect.gif)

## Install

```Bash
# npm
npm install @cognite/react-picture-annotation

# yarn
yarn add @cognite/react-picture-annotation
```

## Use within `Cognite Data Fusion`

By default, the PDF.JS worker is loaded in from a public CDN. But because of security concerns, we do not whitelist all domains to access things from public CDN within Fusion. Hence make sure to set the worker to a public hosted one like the ones here https://github.com/cognitedata/cdf-hub/tree/master/packages/root/static/dependencies. Also, make sure to check the version to use from package.json!

Setting the worker.js goes like this:

```
pdfjs.GlobalWorkerOptions.workerSrc = `//dev.fusion.cogniteapp.com/dependencies/pdfjs-dist@2.6.347/build/pdf.worker.js`;
```

Do this at the top of the file.

## [Storybook](https://cognitedata.github.io/react-picture-annotation/index.html?path=/docs/cognite-file-viewer--simple)

Shout out the the orig repo: https://github.com/Kunduin/react-picture-annotation
