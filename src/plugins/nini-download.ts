import { registerPlugin } from '@capacitor/core';

export interface NiniDownloadPlugin {
  download(opts: { url: string; title?: string }): Promise<{ ok: boolean; path?: string; error?: string }>;
}

const NiniDownload = registerPlugin<NiniDownloadPlugin>('NiniDownload');
export default NiniDownload;
