import styled from "styled-components";
import { CogniteClient } from "cognite-sdk-v3";
import { response, orcResults } from "./resources";
import { FileViewerContextObserverPublicProps } from "../src";
import randomId from "../src/utils/randomId";

export const pdfFile = {
  id: 1,
  lastUpdatedTime: new Date(),
  uploaded: false,
  createdTime: new Date(),
  name: "Random File",
  mimeType: "application/pdf",
};

export const imgFile = {
  id: 1,
  lastUpdatedTime: new Date(),
  uploaded: false,
  createdTime: new Date(),
  name: "Random File",
  mimeType: "image/png",
};

export const imgSdk = ({
  events: {
    list: (..._: any[]) => ({ autoPagingToArray: async () => response }),
    update: async (...annotations: any[]) =>
      annotations.map((el) => el.annotation),
    create: async (...annotations: any[]) =>
      annotations.map((el) => ({ ...el, id: randomId() })),
  },
  post: async () => ({ data: { items: [{ annotations: orcResults }] } }),
  files: {
    retrieve: async () => [imgFile],
    getDownloadUrls: async () => [{ downloadUrl: "//unsplash.it/800/400" }],
  },
} as unknown) as CogniteClient;

export const pdfSdk = ({
  events: {
    list: (..._: any[]) => ({ autoPagingToArray: async () => response }),
    update: async (...annotations: any[]) =>
      annotations.map((el) => el.annotation),
    create: async (...annotations: any[]) =>
      annotations.map((el) => ({ ...el, id: randomId() })),
  },
  post: async () => ({ data: { items: [{ annotations: orcResults }] } }),
  files: {
    retrieve: async () => [pdfFile],
    getDownloadUrls: async () => [
      {
        downloadUrl:
          "https://cors-anywhere.herokuapp.com/https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
      },
    ],
  },
} as unknown) as CogniteClient;

export const Container = styled.div`
  width: 100%;
  height: 600px;
  background: grey;
`;

export const stubObserverObj = (_: FileViewerContextObserverPublicProps) =>
  null;
