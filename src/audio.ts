
/**
 * The AudioClip object provides a safe abstraction over the HTMLAudioElement
 */
class AudioClip {

clipObject : HTMLAudioElement

constructor(fileurl: string) {
    this.clipObject = new Audio(fileurl);
}

/**
 * Checks if the audio is ready to play -- this is only used internally.
 * @returns Whether or not the audio is ready.
 */
readyCheck() : boolean {
    return (this.clipObject.readyState == HTMLMediaElement.HAVE_ENOUGH_DATA);
}

/**
 * Plays the audio clip
 */
play() {
    if(!this.readyCheck())
        return;

    if(this.clipObject.paused) {
        this.clipObject.play();
    } else {
        this.clipObject.pause();
        this.clipObject.currentTime = 0;
        this.clipObject.play();
    }
}

/**
 * Pauses the audio clip
 */
pause() {
    if(!this.readyCheck())
        return;

    this.clipObject.pause();
}

/**
 * Pauses the audio clip and seeks to the beginning
 */
stop() {
    if(!this.readyCheck())
        return;

    this.clipObject.pause();
    this.clipObject.currentTime = 0;
}

/**
 * Mute the audio clip -- is a toggle.
 */
mute() {
    this.clipObject.muted = !this.clipObject.muted;
}

/**
 * Loop the audio clip -- is only one-directional
 * You cannot unset looping as the HTMLAudioElement does not support this.
 */
loop() {
    this.clipObject.loop = true;
}

/**
 * Sets the volume of a given audio clip.
 * @param vol The audio volume
 */
volume(vol: number) {
    this.clipObject.volume = vol;
}

}

var YZ_AudioManager : AudioManager;

/**
 * Audio Manager is responsible for the loading of audio files and stores them in an indexed array
 * They also contain a map of names and identifiers. It can be used to load any audio with an ID 
 * and retrieve the clip object.
 */
 class AudioManager {
    id_name_map: Map<string, number>;
    audio_list: Array<AudioClip>;

    constructor() {
        this.audio_list = new Array<AudioClip>(0);
        this.id_name_map = new Map<string, number>();
    }

    load_audio(name: string, url: string): number {
        var audio = new AudioClip(url);

        var id = this.audio_list.push(audio);
        this.id_name_map.set(name, id);
        return id;
    }

    /**
     * Lookup ID by name of the audio
     * @param name Name of the audio
     * @returns Audio ID or undefined if not found
     */
    lookup_id(name: string): number | undefined {
        return this.id_name_map.get(name);
    }

    /**
     * Gets an audio clip object.
     * @param id Identifier for the audio to find
     */
    get_clip(id: number): AudioClip {
        return this.audio_list[id - 1];
    }

    /**
     * Toggles global mute
     */
    mute(): void {
        this.audio_list.forEach(clip => {
            clip.mute();
        });
    }
}
