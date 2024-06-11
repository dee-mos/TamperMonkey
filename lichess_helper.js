// ==UserScript==
// @name         Lichess. View Training PGN
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       Dimus
// @require      http://code.jquery.com/jquery-latest.js
// @require      https://raw.githubusercontent.com/Maxxxel/PGN-To-FEN/master/pgntofen.js
// @match        https://lichess.org/training*
// @match        https://lichess.org/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=lichess.org
// @grant        GM_xmlhttpRequest
// @downloadURL  https://raw.githubusercontent.com/dee-mos/TamperMonkey/master/lichess_helper.js
// ==/UserScript==

(function() {

    // Change this to the hostname you gave your raspberry PI when setting up the SD card (add ".local" to the end)
    var boardname = 'centaur.local';
    var game_id;
    var game_color;
    var page_type;

    function getPGNById(id) {
        var pgnurl = 'http://' + boardname + '/getpgn/' + id;
        GM_xmlhttpRequest({
            method: "GET",
            url: pgnurl,
            onload: function(response) {
                document.getElementsByClassName('pair')[1].getElementsByTagName('textarea')[0].value = response.responseText;
                document.getElementById('centaurpgnlist').style.display = 'none';
                document.getElementsByClassName('pair')[1].getElementsByTagName('button')[0].click();
            }
        });
    }

    function getCentaurPGNs() {
        GM_xmlhttpRequest({
            method: 'GET',
            url: 'http://' + boardname + '/getgames/1',
            onload: function(response) {
                const obj = JSON.parse(response.responseText);
                var cb = document.getElementById('selectpgn');
                cb.innerHTML = '';
                var opt = document.createElement('option');
                opt.text = '';
                opt.value = -1;
                cb.options.add(opt);
                for (var x = 0; x < Object.keys(obj).length; x++) {
                    if (obj[x].result == 'None') { obj[x].result = ''; }
                    if (obj[x].created_at == 'None') { obj[x].created_at = ''; }
                    if (obj[x].source == 'None') { obj[x].source = ''; }
                    if (obj[x].event == 'None') { obj[x].event = ''; }
                    if (obj[x].site == 'None') { obj[x].site = ''; }
                    if (obj[x].round == 'None') { obj[x].round = ''; }
                    if (obj[x].white == 'None') { obj[x].white = ''; }
                    if (obj[x].black == 'None') { obj[x].black = ''; }
                    var desc = '';
                    if (obj[x].event != '') { desc = desc + obj[x].event + ',   '; }
                    if (obj[x].site != '') { desc = desc + obj[x].site + ',   '; }
                    if (obj[x].round != '') { desc = desc + obj[x].round + ',   '; }
                    if (obj[x].white != '' || obj[x].black != '') { desc = desc + obj[x].white + ' vs. ' + obj[x].black + ',   '; }
                    if (obj[x].result != '') { desc = desc + obj[x].result + ''; }
                    opt = document.createElement('option');
                    opt.text = desc;
                    opt.value = obj[x].id;
                    cb.options.add(opt);
                }
                cb.addEventListener('change', () => {
                    if (cb.value >= 0) {
                        getPGNById(cb.value);
                    }
                });
            }
        });
    }

    function addListChoicesBox() {
        var lcb = document.createElement('div');
        lcb.id = 'centaurpgnlist';
        lcb.style.backgroundColor = 'white';
        lcb.style.border = '1px solid gray';
        lcb.style.padding = '10px';
        lcb.style.width = '500px';
        lcb.style.height = '60px';
        lcb.style.color = 'black';
        lcb.style.marginLeft = 'auto';
        lcb.style.marginRight = 'auto';
        lcb.style.display = 'none';
        var selectpgn = document.createElement('select');
        selectpgn.id = 'selectpgn';
        selectpgn.style.width = '480px';
        selectpgn.style.color = 'black';
        selectpgn.style.backgroundColor = 'white';
        lcb.appendChild(selectpgn);
        document.body.appendChild(lcb);
    }

    function addCentaurButton() {
        console.log("Adding button");
        var newbutton = document.createElement('button');
        newbutton.classList.add('button');
        newbutton.classList.add('button-thin');
        newbutton.classList.add('action');
        newbutton.classList.add('text');
        newbutton.value = 'DGT Centaur';
        newbutton.innerText = 'DGTCentaur';
        newbutton.style.right = '200px';
        var pgntext = document.getElementsByClassName('pair')[1];
        pgntext.appendChild(newbutton);
        newbutton.addEventListener("click", () => {
            document.getElementById('centaurpgnlist').style.display = '';
        });
    }

    function addCentaurBits() {
        addCentaurButton();
        addListChoicesBox();
        getCentaurPGNs();
    }

   function openWindowWithPost(url, data)
    {
        var form = document.createElement("form");
        form.target = "_blank";
        form.method = "POST";
        form.action = url;
        form.style.display = "none";

        for (var key in data) {
            var input = document.createElement("input");
            input.type = "hidden";
            input.name = key;
            input.value = data[key];
            form.appendChild(input);
        }

        document.body.appendChild(form);
        form.submit();
        document.body.removeChild(form);
    }

    function get_puzzle_real_id()
    {
        var id = $('p:contains("Задача №") a[href^="/training/"]').attr('href').split('/').pop();
        console.log('Puzzle Name = ', id);
        //<p>Задача № <a href="/training/Umaz8">#Umaz8</a></p>
        return id;
    }

    function get_puzzle_pgn()
    {
        game_id = get_puzzle_real_id();

        var pgnurl = 'https://lichess.org/api/puzzle/' + game_id;
        var pgn;
        var puzzle_obj;

        console.log('Get PGN from ' + pgnurl);

        GM_xmlhttpRequest({
            method: "GET",
            url: pgnurl,
            headers: {
                "Content-Type": "application/json"
            },
            onload: function(response) {
                console.log('PGN response:' + response.responseText);
                puzzle_obj = JSON.parse(response.responseText);
                pgn = puzzle_obj.game.pgn;
                console.log(puzzle_obj.game.pgn);
                $('#deemos_pgn').val(puzzle_obj.game.pgn);
                console.log(GetFEN(puzzle_obj.game.pgn));
                window.open("https://lichess.org/analysis/pgn/" + pgn.replace(' ','_'), '_blank');
            }
        });

        /*GM_xmlhttpRequest({
            method: "POST",
            url: "https://lichess.org/api/import",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded;charset=utf-8"
            },
            data:"pgn=" + pgn,
            onload: function(response){
                console.log("Request successful");
                console.log(response.responseText);
            },
            onerror: function(response){
                console.log("Request failed");
            }
        });*/

        /// openWindowWithPost("https://lichess.org/api/import", { pgn: pgn });


    }

    function get_game_pgn(game_id)
    {
        var pgnurl = 'https://lichess.org/game/export/' + game_id;
        var pgn;
        console.log('Get Game by ID ', game_id);
        console.log(pgnurl);
        GM_xmlhttpRequest({
            method: "GET",
            url: pgnurl,
            headers: {
                "Content-Type": "application/json"
            },
            onload: function(response) {
                pgn = response.responseText;
                console.log(pgn);
                //$('#deemos_pgn').val(puzzle_obj.game.pgn);
                console.log(GetFEN(pgn));
            }
        });
    }


    function detect_type_of_board()
    {
        var og_url = document.querySelector('meta[property="og:url"]').content.split('/').at(-1);

        console.log("URI: " + document.documentURI);

        var m = document.documentURI.match('^.*lichess\.org/([0-9a-zA-Z]{12})(/(white|black))?$')
        if(m)
        {
            console.log("GAME: " + m);
            page_type = 1; // game
            game_id = m[1].substring(0,8)
            game_color = m[2]
            return page_type;
        }
        m = document.documentURI.match('^.*lichess\.org/training(/.*)?$')
        if(m)
        {
            game_id  = og_url
            page_type = 2; // puzzle
            console.log("Training: ", m, ", Game ID = ", game_id);
            return page_type;
        }
    }

    function capture_position()
    {
        var pieces = $('piece.white, piece.black');
        pieces.each(function(){
          var classList = $(this).attr('class').split(/\s+/);
          //console.log("piece: " + $(this).css('transform'), classList);
        });
        var board = $('cg-container');
        if(board)
        {
            var board_width = board.css('width').replaceAll(/[^0-9]/g, '');
            var board_height = board.css('height').replaceAll(/[^0-9]/g, '');
            var square_size = board_width / 8;
            //console.log(board_width, board_height);
        }
        console.log( $('div.game__meta__infos > div > div > div > a.variant-link').attr('href') );
    }

    function setup_puzzle_controls()
    {
        var pgn = '<div class="pgn"><div class="pair"><label class="name">PGN</label>' +
                  '<textarea id="deemos_pgn" class="copyable" spellcheck="false"></textarea>' +
                  '<button class="button button-thin action text">Импортировать в PGN</button>' +
                  '<button id="deemos_analyze">Анализ</button>' +
                  '</div></div>';
        console.log($( "div.puzzle__tools" ));
        $( "div.puzzle__side__user" ).after(pgn);
        document.getElementById ("deemos_analyze").addEventListener("click", get_puzzle_pgn, false);
    }

    function setup_controls()
    {
        detect_type_of_board();

        switch(page_type) {
            case 1: // game
                position = capture_position();
                get_game_pgn(game_id);
                break;

            case 2: // puzzle
                setup_puzzle_controls();
                break;
        }
    }

    setTimeout( setup_controls, 2000 );

    })();

