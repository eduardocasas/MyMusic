$(document).ready
(
    function()
    {
        /* ----------- Init ----------- */
        
        var PLAYLIST        = $('#playlist'),
            playing_state   = false,
            pause_state     = false,
            PREVIOUS_SONG   = 1,
            NEXT_SONG       = 2,
            increment       = 0,
            song_queue      = {},
            song_progress_interval,
            song_pause_time,
            song_start_time,
            song_length,
            context,
            source;
    
        paintBreadCrumb();
        window.history.replaceState(null, null, window.location.href);
        window.onpopstate = function() { getDataFromServer(window.history.state.replace('/'+MY_SLUG+'?path=', '')) };
        window.AudioContext = window.AudioContext||window.webkitAudioContext;
        context = new AudioContext();

        /* ----------- Open Folder ----------- */
        
        function paintBreadCrumb()
        {
            $('#breadcrumb').appendTo($('#main_header_wrapper'));
            $('.folder_action_button', $('#breadcrumb li').last()).addClass('folder_action_button_hover');        
        }
        function getDataFromServer(path)
        {
            $('#main_loading').show();
            $.post
            (
                window.location.href,
                {
                    ajax_action         : 'openFolderAction',
                    csrfmiddlewaretoken : $('input[name=csrfmiddlewaretoken]').val(),
                    new_path            : path  
                },
                function(response)
                {
                    $('#breadcrumb').remove();
                    $('#section_wrapper').hide().html(response).fadeIn('slow');
                    paintBreadCrumb();
                    $('#main_loading').hide();
                }
            );
        }
        $('#body_wrapper').on
        (
            'click',
            '.folder_action_button',
            function(event)
            {
                event.preventDefault();
                window.history.pushState($(this).attr('href'), $(this).text(), $(this).attr('href'));
                var path = $(this).attr('href').replace('/'+MY_SLUG+'?path=', ''),
                    aux = path.replace(MY_HOME_PATH, '').substr(1).split('/'),
                    subtitle = '';
                getDataFromServer(path);
                if (aux[0].length) {
                    for (var index in aux) {
                        subtitle = aux[index]+' | '+subtitle;
                    }
                }
                document.title = subtitle+' MyMusic';
            }
        );
        
        /* ----------- Load Song ----------- */
        
        function getMinutesFormat(seconds)
        {
            var minutes = Math.floor(seconds / 60),
                seconds_diff = seconds - minutes * 60;
        
            return minutes+':'+((seconds_diff > 9) ? seconds_diff : '0'+seconds_diff);
        }
        function removeBufferingProgressBar(song_id)
        {
            $('li[data-id="'+song_id+'"]', PLAYLIST).removeClass('buffering');
            $('li[data-id="'+song_id+'"] progress', PLAYLIST).remove();
        }
        function loadNewSong(song_url)
        {
            var request = new XMLHttpRequest(),
                progress_bar = $('li[data-id="'+song_url+'"] progress', PLAYLIST);
            request.open('GET', '/'+MY_SLUG+'collection?path='+song_url, true);
            request.responseType = 'arraybuffer';
            request.onload = function()
            {
                context.decodeAudioData
                (
                    request.response,
                    function(song_buffer)
                    {
                        song_queue[song_url] = song_buffer;
                        removeBufferingProgressBar(song_url);
                    }
                );
            }
            request.addEventListener(
                'progress',
                function(event)
                {
                    if (event.lengthComputable) {
                        progress_bar.val((event.loaded / event.total)*100);
                        progress_bar.css('width', progress_bar.val()+'%');
                    }
                }
            );
            request.send();
        }
        $('#body_wrapper').on
        (
            'click',
            '.file_action_button',
            function(event)
            {
                event.preventDefault();
                var song_url = MY_CURRENT_PATH+'/'+$(this).text();
                PLAYLIST.append(
                    '<li data-length="'+$(this).data('length')+'" data-id="'+song_url+'" title="'+$(this).text()+'\n'+document.title.replace('| MyMusic', '')+'" class="buffering">'
                   +'<progress min="0" max="100" value="0"></progress>'
                   +'<span class="song_length">'+getMinutesFormat($(this).data('length'))+'</span>'
                   +'<span class="song_title">'+$(this).text()+'</span>'
                   +'</li>'
                );
                PLAYLIST.scrollTop(PLAYLIST[0].scrollHeight - PLAYLIST.height());
                if (song_url in song_queue) {
                    removeBufferingProgressBar(song_url);
                } else {
                    loadNewSong(song_url);
                }
            }
        );
    
        /* ----------- Play List Functions ----------- */
        
        function manageSongProgress()
        {
            if (!pause_state) {
                var song_play_time = ((Date.now()-song_start_time)/1000)+increment,
                    progress = Math.floor((100/song_length)*song_play_time);
                if (progress >= 100) {
                     select(NEXT_SONG);
                } else {
                    $('#song_duration').text(getMinutesFormat(parseInt(song_play_time, 10)));
                    $('#inner_progress_bar').css({'width':progress+'%'});                    
                }
            }
        }
        function setSongSource(buffer, offset)
        {
            source = context.createBufferSource();
            source.buffer = buffer;
            source.connect(context.destination); 
            source.start(0, offset);
        }
        function moveUp()
        {
            $.each
            (
                $('.selected', PLAYLIST),
                function() { $(this).prev().before($(this)) }
            );
        }
        function moveDown()
        {
            $.each
            (
                $('.selected', PLAYLIST).get().reverse(),
                function() { $(this).next().after($(this)) }
            );
        }
        function remove()
        {
            $('.selected', PLAYLIST).remove();
        }
        function play()
        {
            var song = ($('.playing', PLAYLIST).length)
                ? $('.playing', PLAYLIST)
                : $('li:first-child', PLAYLIST).addClass('playing');
            if (!song.hasClass('buffering')) {
                playing_state = true;
                if (pause_state) {
                    pause_state = false;
                    setSongSource(song_queue[$('.playing', PLAYLIST).data('id')], song_pause_time);
                } else {
                    setSongSource(song_queue[song.data('id')]);
                }
                $('#player_button_play').hide();
                $('#player_button_pause').show();
                song_length = Math.floor(song.data('length'));
                $('#song_duration').text('0:00');
                song_start_time = Date.now();
                song_progress_interval = setInterval(manageSongProgress, 100);
            }
        }
        function stop()
        {
            if (playing_state)  {
                source.disconnect();
                $('#player_button_pause').hide();
                $('#player_button_play').show();
                playing_state = false;
                clearInterval(song_progress_interval);
                increment = 0;
                $('#inner_progress_bar').css({'width':'0%'});
                $('#song_duration').text('0:00');
            }
        }
        function pause()
        {
            song_pause_time = ((Date.now()-song_start_time)/1000)+increment;
            source.disconnect();
            pause_state = true;
            $('#player_button_pause').hide();
            $('#player_button_play').show();
        }
        function backward()
        {
           increment -= 3;
           var song_play_time = ((Date.now()-song_start_time)/1000)+increment;
           if (song_play_time <= 0) {
               song_play_time = 0;
               increment = 0;
               song_start_time = Date.now();
           }
           source.disconnect();
           setSongSource(song_queue[$('.playing', PLAYLIST).data('id')], song_play_time);
        }
        function forward()
        {
            increment += 3;
            if (!pause_state) {
                var song_play_time = ((Date.now()-song_start_time)/1000)+increment;
                source.disconnect();
                setSongSource(song_queue[$('.playing', PLAYLIST).data('id')], song_play_time);
            }
        }
        function select(song_position)
        {
            increment = 0;
            var current_song = ($('.playing', PLAYLIST).length) ? $('.playing', PLAYLIST) : $('li:first-child', PLAYLIST),
                new_song;
            switch (song_position) {
                case PREVIOUS_SONG:
                    new_song = (current_song.prev().length) ? current_song.prev() : $('li:last-child', PLAYLIST);
                    break;
                case NEXT_SONG:
                    new_song = (current_song.next().length) ? current_song.next() : $('li:first-child', PLAYLIST);
                    break;
            }
            $('li', PLAYLIST).removeClass('playing');
            new_song.addClass('playing');
            if (playing_state) {
                stop();
                play();
            }
        }
        
        /* ----------- Play List Inputs ----------- */

        $(document).keydown
        (
            function(event)
            {
                switch (event.keyCode)
                {
                    case 38:
                        moveUp();
                        break;
                    case 40:
                        moveDown();
                        break;
                    case 46:
                        remove();
                        break;
                    case 32:
                        stop();
                        play();
                        break;
                    case 37:
                        backward();
                        break;
                    case 39:
                        forward();
                        break;
                }
            }
        );
        PLAYLIST.on
        (
            'click',
            'li',
            function()
            {
                if ($(this).hasClass('selected')) {
                    $(this).removeClass('selected');
                } else {
                    $(this).addClass('selected');
                }
            }
        );
        PLAYLIST.on
        (
            'dblclick',
            'li',
            function()
            {
                $('li', PLAYLIST).removeClass('playing');
                $(this).addClass('playing');
                stop();
                play();
            }
        );
        $('#player_button_previous').click(function() { select(PREVIOUS_SONG) });
        $('#player_button_back').click(function() { backward() });
        $('#player_button_pause').click(function() { pause() });
        $('#player_button_play').click(function() { stop(); play(); });
        $('#player_button_stop').click(function() { stop() });
        $('#player_button_forward').click(function() { forward() });
        $('#player_button_next').click(function() { select(NEXT_SONG) });
    }
);