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

    run (cmd: string, options?: StorageCLI_RunArgs): Promise<{ stdout: string, stderr: string }>;
    response (cmd: string): Promise<StorageDaemonResult<any>>;
    list (): Promise<StorageDaemonResult<StorageDaemonTorrentList>>;
    get (hash: string): Promise<StorageDaemonResult<StorageDaemonFullTorrent>>;
    getPeers (hash: string): Promise<StorageDaemonResult<StorageDaemonPeerList>>;
    create (path: string, options?: StorageCLI_CreateArgs): Promise<StorageDaemonResult<StorageDaemonFullTorrent>>;
    addByHash (hash: string, options?: StorageCLI_AddArgs): Promise<StorageDaemonResult<StorageDaemonFullTorrent>>;
    addByMeta (path: string, options?: StorageCLI_AddArgs): Promise<StorageDaemonResult<StorageDaemonFullTorrent>>;
    getMeta (hash: string, path: string): Promise<StorageDaemonResult<{ message: "success", size: string }>>;
    remove (hash: string, options: StorageCLI_RemoveArgs): Promise<StorageDaemonResult<{ message: "success" }>>;
    downloadPause (hash: string): Promise<StorageDaemonResult<{ message: "success" }>>;
    downloadResume (hash: string): Promise<StorageDaemonResult<{ message: "success" }>>;
    uploadPause (hash: string): Promise<StorageDaemonResult<{ message: "success" }>>;
    uploadResume (hash: string): Promise<StorageDaemonResult<{ message: "success" }>>;
    priorityAll (hash: string, priority: number): Promise<StorageDaemonResult<{ message: "success" }>>;
    priorityName (hash: string, name: string, priority: number): Promise<StorageDaemonResult<{ message: "success" }>>;
    priorityIdx (hash: string, idx: number | string, priority: number): Promise<StorageDaemonResult<{ message: "success" }>>;

    // TODO: 
    deployProvider (...args: any[]): Promise<StorageDaemonResult<any>>;
    getProviderInfo (...args: any[]): Promise<StorageDaemonResult<any>>;
    setProviderConfig (...args: any[]): Promise<StorageDaemonResult<any>>;
    getProviderParams (...args: any[]): Promise<StorageDaemonResult<any>>;
    setProviderParams (...args: any[]): Promise<StorageDaemonResult<any>>;
    newContractMessage (...args: any[]): Promise<StorageDaemonResult<any>>;
    closeContract (...args: any[]): Promise<StorageDaemonResult<any>>;
    withdraw (...args: any[]): Promise<StorageDaemonResult<any>>;
    withdrawAll (...args: any[]): Promise<StorageDaemonResult<any>>;
    sendCoins (...args: any[]): Promise<StorageDaemonResult<any>>;
}