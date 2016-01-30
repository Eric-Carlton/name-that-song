'use strict';

(function () {
    angular.module('nameThatSong.song', []).service(
        'SongService', ['$document', function ($document) {
            const audioElement = $document[0].createElement('audio');
            return {
                audioElement: audioElement,

                play: (filename) => {
                    audioElement.src = filename;
                    audioElement.play();
                }
            };
        }]
    );
})();