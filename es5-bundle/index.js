'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.Client = undefined;

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _libJitsiMeetMin = require('./vendor/lib-jitsi-meet.min.js');

var _libJitsiMeetMin2 = _interopRequireDefault(_libJitsiMeetMin);

var _wildemitter = require('wildemitter');

var Emitter = _interopRequireWildcard(_wildemitter);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// const options = {
//     hosts: {
//         domain: 'meet.jit.si',
//         muc: 'conference.meet.jit.si' // FIXME: use XEP-0030
//     },
//     bosh: 'https://meet.jit.si/http-bind', // FIXME: use xep-0156 for that

//     // The name of client node advertised in XEP-0115 'c' stanza
//     clientNode: 'http://jitsi.org/jitsimeet'
// };
var Client = exports.Client = function Client(config) {
	(0, _classCallCheck3.default)(this, Client);

	var self = this;
	// const confOptions = options.confOptions;
	var emitter = this.emitter = new Emitter.default();
	window['JitsiMeetJS'] = _libJitsiMeetMin2.default;
	var connection = null;
	var isJoined = false;
	var room = null;

	var localTracks = [];
	this.localTracks = localTracks;
	this.localStream = null;

	var remoteTracks = {};
	var JitsiTrackEvents = _libJitsiMeetMin2.default.events;
	if (config.logLevel == "error") {
		_libJitsiMeetMin2.default.setLogLevel(_libJitsiMeetMin2.default.logLevels.ERROR);
	}
	if (config.logLevel == "warn") {
		_libJitsiMeetMin2.default.setLogLevel(_libJitsiMeetMin2.default.logLevels.WARN);
	}
	if (config.logLevel == "info") {
		_libJitsiMeetMin2.default.setLogLevel(_libJitsiMeetMin2.default.logLevels.INFO);
	}
	if (config.logLevel == "debug") {
		_libJitsiMeetMin2.default.setLogLevel(_libJitsiMeetMin2.default.logLevels.DEBUG);
	}
	if (config.logLevel == "fatal") {
		_libJitsiMeetMin2.default.setLogLevel(_libJitsiMeetMin2.default.logLevels.FATAL);
	}
	if (config.logLevel == "trace") {
		_libJitsiMeetMin2.default.setLogLevel(_libJitsiMeetMin2.default.logLevels.TRACE);
	}
	/**
  * Handles local tracks.
  * @param tracks Array with JitsiTrack objects
  */
	function onLocalTracks(tracks) {
		// console.warn("EVENTS", JitsiMeetJS.events)
		localTracks = tracks;
		self.localStream = new MediaStream();
		for (var i = 0; i < localTracks.length; i++) {
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
			if (config.localVideo.muted) {
				if (localTracks[i].getType() === 'audio') {
					continue;
				}
			}
			self.localStream.addTrack(localTracks[i].track);

			if (localTracks[i].getType() === 'video') {
				// $('body').append(`<video autoplay='1' id='localVideo${i}' />`);
				// localTracks[i].attach($(`#localVideo${i}`)[0]);
			} else {}
				// $('body').append(
				//     `<audio autoplay='1' muted='true' id='localAudio${i}' />`);
				// localTracks[i].attach($(`#localAudio${i}`)[0]);

				// room.addTrack(localTracks[i])
			if (isJoined) {
				room.addTrack(localTracks[i]);
			}
		}
		emitter.emit("onLocalTracksAdded", tracks);
		emitter.emit("onLocalStreamAdded", self.localStream);
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
		var participant_id = track.getParticipantId();

		var participant = null;
		if (!self.room.participants[participant_id]) {
			participant = self.room.participants[participant_id] = [];
		} else {
			participant = self.room.participants[participant_id];
		}

		if (!remoteTracks[participant_id]) {
			remoteTracks[participant_id] = [];
		}
		// const idx = remoteTracks[participant_id].push(track);

		track.addEventListener(_libJitsiMeetMin2.default.events.track.TRACK_AUDIO_LEVEL_CHANGED, function (audioLevel) {
			return console.log('Audio Level remote: ' + audioLevel);
		});
		track.addEventListener(_libJitsiMeetMin2.default.events.track.TRACK_MUTE_CHANGED, function () {
			return console.log('remote track muted');
		});
		track.addEventListener(_libJitsiMeetMin2.default.events.track.LOCAL_TRACK_STOPPED, function () {
			return console.log('remote track stoped');
		});
		track.addEventListener(_libJitsiMeetMin2.default.events.track.TRACK_AUDIO_OUTPUT_CHANGED, function (deviceId) {
			return console.log('track audio output device was changed to ' + deviceId);
		});

		participant.stream = new MediaStream();
		for (var i = 0; i < participant._tracks.length; i++) {
			var track = participant._tracks[i];
			participant.stream.addTrack(track.track);
		}
		emitter.emit("onRemoteStreamAdded", participant);
		emitter.emit("onRemoteTrackAdded", track, participant);
	}

	function onRemoteTrackRemoved(track) {
		if (track.isLocal()) {
			return;
		}
		var participant_id = track.getParticipantId();

		var participant = self.room.participants[participant_id];
		if (participant) {
			track.removeAllListeners(JitsiTrackEvents.TRACK_MUTE_CHANGED);
			track.removeAllListeners(JitsiTrackEvents.TRACK_VIDEOTYPE_CHANGED);

			console.log("Delete", self.room.participants[participant_id]);
			if (participant.stream) {
				if (!participant.stream.getTracks()) {
					// delete(self.room.participants[participant_id])
					emitter.emit("onRemoteStreamRemoved", participant);
				} else {
					participant.stream.removeTrack(track.track);
				}
			} else {
				// delete(self.room.participants[participant_id])
				emitter.emit("onRemoteTrackRemoved", track, participant);
			}
			console.warn("participants", participant);
		}
	}

	/**
  * That function is executed when the conference is joined
  */
	function onConferenceJoined() {
		console.log('conference joined!');
		isJoined = true;
		emitter.emit("roomJoin", localTracks);
		for (var i = 0; i < localTracks.length; i++) {
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

		emitter.emit("userLeft", id);
	}

	self.getConferenceOptions = function () {
		var options = config.initOptions;
		options.config = config.initOptions;
		if (config.enableRecording && !config.recordingType) {
			options.recordingType = config.hosts && typeof config.hosts.jirecon !== 'undefined' ? 'jirecon' : 'colibri';
		}

		var nick = config.displayName; //APP.settings.getDisplayName();

		if (nick) {
			options.displayName = nick;
		}

		// options.applicationName = interfaceConfig.APP_NAME;
		// options.getWiFiStatsMethod = getJitsiMeetGlobalNS().getWiFiStats;

		return options;
	};

	/**
  * That function is called when connection is established successfully
  */
	function onConnectionSuccess() {
		console.log("config", self.getConferenceOptions());
		self.room = room = connection.initJitsiConference(config.roomName.toLowerCase(), self.getConferenceOptions());
		room.on(_libJitsiMeetMin2.default.events.conference.TRACK_ADDED, onRemoteTrack);
		// room.on(JitsiMeetJS.events.conference.TRACK_REMOVED, onRemoteTrackRemoved);
		room.on(_libJitsiMeetMin2.default.events.conference.CONFERENCE_JOINED, onConferenceJoined);
		room.on(_libJitsiMeetMin2.default.events.conference.USER_JOINED, function (id) {
			remoteTracks[id] = [];
			emitter.emit("userJoin", id);
		});
		room.on(_libJitsiMeetMin2.default.events.conference.CONNECTION_INTERRUPTED, function () {
			console.warn("CONNECTION_INTERRUPTED");
		});
		room.on(_libJitsiMeetMin2.default.events.conference.CONNECTION_RESTORED, function () {
			console.warn("CONNECTION_RESTORED");
		});
		room.on(_libJitsiMeetMin2.default.events.conference.USER_LEFT, onUserLeft);
		room.on(_libJitsiMeetMin2.default.events.conference.TRACK_MUTE_CHANGED, function (track) {
			console.log(track.getType() + ' - ' + track.isMuted());
		});
		room.on(_libJitsiMeetMin2.default.events.conference.DISPLAY_NAME_CHANGED, function (userID, displayName) {
			return console.log(userID + ' - ' + displayName);
		});
		room.on(_libJitsiMeetMin2.default.events.conference.TRACK_AUDIO_LEVEL_CHANGED, function (userID, audioLevel) {
			return console.log(userID + ' - ' + audioLevel);
		});
		room.on(_libJitsiMeetMin2.default.events.conference.RECORDER_STATE_CHANGED, function () {
			return console.log(room.isRecordingSupported() + ' - ' + room.getRecordingState() + ' - ' + room.getRecordingURL());
		});
		room.on(_libJitsiMeetMin2.default.events.conference.PHONE_NUMBER_CHANGED, function () {
			return console.log(room.getPhoneNumber() + ' - ' + room.getPhonePin());
		});

		room.setDisplayName(config.displayName);
		emitter.emit("connectionSuccess");
	}

	this.join = function () {
		room.join();
	};

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
	var disconnect = this.disconnect = function () {
		console.log('disconnect!');
		connection.removeEventListener(_libJitsiMeetMin2.default.events.connection.CONNECTION_ESTABLISHED, onConnectionSuccess);
		connection.removeEventListener(_libJitsiMeetMin2.default.events.connection.CONNECTION_FAILED, onConnectionFailed);
		connection.removeEventListener(_libJitsiMeetMin2.default.events.connection.CONNECTION_DISCONNECTED, disconnect);

		room.leave();
		connection.disconnect();
	};

	/**
  *
  */
	function unload() {
		// for (let i = 0; i < localTracks.length; i++) {
		//     localTracks[i].stop();
		// }
		disconnect();
	}

	var isVideo = true;

	/**
  *
  */
	function switchVideo() {
		// eslint-disable-line no-unused-vars
		isVideo = !isVideo;
		if (localTracks[1]) {
			localTracks[1].dispose();
			localTracks.pop();
		}
		_libJitsiMeetMin2.default.createLocalTracks({
			devices: [isVideo ? 'video' : 'desktop']
		}).then(function (tracks) {
			localTracks.push(tracks[0]);
			localTracks[1].addEventListener(_libJitsiMeetMin2.default.events.track.TRACK_MUTE_CHANGED, function () {
				return console.log('local track muted');
			});
			localTracks[1].addEventListener(_libJitsiMeetMin2.default.events.track.LOCAL_TRACK_STOPPED, function () {
				return console.log('local track stoped');
			});
			localTracks[1].attach($('#localVideo1')[0]);
			room.addTrack(localTracks[1]);
		}).catch(function (error) {
			return console.log(error);
		});
	}

	/**
  *
  * @param selected
  */
	function changeAudioOutput(selected) {
		// eslint-disable-line no-unused-vars
		_libJitsiMeetMin2.default.mediaDevices.setAudioOutputDevice(selected.value);
	}

	$(window).bind('beforeunload', unload);
	$(window).bind('unload', unload);

	// JitsiMeetJS.setLogLevel(JitsiMeetJS.logLevels.ERROR);
	var initOptions = {
		disableAudioLevels: true,

		// The ID of the jidesha extension for Chrome.
		desktopSharingChromeExtId: 'mbocklcggfhnbahlnepmldehdhpjfcjp',

		// Whether desktop sharing should be disabled on Chrome.
		desktopSharingChromeDisabled: false,

		// The media sources to use when using screen sharing with the Chrome
		// extension.
		desktopSharingChromeSources: ['screen', 'window'],

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

	_libJitsiMeetMin2.default.init(initOptions).then(function () {
		self.connection = connection = new _libJitsiMeetMin2.default.JitsiConnection(null, null, config.initOptions);

		connection.addEventListener(_libJitsiMeetMin2.default.events.connection.CONNECTION_ESTABLISHED, onConnectionSuccess);
		connection.addEventListener(_libJitsiMeetMin2.default.events.connection.CONNECTION_FAILED, onConnectionFailed);
		connection.addEventListener(_libJitsiMeetMin2.default.events.connection.CONNECTION_DISCONNECTED, disconnect);

		_libJitsiMeetMin2.default.mediaDevices.addEventListener(_libJitsiMeetMin2.default.events.mediaDevices.DEVICE_LIST_CHANGED, onDeviceListChanged);

		connection.connect();

		_libJitsiMeetMin2.default.createLocalTracks({ devices: ['audio', 'video'] }).then(onLocalTracks).catch(function (error) {
			throw error;
		});
	}).catch(function (error) {
		return console.log(error);
	});

	if (_libJitsiMeetMin2.default.mediaDevices.isDeviceChangeAvailable('output')) {
		_libJitsiMeetMin2.default.mediaDevices.enumerateDevices(function (devices) {
			var audioOutputDevices = devices.filter(function (d) {
				return d.kind === 'audiooutput';
			});

			if (audioOutputDevices.length > 1) {
				$('#audioOutputSelect').html(audioOutputDevices.map(function (d) {
					return '<option value="' + d.deviceId + '">' + d.label + '</option>';
				}).join('\n'));

				$('#audioOutputSelectWrapper').show();
			}
		});
	}
};