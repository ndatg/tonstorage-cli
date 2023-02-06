export type StorageCLI_AddArgs = {
    download?: boolean;
    upload?: boolean;
    rootDir?: string;
    partialFiles?: string[];
}

export type StorageCLI_CreateArgs = {
    upload?: boolean;
    copy?: boolean;
    description?: string;
}

export type StorageCLI_RunArgs = {
    timeout?: number;
    maxBuffer?: number;
}

export type StorageCLI_RemoveArgs = {
    removeFiles?: boolean;
}


export type StorageCLI_ConstructorArgs = StorageCLI_RunArgs & { 
    bin: string;
    host: string;
    database: string;
}




export type StorageDaemonFileInfo = {
    "@type": "storage.daemon.fileInfo";
    downloaded_size: string;
    name: string;
    priority: number;
    size: string;
};

export type StorageDaemonTorrent = {
    "@type": "storage.daemon.torrent";
    active_download: boolean;
    active_upload: boolean;
    completed: boolean;
    description: string;
    dir_name: string;
    download_speed: number;
    downloaded_size: string;
    fatal_error: string;
    files_count: string;
    flags?: number;
    hash: string;
    included_size: string;
    root_dir: string;
    total_size: string;
    upload_speed: number;
}

export type StorageDaemonPeer = {
    "@type": "storage.daemon.peer";
    adnl_id: string;
    download_speed: number;
    ip_str: string;
    ready_parts: string;
    upload_speed: number;
}

export type StorageDaemonPeerList = {
    "@type": "storage.daemon.peerList";
    download_speed: number;
    peers: StorageDaemonPeer[];
    total_parts: string;
    upload_speed: number;
}

export type StorageDaemonFullTorrent = {
    "@type": "storage.daemon.torrentFull";
    files: StorageDaemonFileInfo[];
    torrent: StorageDaemonTorrent;
}

export type StorageDaemonTorrentList = {
    "@type": "storage.daemon.torrentList";
    torrents: StorageDaemonTorrent[];
}

export type StorageDaemonResult<T> = ({
    ok: true;
    result: T;
} | {
    ok: false;
    error: string;
}) & { code: number; }

export default class TonstorageCLI {
    constructor (options: StorageCLI_ConstructorArgs);

    async run (cmd: string, options?: StorageCLI_RunArgs): Promise<{ stdout: string, stderr: string }>;
    async response (cmd: string): Promise<StorageDaemonResult<any>>;
    async list (): Promise<StorageDaemonResult<StorageDaemonTorrentList>>;
    async get (hash: string): Promise<StorageDaemonResult<StorageDaemonFullTorrent>>;
    async getPeers (hash: string): Promise<StorageDaemonResult<StorageDaemonPeerList>>;
    async create (path: string, options?: StorageCLI_CreateArgs): Promise<StorageDaemonResult<StorageDaemonFullTorrent>>;
    async addByHash (hash: string, options?: StorageCLI_AddArgs): Promise<StorageDaemonResult<StorageDaemonFullTorrent>>;
    async addByMeta (path: string, options?: StorageCLI_AddArgs): Promise<StorageDaemonResult<StorageDaemonFullTorrent>>;
    async getMeta (hash: string, path: string): Promise<StorageDaemonResult<{ message: "success", size: string }>>;
    async remove (hash: string, options: StorageCLI_RemoveArgs): Promise<StorageDaemonResult<{ message: "success" }>>;
    async downloadPause (hash: string): Promise<StorageDaemonResult<{ message: "success" }>>;
    async downloadResume (hash: string): Promise<StorageDaemonResult<{ message: "success" }>>;
    async uploadPause (hash: string): Promise<StorageDaemonResult<{ message: "success" }>>;
    async uploadResume (hash: string): Promise<StorageDaemonResult<{ message: "success" }>>;
    async priorityAll (hash: string, priority: number): Promise<StorageDaemonResult<{ message: "success" }>>;
    async priorityName (hash: string, name: string, priority: number): Promise<StorageDaemonResult<{ message: "success" }>>;
    async priorityIdx (hash: string, idx: number | string, priority: number): Promise<StorageDaemonResult<{ message: "success" }>>;

    // TODO: 
    async deployProvider (...args: any[]): Promise<StorageDaemonResult<any>>;
    async getProviderInfo (...args: any[]): Promise<StorageDaemonResult<any>>;
    async setProviderConfig (...args: any[]): Promise<StorageDaemonResult<any>>;
    async getProviderParams (...args: any[]): Promise<StorageDaemonResult<any>>;
    async setProviderParams (...args: any[]): Promise<StorageDaemonResult<any>>;
    async newContractMessage (...args: any[]): Promise<StorageDaemonResult<any>>;
    async closeContract (...args: any[]): Promise<StorageDaemonResult<any>>;
    async withdraw (...args: any[]): Promise<StorageDaemonResult<any>>;
    async withdrawAll (...args: any[]): Promise<StorageDaemonResult<any>>;
    async sendCoins (...args: any[]): Promise<StorageDaemonResult<any>>;
}