//References a piece of media that can be shown on-screen (eg. mp4, downloaded YT video, RMTP stream).
export class MediaObject {
    name:string;
    location:MediaLocation
    type: MediaType;
    durationMs: number; //A value of -1 indicates an infinite duration, like a graphic or live stream

    constructor(type: MediaType, name:string, location: MediaLocation, durationMs: number) {
        this.type = type;
        this.name = name;
        this.location = location;
        this.durationMs = durationMs;
    }

    static CreateEmpty(type: MediaType) : MediaObject {
        return new MediaObject(type, 'Unnamed', null, null);
    }

    thumbnail:string = null;
}

export enum MediaObjectStatus { READY = 'Ready', PENDING = 'Pending', OFFLINE = 'Offline', UNTRACKED = 'Untracked' };

export enum MediaType {
    LocalVideoFile = 'Local video file',
    YouTubeVideo = 'Youtube video',
    RTMPStream = 'RTMP stream',
    RerunGraphic = 'Rerun graphic'
}

export enum ContentType {
    LocalFile = 'LocalFile',
    WebStream = 'WebStream',
    RTMP = 'RTMP',
    GraphicsLayer = 'GraphicsLayer'
}

export class MediaLocation {
    public contentType: ContentType;
    public path: string;
}