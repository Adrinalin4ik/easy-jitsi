// const options = {
//     hosts: {
//         domain: 'meet.jit.si',
//         muc: 'conference.meet.jit.si' // FIXME: use XEP-0030
//     },
//     bosh: 'https://meet.jit.si/http-bind', // FIXME: use xep-0156 for that

//     // The name of client node advertised in XEP-0115 'c' stanza
//     clientNode: 'http://jitsi.org/jitsimeet'
// };
import JitsiMeetJS from './vendor/lib-jitsi-meet.min.js'
import * as Emitter from 'wildemitter'
 
export class Client{

	constructor(config){
		let self = this;
		// const confOptions = options.confOptions;
		const emitter = this.emitter = new Emitter.default();
		window['JitsiMeetJS'] = JitsiMeetJS
		let connection = null;
		let isJoined = false;
		let room = null;

		let localTracks = [];
		this.localTracks = localTracks;
		this.localStream = null;
		
		const remoteTracks = {};
		const JitsiTrackEvents = JitsiMeetJS.events
		if (config.logLevel == "error"){
			JitsiMeetJS.setLogLevel(JitsiMeetJS.logLevels.ERROR);
		}
		if (config.logLevel == "warn"){
			JitsiMeetJS.setLogLevel(JitsiMeetJS.logLevels.WARN);
		}
		if (config.logLevel == "info"){
			JitsiMeetJS.setLogLevel(JitsiMeetJS.logLevels.INFO);
		}
		if (config.logLevel == "debug"){
			JitsiMeetJS.setLogLevel(JitsiMeetJS.logLevels.DEBUG);
		}
		if (config.logLevel == "fatal"){
			JitsiMeetJS.setLogLevel(JitsiMeetJS.logLevels.FATAL);
		}
		if (config.logLevel == "trace"){
			JitsiMeetJS.setLogLevel(JitsiMeetJS.logLevels.TRACE);
		}
		/**
		 * Handles local tracks.
		 * @param tracks Array with JitsiTrack objects
		 */
		function onLocalTracks(tracks) {
			// console.warn("EVENTS", JitsiMeetJS.events)
		    localTracks = tracks;
		    self.localStream = new MediaStream;
		    for (let i = 0; i < localTracks.length; i++) {
		        // localTracks[i].addEventListener(
		        //     JitsiMeetJS.events.track.TRACK_AUDIO_LEVEL_CHANGED,
		        //     audioLevel => console.log(`Audio Level local: ${audioLevel}`));
		        // localTracks[i].addEventListener(
		        //     JitsiMeetJS.events.track.TRACK_MUTE_CHANGED,
		        //     () => console.log('local track muted'));
		        // localTracks[i].addEventListener(
		        //     JitsiMeetJS.events.track.LOCAL_TRACK_STOPPED,
		        //     () => console.log('local track stoped'));
		        // localTracks[i].addEventListener(
		        //     JitsiMeetJS.events.track.TRACK_AUDIO_OUTPUT_CHANGED,
		        //     deviceId =>
		        //         console.log(
		        //             `track audio output device was changed to ${deviceId}`));
		        if (config.localVideo.muted){
		        	if (localTracks[i].getType() === 'audio') {
		        		continue;
		        	}
		        }
		        self.localStream.addTrack(localTracks[i].track);

		        if (localTracks[i].getType() === 'video') {
		            // $('body').append(`<video autoplay='1' id='localVideo${i}' />`);
		            // localTracks[i].attach($(`#localVideo${i}`)[0]);
		        } else {
		            // $('body').append(
		            //     `<audio autoplay='1' muted='true' id='localAudio${i}' />`);
		            // localTracks[i].attach($(`#localAudio${i}`)[0]);
		        }
		         // room.addTrack(localTracks[i])
		        if (isJoined) {
		            room.addTrack(localTracks[i]);
		        }
		    }
		    emitter.emit("onLocalTracksAdded", tracks)
		    emitter.emit("onLocalStreamAdded", self.localStream)
		}

		/**
		 * Handles remote tracks
		 * @param track JitsiTrack object
		 */
		// let participants = []
		function onRemoteTrack(track) {
		    if (track.isLocal()) {
		        return;
		    }
		    const participant_id = track.getParticipantId();

		    var participant = null;
		    if (!self.room.participants[participant_id]){
		    	participant = self.room.participants[participant_id] = []
		    }else{
		    	participant = self.room.participants[participant_id]
		    }

		    if (!remoteTracks[participant_id]) {
		        remoteTracks[participant_id] = [];
		    }
		    // const idx = remoteTracks[participant_id].push(track);

		    track.addEventListener(
		        JitsiMeetJS.events.track.TRACK_AUDIO_LEVEL_CHANGED,
		        audioLevel => console.log(`Audio Level remote: ${audioLevel}`));
		    track.addEventListener(
		        JitsiMeetJS.events.track.TRACK_MUTE_CHANGED,
		        () => console.log('remote track muted'));
		    track.addEventListener(
		        JitsiMeetJS.events.track.LOCAL_TRACK_STOPPED,
		        () => console.log('remote track stoped'));
		    track.addEventListener(JitsiMeetJS.events.track.TRACK_AUDIO_OUTPUT_CHANGED,
		        deviceId =>
		            console.log(
		                `track audio output device was changed to ${deviceId}`));


		    participant.stream = new MediaStream;
		    for (let i = 0; i < participant._tracks.length; i++) {
		    	var track = participant._tracks[i]
		    	participant.stream.addTrack(track.track);

		    }
		    emitter.emit("onRemoteStreamAdded", participant)
		   	emitter.emit("onRemoteTrackAdded", track, participant)
		 
		    
		}


		function onRemoteTrackRemoved(track) {
		    if (track.isLocal()) {
		        return;
		    }
		    const participant_id = track.getParticipantId();

		    var participant = self.room.participants[participant_id];
		     if (participant){
			    track.removeAllListeners(JitsiTrackEvents.TRACK_MUTE_CHANGED);
	    		track.removeAllListeners(JitsiTrackEvents.TRACK_VIDEOTYPE_CHANGED);

	    		console.log("Delete", self.room.participants[participant_id])
			    if(participant.stream){
				   	if(!participant.stream.getTracks()){
				   		// delete(self.room.participants[participant_id])
				   		emitter.emit("onRemoteStreamRemoved", participant)
				   	}else{
				   		participant.stream.removeTrack(track.track);
				   	}
				}else{
					// delete(self.room.participants[participant_id])
				   	emitter.emit("onRemoteTrackRemoved", track, participant)
				}
			    console.warn("participants", participant)
		    }
		}

		/**
		 * That function is executed when the conference is joined
		 */
		function onConferenceJoined() {
		    console.log('conference joined!');
		    isJoined = true;
		    emitter.emit("roomJoin",localTracks)
		    for (let i = 0; i < localTracks.length; i++) {
		        room.addTrack(localTracks[i]);
		    }
		}

		/**
		 *
		 * @param id
		 */
		function onUserLeft(id) {
		    console.log('user left');
		    // if (!remoteTracks[id]) {
		    //     return;
		    // }
		    // const tracks = remoteTracks[id];

		    // for (let i = 0; i < tracks.length; i++) {
		    //     // tracks[i].detach($(`#${id}${tracks[i].getType()}`));
		    // }

		    emitter.emit("userLeft",id)
		}

		self.getConferenceOptions = function() {
			var options = config.initOptions;
			options.config = config.initOptions
			if (config.enableRecording && !config.recordingType) {
				options.recordingType = config.hosts && typeof config.hosts.jirecon !== 'undefined' ? 'jirecon' : 'colibri';
			}

			var nick = config.displayName//APP.settings.getDisplayName();

			if (nick) {
				options.displayName = nick;
			}

			// options.applicationName = interfaceConfig.APP_NAME;
			// options.getWiFiStatsMethod = getJitsiMeetGlobalNS().getWiFiStats;
			
			return options;
		}


		/**
		 * That function is called when connection is established successfully
		 */
		function onConnectionSuccess() {
			console.log("config",self.getConferenceOptions())
		    self.room = room = connection.initJitsiConference(config.roomName.toLowerCase(), self.getConferenceOptions());
		    room.on(JitsiMeetJS.events.conference.TRACK_ADDED, onRemoteTrack);
		    // room.on(JitsiMeetJS.events.conference.TRACK_REMOVED, onRemoteTrackRemoved);
		    room.on(
		        JitsiMeetJS.events.conference.CONFERENCE_JOINED,
		        onConferenceJoined);
		    room.on(JitsiMeetJS.events.conference.USER_JOINED, id => {
		        remoteTracks[id] = [];
		        emitter.emit("userJoin",id)
		    });
		    room.on(JitsiMeetJS.events.conference.CONNECTION_INTERRUPTED, () => {
                console.warn("CONNECTION_INTERRUPTED")
            });
            room.on(JitsiMeetJS.events.conference.CONNECTION_RESTORED, () => {
            	console.warn("CONNECTION_RESTORED")
            });
		    room.on(JitsiMeetJS.events.conference.USER_LEFT, onUserLeft);
		    room.on(JitsiMeetJS.events.conference.TRACK_MUTE_CHANGED, track => {
		        console.log(`${track.getType()} - ${track.isMuted()}`);
		    });
		    room.on(
		        JitsiMeetJS.events.conference.DISPLAY_NAME_CHANGED,
		        (userID, displayName) => console.log(`${userID} - ${displayName}`));
		    room.on(
		        JitsiMeetJS.events.conference.TRACK_AUDIO_LEVEL_CHANGED,
		        (userID, audioLevel) => console.log(`${userID} - ${audioLevel}`));
		    room.on(
		        JitsiMeetJS.events.conference.RECORDER_STATE_CHANGED,
		        () =>
		            console.log(
		                `${room.isRecordingSupported()} - ${
		                    room.getRecordingState()} - ${
		                    room.getRecordingURL()}`));
		    room.on(
		        JitsiMeetJS.events.conference.PHONE_NUMBER_CHANGED,
		        () => console.log(`${room.getPhoneNumber()} - ${room.getPhonePin()}`));


		    room.setDisplayName(config.displayName)
		    emitter.emit("connectionSuccess")
		}

		this.join = function(){
			room.join();
		}

		/**
		 * This function is called when the connection fail.
		 */
		function onConnectionFailed() {
		    console.error('Connection Failed!');
		}

		/**
		 * This function is called when the connection fail.
		 */
		function onDeviceListChanged(devices) {
		    console.info('current devices', devices);
		}

		/**
		 * This function is called when we disconnect.
		 */
		var disconnect = this.disconnect = function() {
		    console.log('disconnect!');
		    connection.removeEventListener(
		        JitsiMeetJS.events.connection.CONNECTION_ESTABLISHED,
		        onConnectionSuccess);
		    connection.removeEventListener(
		        JitsiMeetJS.events.connection.CONNECTION_FAILED,
		        onConnectionFailed);
		    connection.removeEventListener(
		        JitsiMeetJS.events.connection.CONNECTION_DISCONNECTED,
		        disconnect);

		    room.leave();
		    connection.disconnect();
		}

		/**
		 *
		 */
		function unload() {
		    // for (let i = 0; i < localTracks.length; i++) {
		    //     localTracks[i].stop();
		    // }
		    disconnect();
		}

		let isVideo = true;

		/**
		 *
		 */
		function switchVideo() { // eslint-disable-line no-unused-vars
		    isVideo = !isVideo;
		    if (localTracks[1]) {
		        localTracks[1].dispose();
		        localTracks.pop();
		    }
		    JitsiMeetJS.createLocalTracks({
		        devices: [ isVideo ? 'video' : 'desktop' ]
		    })
		        .then(tracks => {
		            localTracks.push(tracks[0]);
		            localTracks[1].addEventListener(
		                JitsiMeetJS.events.track.TRACK_MUTE_CHANGED,
		                () => console.log('local track muted'));
		            localTracks[1].addEventListener(
		                JitsiMeetJS.events.track.LOCAL_TRACK_STOPPED,
		                () => console.log('local track stoped'));
		            localTracks[1].attach($('#localVideo1')[0]);
		            room.addTrack(localTracks[1]);
		        })
		        .catch(error => console.log(error));
		}

		/**
		 *
		 * @param selected
		 */
		function changeAudioOutput(selected) { // eslint-disable-line no-unused-vars
		    JitsiMeetJS.mediaDevices.setAudioOutputDevice(selected.value);
		}

		$(window).bind('beforeunload', unload);
		$(window).bind('unload', unload);

		// JitsiMeetJS.setLogLevel(JitsiMeetJS.logLevels.ERROR);
		const initOptions = {
		    disableAudioLevels: true,

		    // The ID of the jidesha extension for Chrome.
		    desktopSharingChromeExtId: 'mbocklcggfhnbahlnepmldehdhpjfcjp',

		    // Whether desktop sharing should be disabled on Chrome.
		    desktopSharingChromeDisabled: false,

		    // The media sources to use when using screen sharing with the Chrome
		    // extension.
		    desktopSharingChromeSources: [ 'screen', 'window' ],

		    // Required version of Chrome extension
		    desktopSharingChromeMinExtVersion: '0.1',

		    // The ID of the jidesha extension for Firefox. If null, we assume that no
		    // extension is required.
		    desktopSharingFirefoxExtId: null,

		    // Whether desktop sharing should be disabled on Firefox.
		    desktopSharingFirefoxDisabled: true,

		    // The maximum version of Firefox which requires a jidesha extension.
		    // Example: if set to 41, we will require the extension for Firefox versions
		    // up to and including 41. On Firefox 42 and higher, we will run without the
		    // extension.
		    // If set to -1, an extension will be required for all versions of Firefox.
		    desktopSharingFirefoxMaxVersionExtRequired: -1,

		    // The URL to the Firefox extension for desktop sharing.
		    desktopSharingFirefoxExtensionURL: null
		};

		JitsiMeetJS.init(initOptions)
		    .then(() => {
		        self.connection = connection = new JitsiMeetJS.JitsiConnection(null, null, config.initOptions);

		        connection.addEventListener(
		            JitsiMeetJS.events.connection.CONNECTION_ESTABLISHED,
		            onConnectionSuccess);
		        connection.addEventListener(
		            JitsiMeetJS.events.connection.CONNECTION_FAILED,
		            onConnectionFailed);
		        connection.addEventListener(
		            JitsiMeetJS.events.connection.CONNECTION_DISCONNECTED,
		            disconnect);

		        JitsiMeetJS.mediaDevices.addEventListener(
		            JitsiMeetJS.events.mediaDevices.DEVICE_LIST_CHANGED,
		            onDeviceListChanged);

		        connection.connect();

		        JitsiMeetJS.createLocalTracks({ devices: [ 'audio', 'video' ] })
		            .then(onLocalTracks)
		            .catch(error => {
		                throw error;
		            });
		    })
		    .catch(error => console.log(error));

		if (JitsiMeetJS.mediaDevices.isDeviceChangeAvailable('output')) {
		    JitsiMeetJS.mediaDevices.enumerateDevices(devices => {
		        const audioOutputDevices
		            = devices.filter(d => d.kind === 'audiooutput');

		        if (audioOutputDevices.length > 1) {
		            $('#audioOutputSelect').html(
		                audioOutputDevices
		                    .map(
		                        d =>
		                            `<option value="${d.deviceId}">${d.label}</option>`)
		                    .join('\n'));

		            $('#audioOutputSelectWrapper').show();
		        }
		    });
		}
	}


}