import {MediaObject, MediaObjectStatus} from './MediaObject';
const uuidv4 = require('uuid/v4');

//A MediaObject with additional playback-related information, ready to be added to the play queue
export class ContentBlock {
    id:string;
    colour:string = '#282482';
    media:MediaObject;
    mediaStatus: MediaObjectStatus = MediaObjectStatus.UNTRACKED;
    //TODO: Add playback modifiers here (start/end trimming)

    //ContentBlocks can have in and out transition times for fades/animations
    transitionInMs = 0;
    transitionOutMs = 0;

    /**
     * @param media The MediaObject this block will play
     * @param id (Optional) The ID to give this ContentBlock. By default a random unique ID will be generated.
     */
    constructor(media:MediaObject, id?:string) {
        if (id) {
            this.id = id;
        } else {
            this.id = uuidv4();
        }
        this.media = media;
    }

    toJSON() : any {
        return {
            id: this.id, colour: this.colour, media: this.media
        }
    }
}

export class EnqueuedContentBlock extends ContentBlock {
    readonly queueId: number;
    toJSON() {
        let j = super.toJSON();
        j.queuedId = this.queueId;
        return j;
    }
}

export class ContentBlockWithProgress extends EnqueuedContentBlock {
    readonly progressMs: number;
    toJSON() {
        let j = super.toJSON();
        j.progressMs = this.progressMs;
        return j;
    }
}