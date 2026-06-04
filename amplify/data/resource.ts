import { type ClientSchema, a, defineData } from '@aws-amplify/backend';
import { uploadToGlacier } from '../functions/uploadToGlacier/resource';
import { listCrossAccountFolders } from '../functions/listCrossAccountFolders/resource';

const schema = a.schema({
  FileInfo: a.customType({
    key: a.string(),
    size: a.integer(),
    lastModified: a.string(),
    storageClass: a.string(),
  }),

  UploadResult: a.customType({
    success: a.boolean().required(),
    key: a.string(),
    bucket: a.string(),
    storageClass: a.string(),
    message: a.string(),
  }),

  ListResult: a.customType({
    folders: a.string().array(),
    files: a.ref('FileInfo').array(),
    bucket: a.string(),
  }),

  uploadToGlacier: a
    .query()
    .arguments({
      fileName: a.string().required(),
      fileContent: a.string().required(), // base64 encoded
      folderPath: a.string(),
      contentType: a.string(),
    })
    .returns(a.ref('UploadResult'))
    .authorization((allow) => [allow.authenticated()])
    .handler(a.handler.function(uploadToGlacier)),

  listCrossAccountFolders: a
    .query()
    .arguments({
      prefix: a.string(),
    })
    .returns(a.ref('ListResult'))
    .authorization((allow) => [allow.authenticated()])
    .handler(a.handler.function(listCrossAccountFolders)),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
  },
});
