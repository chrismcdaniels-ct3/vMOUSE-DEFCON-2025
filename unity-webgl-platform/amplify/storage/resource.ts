import { defineStorage } from '@aws-amplify/backend';

export const storage = defineStorage({
  name: 'unityWebGLStorage',
  access: (allow) => ({
    'unity-builds/*': [
      allow.guest.to(['read']),
      allow.authenticated.to(['read', 'write']),
      allow.groups(['ADMINS']).to(['read', 'write', 'delete'])
    ],
  })
});