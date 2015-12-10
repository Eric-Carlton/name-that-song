'use strict';

(
    function(){
        angular.module('nameThatSong.song', []).service(
            'SongService', ['$document', function ($document) {
                var audioElement = $document[0].createElement('audio'); // <-- Magic trick here
                return {
                    audioElement: audioElement,

                    play: function(filename) {
                        audioElement.src = filename;
                        audioElement.play();     //  <-- Thats all you need
                    }
                };
            }]
        );
    }
)();